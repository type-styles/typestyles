import { formatDeclaration } from './serialize-style';
import type * as CSS from 'csstype';

/**
 * Object key for nested styles: `@supports … { … }`.
 * Returned by {@link supports} for typed feature queries (see also raw `@supports` strings).
 */
export type SupportsQueryKey = `@supports ${string}`;

/**
 * Declaration features for {@link supports}. Maps to parenthesis groups joined with `and`.
 * Keys are camelCase CSS properties (same as style longhands); values are the tested declaration values.
 */
export type SupportsQueryFeatures = {
  [K in keyof CSS.Properties]?: string | number;
} & Record<string, string | number>;

// ---------------------------------------------------------------------------
// Type-level @supports keys (mirrors conditionFromFeatures)
// ---------------------------------------------------------------------------

type CamelToKebab<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? `-${Lowercase<First>}${CamelToKebab<Rest>}`
    : `${First}${CamelToKebab<Rest>}`
  : S;

type EmitSupportsValue<V> = V extends 0
  ? '0'
  : V extends number
    ? `${V}px`
    : V extends string
      ? V
      : never;

/** Exactly one key in `F`, or `never` when there are zero or multiple keys. */
type OneFeatureKey<F> = {
  [K in keyof F]-?: Pick<F, K> extends F ? K : never;
}[keyof F];

/** Narrow `@supports` key for a single-feature {@link supports} object — allows `[supports({ … })]` without widening. */
export type SupportsObjectKey<F extends SupportsQueryFeatures> =
  OneFeatureKey<F> extends infer K
    ? K extends keyof F
      ? F[K] extends string | number
        ? `@supports (${CamelToKebab<K & string>}: ${EmitSupportsValue<F[K]>})`
        : never
      : never
    : never;

function conditionFromFeatures(features: SupportsQueryFeatures): string {
  const groups: string[] = [];

  for (const [prop, raw] of Object.entries(features)) {
    if (raw === undefined || raw === null) continue;
    groups.push(`(${formatDeclaration(prop, raw)})`);
  }

  if (groups.length === 0) {
    return '';
  }
  return groups.join(' and ');
}

/**
 * Build a typed `@supports` key for use in style objects (same output shape as a manual `'@supports …'` string).
 *
 * @example Single declaration
 * ```ts
 * styles.class('grid', {
 *   display: 'flex',
 *   ...styles.atRuleBlock(styles.supports({ display: 'grid' }), {
 *     display: 'grid',
 *   }),
 * });
 * ```
 *
 * @example Raw condition (including `not`)
 * ```ts
 * [styles.supports('(backdrop-filter: blur(4px))')]: { backdropFilter: 'blur(4px)' }
 * ```
 */
export function supports<const F extends SupportsQueryFeatures>(
  features: F,
): SupportsObjectKey<F> extends never ? SupportsQueryKey : SupportsObjectKey<F>;

/** Raw condition after `@supports` — literal `S` preserves a narrow key for `[supports('…')]`. */
export function supports<const S extends string>(rawCondition: S): `@supports ${S}`;

export function supports(rawCondition: string | SupportsQueryFeatures): SupportsQueryKey;

export function supports(rawCondition: string | SupportsQueryFeatures): SupportsQueryKey {
  if (typeof rawCondition === 'string') {
    const cond = rawCondition.trim();
    if (!cond) {
      throw new Error('[typestyles] supports(raw): condition string must not be empty.');
    }
    return `@supports ${cond}` as SupportsQueryKey;
  }

  const body = conditionFromFeatures(rawCondition);
  if (!body) {
    throw new Error(
      '[typestyles] supports({ … }): pass at least one declaration (e.g. { display: "grid" }), or use supports("raw condition") for selector / `not` queries.',
    );
  }
  return `@supports ${body}` as SupportsQueryKey;
}
