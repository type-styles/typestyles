import { resolve as resolvePath } from 'node:path';
import type { Plugin, ResolvedConfig, UserConfig } from 'vite';
import { discoverDefaultExtractModules, runTypestylesBuild } from '@typestyles/build-runner';

/** Re-export shared convention discovery (same paths as `@typestyles/next/build`). */
export {
  DEFAULT_EXTRACT_MODULE_CANDIDATES,
  discoverDefaultExtractModules,
} from '@typestyles/build-runner';

/**
 * Regex patterns to extract namespace strings from typestyles API calls.
 *
 * Matches:
 *   styles.component('button', ...)   → prefix ".button-"
 *   styles.class('card', ...)         → prefix ".card-"
 *   tokens.create('color', ...)       → key "tokens:color"
 *   tokens.createTheme('dark', ...)   → key "theme:dark"  (also createTheme('dark', ...))
 *   keyframes.create('fadeIn', ...)   → key "keyframes:fadeIn"
 *   global.style('body', ...)         → prefix "body"
 *   global.fontFace('Inter', ...)     → prefix "font-face:Inter"
 */
const STYLES_COMPONENT_RE = /styles\.component\(\s*['"]([^'"]+)['"]/g;
const STYLES_CLASS_RE = /styles\.class\(\s*['"]([^'"]+)['"]/g;
const TOKENS_CREATE_RE = /tokens\.create\(\s*['"]([^'"]+)['"]/g;
const CREATE_THEME_RE = /(?:tokens\.)?createTheme\(\s*['"]([^'"]+)['"]/g;
const KEYFRAMES_CREATE_RE = /keyframes\.create\(\s*['"]([^'"]+)['"]/g;
const GLOBAL_STYLE_RE = /global\.style\(\s*['"]([^'"]+)['"]/g;
const GLOBAL_FONT_FACE_RE = /global\.fontFace\(\s*['"]([^'"]+)['"]/g;

export interface TypestylesExtractOptions {
  /**
   * Modules that should be imported during build to register styles.
   * Paths are resolved relative to Vite's project root.
   *
   * When omitted, the plugin looks for the first existing file among
   * {@link DEFAULT_EXTRACT_MODULE_CANDIDATES} under the project root (same resolution as when
   * `extract` itself is omitted).
   */
  modules?: string[];
  /**
   * Output CSS filename (in the build assets). Defaults to "typestyles.css".
   */
  fileName?: string;
}

export interface TypestylesPluginOptions {
  /**
   * When true (default), fail the build if the same logical `styles.component` / `styles.class`
   * namespace appears in more than one module. Set to `false` to skip this check.
   */
  warnDuplicates?: boolean;
  /**
   * Mode for typestyles integration:
   * - `"runtime"`: HMR only, no build-time extraction.
   * - `"build"`: emit a static CSS asset on `vite build` and disable client injection there.
   * - `"hybrid"`: extract on build and keep runtime-compatible behavior.
   *
   * When omitted and at least one extraction module is resolved (explicit `extract.modules`, or a
   * discovered convention entry file), defaults to `"build"`: `vite dev` keeps runtime
   * injection + HMR (runtime is only disabled during `vite build`), serves the same extracted CSS
   * at `extract.fileName` so `<link href="/typestyles.css">` is valid (avoids SPA fallback
   * returning HTML for that URL), and production emits the CSS file. If no modules are resolved,
   * defaults to `"runtime"`.
   */
  mode?: 'runtime' | 'build' | 'hybrid';
  /**
   * Options for build-time CSS extraction when mode is "build" or "hybrid".
   *
   * Omitted entirely: discover a convention entry under the project root (see
   * {@link discoverDefaultExtractModules}); if none exist, stays in runtime-only mode.
   */
  extract?: TypestylesExtractOptions;
}

function resolveExtractModules(
  root: string,
  extract: TypestylesExtractOptions | undefined,
): string[] {
  if (extract?.modules !== undefined) {
    return extract.modules;
  }
  return discoverDefaultExtractModules(root);
}

/**
 * Extract namespace information from source code.
 * Returns { keys, prefixes } for invalidation.
 */
export function extractNamespaces(code: string): {
  keys: string[];
  prefixes: string[];
} {
  const keys: string[] = [];
  const prefixes: string[] = [];

  for (const match of code.matchAll(STYLES_COMPONENT_RE)) {
    prefixes.push(`.${match[1]}-`);
  }

  for (const match of code.matchAll(STYLES_CLASS_RE)) {
    prefixes.push(`.${match[1]}-`);
  }

  for (const match of code.matchAll(TOKENS_CREATE_RE)) {
    keys.push(`tokens:${match[1]}`);
  }

  for (const match of code.matchAll(CREATE_THEME_RE)) {
    keys.push(`theme:${match[1]}`);
  }

  for (const match of code.matchAll(KEYFRAMES_CREATE_RE)) {
    keys.push(`keyframes:${match[1]}`);
  }

  for (const match of code.matchAll(GLOBAL_STYLE_RE)) {
    prefixes.push(match[1]);
  }

  for (const match of code.matchAll(GLOBAL_FONT_FACE_RE)) {
    prefixes.push(`font-face:${match[1]}`);
  }

  return { keys, prefixes };
}

/**
 * Vite plugin for typestyles HMR support.
 *
 * When a module that registers typestyles (e.g. `styles.component`, `styles.class`, `tokens.create`) is edited,
 * this plugin injects HMR accept/dispose handlers that invalidate that module's registrations
 * before re-execution. Files may import from a local re-export such as `./typestyles` rather
 * than `from 'typestyles'` directly — we key off API call patterns in the source, not the import path.
 */
export default function typestylesPlugin(options: TypestylesPluginOptions = {}): Plugin {
  const { warnDuplicates = true, extract } = options;

  /** Effective module list after optional convention discovery; set in `config`. */
  let resolvedExtractModules: string[] = [];
  let resolvedMode: 'runtime' | 'build' | 'hybrid' = 'runtime';

  // Track namespaces per module for duplicate detection
  const moduleNamespaces = new Map<string, { keys: string[]; prefixes: string[] }>();
  let resolvedConfig: ResolvedConfig | null = null;
  let isBuildCommand = false;
  /** HMR injection only during dev server — avoids pulling `typestyles/hmr` into production bundles. */
  let isServe = false;

  /** Dev-only cache for on-demand extract CSS (avoids SPA fallback serving HTML for the link href). */
  let devExtractCss: string | null = null;
  let devExtractInFlight: Promise<string> | null = null;

  return {
    name: 'typestyles',
    enforce: 'pre',

    config(config: UserConfig, env) {
      isBuildCommand = env.command === 'build';

      const root = resolvePath(config.root ?? process.cwd());
      resolvedExtractModules = resolveExtractModules(root, extract);
      resolvedMode = options.mode ?? (resolvedExtractModules.length > 0 ? 'build' : 'runtime');

      if (env.command === 'build' && (resolvedMode === 'build' || resolvedMode === 'hybrid')) {
        config.define = {
          ...(config.define ?? {}),
          // Inlined by the bundler so typestyles sheet skips creating <style> in production
          __TYPESTYLES_RUNTIME_DISABLED__: JSON.stringify('true'),
        };
      }

      return config;
    },

    configResolved(config) {
      resolvedConfig = config;
      isServe = config.command === 'serve';
    },

    configureServer(server) {
      if (resolvedExtractModules.length === 0) return;
      if (resolvedMode === 'runtime') return;

      const fileName = extract?.fileName ?? 'typestyles.css';

      const invalidateDevExtract = (): void => {
        devExtractCss = null;
        devExtractInFlight = null;
      };

      server.watcher.on('change', invalidateDevExtract);
      server.watcher.on('add', invalidateDevExtract);
      server.watcher.on('unlink', invalidateDevExtract);

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          next();
          return;
        }
        const config = resolvedConfig;
        if (!config) {
          next();
          return;
        }

        const url = req.url?.split('?')[0] ?? '';
        const base = config.base.replace(/\/$/, '') || '';
        const expectedPath =
          base === '' || base === '/'
            ? `/${fileName.replace(/^\//, '')}`
            : `${base}/${fileName.replace(/^\//, '')}`;

        if (url !== expectedPath) {
          next();
          return;
        }

        const root = config.root ?? process.cwd();

        try {
          if (devExtractCss !== null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(devExtractCss);
            return;
          }
          if (!devExtractInFlight) {
            devExtractInFlight = runTypestylesBuild({
              root,
              modules: resolvedExtractModules,
            })
              .then((css) => {
                devExtractCss = css;
                return css;
              })
              .finally(() => {
                devExtractInFlight = null;
              });
          }
          const css = await devExtractInFlight;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(css);
        } catch (err) {
          next(err);
        }
      });
    },

    transform(code, id) {
      // Skip non-JS/TS modules and node_modules
      if (!/\.[jt]sx?$/.test(id)) return null;
      if (id.includes('node_modules')) return null;

      const { keys, prefixes } = extractNamespaces(code);

      // Nothing to invalidate (no typestyles registration calls in this file)
      if (keys.length === 0 && prefixes.length === 0) return null;

      // Duplicate namespace detection (build error — not a warning)
      if (warnDuplicates) {
        for (const [otherId, other] of moduleNamespaces) {
          if (otherId === id) continue;
          for (const prefix of prefixes) {
            if (other.prefixes.includes(prefix)) {
              const ns = prefix.slice(1, -1); // strip leading "." and trailing "-"
              this.error(
                `[typestyles] Style namespace "${ns}" is also used in ${otherId}. ` +
                  `Duplicate namespaces cause class name collisions. ` +
                  `Use a distinct name or isolate with createStyles({ scopeId: fileScopeId(import.meta) }).`,
              );
            }
          }
        }
      }

      moduleNamespaces.set(id, { keys, prefixes });

      if (!isServe) {
        return null;
      }

      // Dev-only: synchronous dispose must run invalidateKeys before the updated module re-executes.
      // A dynamic import().then(...) registers dispose too late and can load a different chunk than the
      // app's `typestyles` singleton, so the registry never clears.
      const keysJSON = JSON.stringify(keys);
      const prefixesJSON = JSON.stringify(prefixes);

      const hmrImport = `import { invalidateKeys as __typestylesInvalidateKeys } from 'typestyles/hmr';\n`;
      const hmrCode = `
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    __typestylesInvalidateKeys(${keysJSON}, ${prefixesJSON});
  });
}`;

      return {
        code: hmrImport + code + hmrCode,
        map: null,
      };
    },

    async generateBundle() {
      if (!isBuildCommand) return;
      if (resolvedMode === 'runtime') return;
      if (!resolvedExtractModules.length) return;
      if (!resolvedConfig) return;

      const root = resolvedConfig.root ?? process.cwd();
      const fileName = extract?.fileName ?? 'typestyles.css';

      try {
        const css = await runTypestylesBuild({
          root,
          modules: resolvedExtractModules,
        });
        this.emitFile({
          type: 'asset',
          fileName,
          source: css,
        });
      } catch (err) {
        this.error(
          `[typestyles] Failed to extract CSS: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  };
}
