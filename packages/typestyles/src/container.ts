import { sanitizeClassSegment } from './class-naming.js';

/**
 * Object key for nested styles: `@container … { … }`.
 * Returned by {@link container} for typed container queries (see also raw `@container` strings).
 */
export type ContainerQueryKey = `@container ${string}`;

/**
 * Typed `container-name` from {@link createContainerRef} or `styles.containerRef()` (human-readable; use for `containerName` and {@link container}).
 */
export type ContainerNameRef = string & { readonly __containerNameRef?: true };

/**
 * Size features for {@link container}. Maps to parenthesis groups joined with `and`.
 * Numbers become `px` except `aspectRatio` (emitted as a number or pass a string like `16 / 9`).
 */
export type ContainerQueryFeatures = {
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  minInlineSize?: string | number;
  maxInlineSize?: string | number;
  minBlockSize?: string | number;
  maxBlockSize?: string | number;
  aspectRatio?: string | number;
  orientation?: 'portrait' | 'landscape';
};

/**
 * Named container + size features (`name` matches `containerName` on an ancestor).
 */
export type ContainerQueryObject = ContainerQueryFeatures & {
  name?: string;
};

const FEATURE_ORDER: ReadonlyArray<{
  key: keyof ContainerQueryFeatures;
  cssName: string;
  valueKind: 'length' | 'aspect' | 'orientation';
}> = [
  { key: 'minWidth', cssName: 'min-width', valueKind: 'length' },
  { key: 'maxWidth', cssName: 'max-width', valueKind: 'length' },
  { key: 'minHeight', cssName: 'min-height', valueKind: 'length' },
  { key: 'maxHeight', cssName: 'max-height', valueKind: 'length' },
  { key: 'minInlineSize', cssName: 'min-inline-size', valueKind: 'length' },
  { key: 'maxInlineSize', cssName: 'max-inline-size', valueKind: 'length' },
  { key: 'minBlockSize', cssName: 'min-block-size', valueKind: 'length' },
  { key: 'maxBlockSize', cssName: 'max-block-size', valueKind: 'length' },
  { key: 'aspectRatio', cssName: 'aspect-ratio', valueKind: 'aspect' },
  { key: 'orientation', cssName: 'orientation', valueKind: 'orientation' },
];

function emitFeatureValue(
  value: string | number,
  kind: 'length' | 'aspect' | 'orientation',
): string {
  if (kind === 'orientation') {
    return String(value);
  }
  if (typeof value === 'number') {
    if (kind === 'aspect') {
      return String(value);
    }
    if (value === 0) {
      return '0';
    }
    return `${value}px`;
  }
  return value;
}

export type CreateContainerRefOptions = {
  /**
   * When non-empty, the name is `{scopeId}-{label}` (sanitized), same as `createStyles({ scopeId })`.
   * When empty, the name is `{prefix}-{label}` instead.
   */
  scopeId?: string;
  /**
   * Used only if **`scopeId`** is empty: `{prefix}-{label}`. Default `ts` (same default as class `prefix`).
   */
  prefix?: string;
};

/**
 * Build a **human-readable** `container-name`: share one value between `containerName` and {@link container}’s `name` argument without repeating string literals.
 *
 * Shape: **`{scopeId}-{label}`** when `scopeId` is set, else **`{prefix}-{label}`** (defaults match `createStyles`).
 *
 * Prefer **`styles.containerRef(label)`** so `scopeId` / `prefix` come from your instance.
 *
 * @example
 * ```ts
 * const shell = createContainerRef('product-shell', { scopeId: 'my-app' });
 *
 * styles.class('shell', {
 *   containerType: 'inline-size',
 *   containerName: shell,
 * });
 *
 * styles.class('shell-body', {
 *   ...styles.atRuleBlock(styles.container(shell, { minWidth: 480 }), { flexDirection: 'row' }),
 * });
 * ```
 */
export function createContainerRef(
  label: string,
  options?: CreateContainerRefOptions,
): ContainerNameRef {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error('[typestyles] createContainerRef(label): label must not be empty.');
  }

  const segment = sanitizeClassSegment(trimmed);
  const scopeId = options?.scopeId?.trim() ?? '';

  if (scopeId) {
    return `${sanitizeClassSegment(scopeId)}-${segment}` as ContainerNameRef;
  }

  const prefixRaw = options?.prefix?.trim() || 'ts';
  return `${sanitizeClassSegment(prefixRaw)}-${segment}` as ContainerNameRef;
}

function conditionFromFeatures(features: ContainerQueryFeatures): string {
  const groups: string[] = [];

  for (const { key, cssName, valueKind } of FEATURE_ORDER) {
    const raw = features[key];
    if (raw === undefined || raw === null) continue;
    const v = emitFeatureValue(raw as string | number, valueKind);
    groups.push(`(${cssName}: ${v})`);
  }

  if (groups.length === 0) {
    return '';
  }
  return groups.join(' and ');
}

/**
 * Build a typed `@container` key for use in style objects (same output shape as a manual `'@container …'` string).
 *
 * **Ecosystem notes:** StyleX and Panda usually expose `@container` as string keys (or Panda conditions);
 * Vanilla Extract’s `createContainer()` scopes names—here you set `containerName` and pass the same string as `name`.
 *
 * @example Size query
 * ```ts
 * styles.class('card', {
 *   containerType: 'inline-size',
 *   ...styles.atRuleBlock(styles.container({ minWidth: 400 }), { padding: '24px' }),
 * });
 * ```
 *
 * @example Named container
 * ```ts
 * styles.class('item', {
 *   ...styles.atRuleBlock(styles.container('sidebar', { minWidth: 300 }), {
 *     flexDirection: 'row',
 *   }),
 * });
 * ```
 *
 * @example Style / scroll / `not` — raw condition after `@container`
 * ```ts
 * ...styles.atRuleBlock(styles.container('style(--theme: dark)'), { color: '#fff' })
 * ```
 */
export function container(name: string, features: ContainerQueryFeatures): ContainerQueryKey;
export function container(features: ContainerQueryObject): ContainerQueryKey;
export function container(rawCondition: string): ContainerQueryKey;
export function container(
  a: string | ContainerQueryObject,
  b?: ContainerQueryFeatures,
): ContainerQueryKey {
  if (typeof a === 'string' && b !== undefined) {
    const body = conditionFromFeatures(b);
    if (!body) {
      throw new Error(
        '[typestyles] container(name, features): pass at least one size feature (e.g. minWidth), or use container("raw condition") for non-size queries.',
      );
    }
    return `@container ${a} ${body}` as ContainerQueryKey;
  }

  if (typeof a === 'string') {
    const cond = a.trim();
    if (!cond) {
      throw new Error('[typestyles] container(raw): condition string must not be empty.');
    }
    return `@container ${cond}` as ContainerQueryKey;
  }

  const { name, ...features } = a;
  const body = conditionFromFeatures(features as ContainerQueryFeatures);
  if (!body) {
    throw new Error(
      '[typestyles] container({ … }): pass at least one size feature, or use container("raw condition") for style/scroll-state queries.',
    );
  }
  if (name !== undefined && name !== '') {
    return `@container ${name} ${body}` as ContainerQueryKey;
  }
  return `@container ${body}` as ContainerQueryKey;
}
