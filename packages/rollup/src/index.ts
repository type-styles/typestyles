import type { Plugin } from 'rollup';
import { runTypestylesBuild } from '@typestyles/build-runner';

const STYLES_CREATE_RE = /styles\.create\(\s*['"]([^'"]+)['"]/g;
const STYLES_COMPONENT_RE = /styles\.component\(\s*['"]([^'"]+)['"]/g;
const TOKENS_CREATE_RE = /tokens\.create\(\s*['"]([^'"]+)['"]/g;
const CREATE_THEME_RE = /(?:tokens\.)?createTheme\(\s*['"]([^'"]+)['"]/g;
const KEYFRAMES_CREATE_RE = /keyframes\.create\(\s*['"]([^'"]+)['"]/g;
const GLOBAL_STYLE_RE = /global\.style\(\s*['"]([^'"]+)['"]/g;
const GLOBAL_FONT_FACE_RE = /global\.fontFace\(\s*['"]([^'"]+)['"]/g;
const TYPESTYLES_IMPORT_RE = /(?:from\s+|import\s+|require\s*\(\s*)['"]typestyles['"]/;

export interface TypestylesExtractOptions {
  /**
   * Modules that should be imported during build to register styles.
   * Paths are resolved relative to `root`.
   */
  modules: string[];
  /**
   * Output CSS filename (emitted build asset). Defaults to "typestyles.css".
   */
  fileName?: string;
}

export interface TypestylesRollupPluginOptions {
  /** Warn about duplicate namespaces across modules. Defaults to true. */
  warnDuplicates?: boolean;
  /**
   * Integration mode:
   * - "runtime" (default): no static extraction.
   * - "build": emit static CSS and disable runtime insertion.
   * - "hybrid": emit static CSS and keep runtime-compatible dev behavior.
   */
  mode?: 'runtime' | 'build' | 'hybrid';
  /**
   * Build-time extraction options for "build" and "hybrid" modes.
   */
  extract?: TypestylesExtractOptions;
  /**
   * Project root used to resolve `extract.modules`.
   * Defaults to process.cwd().
   */
  root?: string;
}

export function extractNamespaces(code: string): {
  keys: string[];
  prefixes: string[];
} {
  const keys: string[] = [];
  const prefixes: string[] = [];

  for (const match of code.matchAll(STYLES_CREATE_RE)) {
    prefixes.push(`.${match[1]}-`);
  }
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
 * Rollup plugin for typestyles runtime + optional static extraction.
 *
 * Rolldown supports Rollup-compatible plugins, so this plugin also works
 * as a starting integration there.
 */
export default function typestylesRollupPlugin(
  options: TypestylesRollupPluginOptions = {},
): Plugin {
  const { warnDuplicates = true, mode = 'runtime', extract, root = process.cwd() } = options;
  const moduleNamespaces = new Map<string, { keys: string[]; prefixes: string[] }>();

  return {
    name: 'typestyles-rollup',

    transform(code, id) {
      // Disable typestyles runtime insertion in production bundles by replacing
      // compile-time constant checks in typestyles internals.
      if (
        (mode === 'build' || mode === 'hybrid') &&
        code.includes('__TYPESTYLES_RUNTIME_DISABLED__')
      ) {
        return {
          code: code.replace(/__TYPESTYLES_RUNTIME_DISABLED__/g, '"true"'),
          map: null,
        };
      }

      if (!/\.[jt]sx?$/.test(id)) return null;
      if (id.includes('node_modules')) return null;
      if (!TYPESTYLES_IMPORT_RE.test(code)) return null;

      const { keys, prefixes } = extractNamespaces(code);
      if (keys.length === 0 && prefixes.length === 0) return null;

      if (warnDuplicates) {
        for (const [otherId, other] of moduleNamespaces) {
          if (otherId === id) continue;
          for (const prefix of prefixes) {
            if (other.prefixes.includes(prefix)) {
              const ns = prefix.slice(1, -1);
              this.warn(
                `Style namespace "${ns}" is also used in ${otherId}. ` +
                  `Duplicate namespaces cause class name collisions.`,
              );
            }
          }
        }
      }

      moduleNamespaces.set(id, { keys, prefixes });
      return null;
    },

    async generateBundle() {
      if (mode === 'runtime') return;
      if (!extract || !extract.modules.length) return;

      try {
        const css = await runTypestylesBuild({
          root,
          modules: extract.modules,
        });
        this.emitFile({
          type: 'asset',
          fileName: extract.fileName ?? 'typestyles.css',
          source: css,
        });
      } catch (error) {
        this.error(
          `[typestyles] Failed to extract CSS: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  };
}
