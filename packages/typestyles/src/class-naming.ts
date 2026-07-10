import type { CSSProperties } from './types';
import type { ResolvedCascadeLayers } from './layers';
import { trackEmittedClassName } from './registry';

/**
 * How generated class names are formed for `styles.class`, `styles.component`,
 * and related APIs.
 *
 * - `semantic` — readable names like `button-base`, `button-intent-primary` (default).
 *   With `scopeId` set, names are prefixed with the sanitized scope: `my-ui-button-base`.
 * - `hashed` — stable hash from namespace, variant segment, and declarations, with a short namespace slug for debugging.
 * - `compact` — hash-only names (shortest) for whole style objects; same collision properties as `hashed` when `scopeId` differs.
 * - `atomic` — one class per CSS declaration; identical declarations dedupe across the codebase.
 * - `attribute` — dimensioned `styles.component()` variants compile to `&[data-{dimension}="{option}"]`
 *   selectors under one base class instead of discrete classes; the call returns
 *   `{ className, attrs, props }`. See `specs/attribute-driven-variants.md`. Not supported for
 *   `slots` or flat configs — `styles.class()` and flat configs behave like `semantic`.
 * - `bem` — dimensioned/slot `styles.component()` variants compile to BEM modifier classes
 *   (`block--modifier`, `block__element--modifier`); the base/root class drops the `-base` suffix.
 *   See `specs/bem-variant-mode.md`. `styles.class()` and flat configs behave like `semantic`.
 */
export type ClassNamingMode = 'semantic' | 'hashed' | 'compact' | 'atomic' | 'attribute' | 'bem';

export type ClassNamingConfig = {
  mode: ClassNamingMode;
  /** Prefix for hashed / compact / atomic output and for `hashClass`. Default `ts`. */
  prefix: string;
  /**
   * Package, app, or per-file id: same logical `styles.component` / `styles.class` name under different
   * scopes produces different classes — in `semantic` mode the sanitized scope is prefixed onto the
   * class name (`my-ui-button-base`); in `hashed`/`compact`/`atomic` mode it is mixed into the hash. This matches
   * how `tokens.create` scopes custom property names. In development, re-registering the same
   * scope + component name (e.g. HMR) clears prior rules instead of throwing. Use
   * `fileScopeId(import.meta)` for file-local isolation (CSS Modules–style).
   */
  scopeId: string;
  /**
   * When set (via `createStyles({ layers: … })`), every `class` / `hashClass` / `component`
   * call must pass `{ layer: … }` and emitted rules are wrapped in `@layer`.
   */
  cascadeLayers?: ResolvedCascadeLayers;
  /**
   * Breakpoint names → media query conditions (without `@media` wrapper).
   * Enables `{ base, md, lg }` shorthand on CSS property values.
   */
  breakpoints?: Record<string, string>;
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

/**
 * Stable, short id derived from `import.meta.url` (file path). Use as `createStyles({ scopeId: fileScopeId(import.meta) })`
 * so the same logical namespace in different files does not collide (similar to CSS Modules file scope).
 *
 * @example
 * ```ts
 * const styles = createStyles({ scopeId: fileScopeId(import.meta) });
 * styles.component('button', { base: { padding: '8px' } });
 * ```
 */
export function fileScopeId(meta: { url: string }): string {
  let pathKey = meta.url;
  try {
    pathKey = new URL(meta.url).pathname;
  } catch {
    // keep raw url
  }
  return `file-${hashString(pathKey)}`;
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

/**
 * Sanitized scope prefix used for `semantic` mode class names, mirroring how
 * `scopedTokenNamespace` scopes custom property names. Empty when no `scopeId`.
 */
function semanticScopePrefix(cfg: ClassNamingConfig): string {
  if (!cfg.scopeId || !cfg.scopeId.trim()) return '';
  return `${sanitizeClassSegment(cfg.scopeId)}-`;
}

function ownerKey(cfg: ClassNamingConfig, namespace: string): string {
  return `${cfg.scopeId || 'default'}:${namespace}`;
}

/**
 * The emitted class-name prefix shared by every class a `styles.component(namespace, …)`
 * call produces under this naming config (no leading dot). `null` in `compact`/`atomic` mode —
 * hash-only names have no per-namespace prefix; atomic mode also omits a shared variant prefix.
 */
export function emittedComponentClassPrefix(
  cfg: ClassNamingConfig,
  namespace: string,
): string | null {
  // No trailing delimiter (BEM has none) — dev-mode HMR invalidation (sheet.ts) matches by
  // substring, so this can over-match a sibling namespace that's a string-prefix of this one
  // (e.g. invalidating "button" also touches "buttongroup"). Narrow, dev-only edge case; not
  // worth a delimiter that would break real BEM output.
  if (cfg.mode === 'bem') return `${semanticScopePrefix(cfg)}${namespace}`;
  if (cfg.mode === 'semantic' || cfg.mode === 'attribute')
    return `${semanticScopePrefix(cfg)}${namespace}-`;
  if (cfg.mode === 'hashed') return `${cfg.prefix}-${sanitizeClassSegment(namespace)}-`;
  return null;
}

/**
 * The emitted class name a `styles.class(name, …)` call produces under this naming config.
 * `null` in `hashed`/`compact`/`atomic` mode — the name is derived from the serialized
 * properties, which aren't available before they're computed.
 */
export function emittedClassName(cfg: ClassNamingConfig, name: string): string | null {
  if (cfg.mode === 'semantic' || cfg.mode === 'attribute' || cfg.mode === 'bem')
    return `${semanticScopePrefix(cfg)}${name}`;
  return null;
}

/** `styles.class(name, …)` */
export function buildSingleClassName(
  cfg: ClassNamingConfig,
  name: string,
  properties: CSSProperties,
): string {
  if (cfg.mode === 'semantic' || cfg.mode === 'attribute' || cfg.mode === 'bem') {
    const className = `${semanticScopePrefix(cfg)}${name}`;
    trackEmittedClassName(className, ownerKey(cfg, name));
    return className;
  }

  const payload = stableSerialize({
    ...(cfg.scopeId ? { scope: cfg.scopeId } : {}),
    namespace: name,
    suffix: '',
    properties,
  });
  const h = hashString(payload);
  const className =
    cfg.mode === 'compact'
      ? `${cfg.prefix}-${h}`
      : `${cfg.prefix}-${sanitizeClassSegment(name)}-${h}`;
  trackEmittedClassName(className, ownerKey(cfg, name));
  return className;
}

/**
 * `styles.component` / components with `slots`: logical namespace plus
 * a variant segment (`base`, `intent-primary`, `root-trigger-primary`, …).
 */
export function buildComponentClassName(
  cfg: ClassNamingConfig,
  namespace: string,
  suffix: string,
  properties: CSSProperties,
): string {
  if (cfg.mode === 'semantic' || cfg.mode === 'attribute' || cfg.mode === 'bem') {
    const className = `${semanticScopePrefix(cfg)}${namespace}-${suffix}`;
    trackEmittedClassName(className, ownerKey(cfg, namespace));
    return className;
  }

  const payload = stableSerialize({
    ...(cfg.scopeId ? { scope: cfg.scopeId } : {}),
    namespace,
    suffix,
    properties,
  });
  const h = hashString(payload);
  const className =
    cfg.mode === 'compact'
      ? `${cfg.prefix}-${h}`
      : `${cfg.prefix}-${sanitizeClassSegment(namespace)}-${h}`;
  trackEmittedClassName(className, ownerKey(cfg, namespace));
  return className;
}

/**
 * `mode: 'bem'` naming — see `specs/bem-variant-mode.md`. Pure string templates (BEM is always
 * readable, never hashed), with the same registry tracking `buildComponentClassName` does.
 */

/** The `root` slot / single-component base class: the bare block, e.g. `button`, `my-ui-dialog`. */
export function buildBemBlockClassName(cfg: ClassNamingConfig, namespace: string): string {
  const className = `${semanticScopePrefix(cfg)}${namespace}`;
  trackEmittedClassName(className, ownerKey(cfg, namespace));
  return className;
}

/** A non-`root` slot: `${block}__${slot}`, e.g. `dialog__trigger`. */
export function buildBemElementClassName(
  cfg: ClassNamingConfig,
  namespace: string,
  slot: string,
): string {
  const className = `${semanticScopePrefix(cfg)}${namespace}__${slot}`;
  trackEmittedClassName(className, ownerKey(cfg, namespace));
  return className;
}

/**
 * A modifier on a given block or element class: `${blockOrElementClassName}--${option}`.
 * `blockOrElementClassName` is whatever `buildBemBlockClassName`/`buildBemElementClassName`
 * already returned for this component/slot — callers pass it through rather than recomputing it,
 * so this never re-derives the scope prefix.
 */
export function buildBemModifierClassName(
  cfg: ClassNamingConfig,
  namespace: string,
  blockOrElementClassName: string,
  option: string,
): string {
  const className = `${blockOrElementClassName}--${option}`;
  trackEmittedClassName(className, ownerKey(cfg, namespace));
  return className;
}
