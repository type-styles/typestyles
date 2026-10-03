import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

/**
 * Base paths (without extension) checked when no explicit extraction entry is configured.
 * For each base, discovery tries `.ts`, `.tsx`, `.js`, and `.mjs` in that order.
 */
export const DEFAULT_EXTRACT_MODULE_BASES = [
  'src/typestyles-entry',
  'src/typestyles',
  'src/styles/index',
  'src/styles',
  'styles/typestyles-entry',
  'styles/typestyles',
] as const;

const DISCOVERY_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs'] as const;

/**
 * Relative `.ts` paths documented for convention entries (first extension per base).
 * Shared by bundler integrations and `@typestyles/next/build`.
 */
export const DEFAULT_EXTRACT_MODULE_CANDIDATES = DEFAULT_EXTRACT_MODULE_BASES.map(
  (base) => `${base}.ts`,
) as readonly string[];

/**
 * Side-effect modules that import every recipe and export `getRegisteredComponentRefs(styles)`.
 * Used when `extract.include` is `"allRegisteredComponents"`.
 */
export const DEFAULT_REGISTERED_COMPONENTS_MODULE_BASES = [
  'src/themeable-refs',
  'src/typestyles/themeable-refs',
  'src/typestyles-registry',
  'styles/themeable-refs',
] as const;

/**
 * Resolve the default extraction module when the user did not pass explicit `modules`.
 * Returns at most one path using `/` separators, relative to `root`.
 */
export function discoverDefaultExtractModules(root: string): string[] {
  const absRoot = resolvePath(root);
  for (const base of DEFAULT_EXTRACT_MODULE_BASES) {
    for (const ext of DISCOVERY_EXTENSIONS) {
      const rel = `${base}${ext}`;
      if (existsSync(resolvePath(absRoot, rel))) {
        return [rel.replace(/\\/g, '/')];
      }
    }
  }
  return [];
}

/**
 * Convention registry module for `extract.include: 'allRegisteredComponents'`.
 * The file should import all recipe modules and
 * export `getRegisteredComponentRefs(styles)` from your `createTypeStyles` entry.
 */
export function discoverRegisteredComponentsModule(root: string): string | undefined {
  const absRoot = resolvePath(root);
  for (const base of DEFAULT_REGISTERED_COMPONENTS_MODULE_BASES) {
    for (const ext of DISCOVERY_EXTENSIONS) {
      const rel = `${base}${ext}`;
      if (existsSync(resolvePath(absRoot, rel))) {
        return rel.replace(/\\/g, '/');
      }
    }
  }
  return undefined;
}
