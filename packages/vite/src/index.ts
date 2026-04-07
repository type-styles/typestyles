import type { Plugin, ResolvedConfig, UserConfig } from 'vite';
import { runTypestylesBuild } from '@typestyles/build-runner';

/**
 * Regex patterns to extract namespace strings from typestyles API calls.
 *
 * Matches:
 *   styles.component('button', ...)   → prefix ".button-"
 *   tokens.create('color', ...)       → key "tokens:color"
 *   tokens.createTheme('dark', ...)   → key "theme:dark"  (also createTheme('dark', ...))
 *   keyframes.create('fadeIn', ...)   → key "keyframes:fadeIn"
 *   global.style('body', ...)         → prefix "body"
 *   global.fontFace('Inter', ...)     → prefix "font-face:Inter"
 */
const STYLES_COMPONENT_RE = /styles\.component\(\s*['"]([^'"]+)['"]/g;
const TOKENS_CREATE_RE = /tokens\.create\(\s*['"]([^'"]+)['"]/g;
const CREATE_THEME_RE = /(?:tokens\.)?createTheme\(\s*['"]([^'"]+)['"]/g;
const KEYFRAMES_CREATE_RE = /keyframes\.create\(\s*['"]([^'"]+)['"]/g;
const GLOBAL_STYLE_RE = /global\.style\(\s*['"]([^'"]+)['"]/g;
const GLOBAL_FONT_FACE_RE = /global\.fontFace\(\s*['"]([^'"]+)['"]/g;

/** Check whether a module imports from 'typestyles' */
const TYPESTYLES_IMPORT_RE = /(?:from\s+|import\s+|require\s*\(\s*)['"]typestyles['"]/;

export interface TypestylesExtractOptions {
  /**
   * Modules that should be imported during build to register styles.
   * Paths are resolved relative to Vite's project root.
   */
  modules: string[];
  /**
   * Output CSS filename (in the build assets). Defaults to "typestyles.css".
   */
  fileName?: string;
}

export interface TypestylesPluginOptions {
  /** Warn about duplicate namespaces across modules. Defaults to true. */
  warnDuplicates?: boolean;
  /**
   * Mode for typestyles integration:
   * - `"runtime"`: HMR only, no build-time extraction.
   * - `"build"`: emit a static CSS asset on `vite build` and disable client injection there.
   * - `"hybrid"`: extract on build and keep runtime-compatible behavior.
   *
   * When omitted and `extract.modules` is non-empty, defaults to `"build"`: `vite dev` keeps
   * runtime injection + HMR (runtime is only disabled during `vite build`), serves the same
   * extracted CSS at `extract.fileName` so `<link href="/typestyles.css">` is valid (avoids SPA
   * fallback returning HTML for that URL), and production emits the CSS file. With no `extract`
   * config, defaults to `"runtime"`.
   */
  mode?: 'runtime' | 'build' | 'hybrid';
  /**
   * Options for build-time CSS extraction when mode is "build" or "hybrid".
   */
  extract?: TypestylesExtractOptions;
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
 * When a module that uses typestyles is edited, this plugin injects HMR
 * accept/dispose handlers that invalidate the module's style registrations
 * before re-execution — so updated CSS takes effect without a full reload.
 */
export default function typestylesPlugin(options: TypestylesPluginOptions = {}): Plugin {
  const { warnDuplicates = true, extract } = options;
  const extractModules = extract?.modules ?? [];
  const mode = options.mode ?? (extractModules.length > 0 ? 'build' : 'runtime');

  // Track namespaces per module for duplicate detection
  const moduleNamespaces = new Map<string, { keys: string[]; prefixes: string[] }>();
  let resolvedConfig: ResolvedConfig | null = null;
  let isBuildCommand = false;

  /** Dev-only cache for on-demand extract CSS (avoids SPA fallback serving HTML for the link href). */
  let devExtractCss: string | null = null;
  let devExtractInFlight: Promise<string> | null = null;

  return {
    name: 'typestyles',
    enforce: 'pre',

    config(config: UserConfig, env) {
      isBuildCommand = env.command === 'build';

      if (env.command === 'build' && (mode === 'build' || mode === 'hybrid')) {
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
    },

    configureServer(server) {
      if (!extract || extractModules.length === 0) return;
      if (mode === 'runtime') return;

      const fileName = extract.fileName ?? 'typestyles.css';

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
              modules: extractModules,
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

      // Only transform modules that import from typestyles
      if (!TYPESTYLES_IMPORT_RE.test(code)) return null;

      const { keys, prefixes } = extractNamespaces(code);

      // Nothing to invalidate
      if (keys.length === 0 && prefixes.length === 0) return null;

      // Duplicate namespace detection
      if (warnDuplicates) {
        for (const [otherId, other] of moduleNamespaces) {
          if (otherId === id) continue;
          for (const prefix of prefixes) {
            if (other.prefixes.includes(prefix)) {
              const ns = prefix.slice(1, -1); // strip leading "." and trailing "-"
              this.warn(
                `Style namespace "${ns}" is also used in ${otherId}. ` +
                  `Duplicate namespaces cause class name collisions.`,
              );
            }
          }
        }
      }

      moduleNamespaces.set(id, { keys, prefixes });

      // Inject HMR code (dev/runtime path). Even in "build" mode this is
      // effectively dev-only because import.meta.hot is stripped in production.
      const keysJSON = JSON.stringify(keys);
      const prefixesJSON = JSON.stringify(prefixes);

      const hmrCode = `
if (import.meta.hot) {
  import('typestyles/hmr').then(({ invalidateKeys: __typestyles_invalidateKeys }) => {
    import.meta.hot.accept();
    import.meta.hot.dispose(() => {
      __typestyles_invalidateKeys(${keysJSON}, ${prefixesJSON});
    });
  });
}`;

      return {
        code: code + hmrCode,
        map: null,
      };
    },

    async generateBundle() {
      if (!isBuildCommand) return;
      if (mode === 'runtime') return;
      if (!extract || !extractModules.length) return;
      if (!resolvedConfig) return;

      const root = resolvedConfig.root ?? process.cwd();
      const fileName = extract.fileName ?? 'typestyles.css';

      try {
        const css = await runTypestylesBuild({
          root,
          modules: extractModules,
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
