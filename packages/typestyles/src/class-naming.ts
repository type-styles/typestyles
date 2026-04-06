import type { CSSProperties } from './types.js';
import type { ResolvedCascadeLayers } from './layers.js';

/**
 * How generated class names are formed for `styles.create`, `styles.class`,
 * `styles.component`, and related APIs.
 *
 * - `semantic` — readable names like `button-base`, `button-intent-primary` (default).
 * - `hashed` — stable hash from namespace, variant segment, and declarations, with a short namespace slug for debugging.
 * - `atomic` — hash-only names (shortest); same collision properties as `hashed` when `scopeId` differs.
 */
export type ClassNamingMode = 'semantic' | 'hashed' | 'atomic';

export type ClassNamingConfig = {
  mode: ClassNamingMode;
  /** Prefix for hashed / atomic output and for `hashClass`. Default `ts`. */
  prefix: string;
  /**
   * Optional package or app id mixed into hash input so identical logical
   * names from different packages do not produce the same class string.
   */
  scopeId: string;
  /**
   * When set (via `createStyles({ layers: … })`), every `class` / `hashClass` / `component`
   * call must pass `{ layer: … }` and emitted rules are wrapped in `@layer`.
   */
  cascadeLayers?: ResolvedCascadeLayers;
};

/** Default naming options used by `createStyles()` when no overrides are passed. */
export const defaultClassNamingConfig: ClassNamingConfig = {
  mode: 'semantic',
  prefix: 'ts',
  scopeId: '',
};

export function mergeClassNaming(partial?: Partial<ClassNamingConfig>): ClassNamingConfig {
  return { ...defaultClassNamingConfig, ...partial };
}

export function stableSerialize(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableSerialize(v)).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableSerialize(v)}`);

  return `{${entries.join(',')}}`;
}

export function hashString(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function sanitizeClassSegment(label: string): string {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');
  return normalized.replace(/-+/g, '-').replace(/^-|-$/g, '') || 'style';
}

/** CSS custom property namespace segment for `tokens.create` / `createTheme` when `scopeId` is set. */
export function scopedTokenNamespace(
  scopeId: string | undefined,
  logicalNamespace: string,
): string {
  if (!scopeId || !scopeId.trim()) return logicalNamespace;
  return `${sanitizeClassSegment(scopeId)}-${logicalNamespace}`;
}

/** `styles.class(name, …)` */
export function buildSingleClassName(
  cfg: ClassNamingConfig,
  name: string,
  properties: CSSProperties,
): string {
  if (cfg.mode === 'semantic') return name;

  const payload = stableSerialize({
    ...(cfg.scopeId ? { scope: cfg.scopeId } : {}),
    namespace: name,
    suffix: '',
    properties,
  });
  const h = hashString(payload);
  if (cfg.mode === 'atomic') return `${cfg.prefix}-${h}`;
  return `${cfg.prefix}-${sanitizeClassSegment(name)}-${h}`;
}

/**
 * `styles.create` / `styles.component` / components with `slots`: logical namespace plus
 * a variant segment (`base`, `intent-primary`, `root-trigger-primary`, …).
 */
export function buildComponentClassName(
  cfg: ClassNamingConfig,
  namespace: string,
  suffix: string,
  properties: CSSProperties,
): string {
  if (cfg.mode === 'semantic') return `${namespace}-${suffix}`;

  const payload = stableSerialize({
    ...(cfg.scopeId ? { scope: cfg.scopeId } : {}),
    namespace,
    suffix,
    properties,
  });
  const h = hashString(payload);
  if (cfg.mode === 'atomic') return `${cfg.prefix}-${h}`;
  return `${cfg.prefix}-${sanitizeClassSegment(namespace)}-${h}`;
}
