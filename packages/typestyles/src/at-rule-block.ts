import type { CSSProperties } from './types';

/**
 * Returns a one-key object to **spread** into a style map.
 *
 * TypeScript widens **computed** `[someFn()]` keys to `string`, which clashes with {@link CSSProperties}’s
 * `` `@${string}` `` index signature. Spreading `Record<@${string}, CSSProperties>` preserves a narrow key type.
 *
 * Works for keys from `container()`, literal `'@media (…)'`, `'@supports (…)'`, etc.
 *
 * @example
 * ```ts
 * styles.class('card', {
 *   padding: '16px',
 *   ...atRuleBlock(styles.container({ minWidth: 400 }), { padding: '24px' }),
 * });
 * ```
 */
export function atRuleBlock<const K extends `@${string}`>(
  key: K,
  block: CSSProperties,
): Record<K, CSSProperties> {
  return { [key]: block } as Record<K, CSSProperties>;
}
