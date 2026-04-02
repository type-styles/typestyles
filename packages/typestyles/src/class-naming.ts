import type { CSSProperties } from './types.js';

/**
 * How generated class names are formed for `styles.component`, `styles.class`,
 * and related APIs.
 *
 * - `semantic` — readable names like `button`, `button-intent-primary` (default).
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
};

const defaultConfig: ClassNamingConfig = {
  mode: 'semantic',
  prefix: 'ts',
  scopeId: '',
};

let current: ClassNamingConfig = { ...defaultConfig };

export function getClassNamingConfig(): Readonly<ClassNamingConfig> {
  return current;
}

/**
 * Set global class naming options. Call once at app or package entry
 * (e.g. design-system `index.ts`) for per-package adoption in a monorepo.
 */
export function configureClassNaming(partial: Partial<ClassNamingConfig>): void {
  current = { ...current, ...partial };
}

/** Restore defaults (primarily for tests). */
export function resetClassNaming(): void {
  current = { ...defaultConfig };
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

/** `styles.class(name, …)` and base class for `styles.component(name, …)` */
export function buildSingleClassName(name: string, properties: CSSProperties): string {
  const cfg = getClassNamingConfig();
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
 * `styles.component` variant classes: logical namespace plus
 * a variant segment (`intent-primary`, `root-trigger-primary`, …).
 */
export function buildComponentClassName(
  namespace: string,
  suffix: string,
  properties: CSSProperties,
): string {
  const cfg = getClassNamingConfig();
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
