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
