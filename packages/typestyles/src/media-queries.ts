import type { MediaQueryKey } from './media';

/**
 * Ready-to-use `@media (...)` string constants for common CSS media features,
 * grouped by feature. Drop a leaf value directly into a `styles.component` /
 * `css` / `override` style object as a key:
 *
 * @example
 * ```ts
 * const card = styles.component('card', {
 *   base: { transition: 'transform 200ms ease' },
 *   [mediaQueries.prefersReducedMotion.reduce]: { transition: 'none' },
 * });
 * ```
 */
export const mediaQueries = {
  prefersReducedMotion: {
    reduce: '@media (prefers-reduced-motion: reduce)',
    noPreference: '@media (prefers-reduced-motion: no-preference)',
  },
  prefersContrast: {
    more: '@media (prefers-contrast: more)',
    less: '@media (prefers-contrast: less)',
    noPreference: '@media (prefers-contrast: no-preference)',
  },
  hover: {
    hover: '@media (hover: hover)',
    none: '@media (hover: none)',
  },
  anyHover: {
    hover: '@media (any-hover: hover)',
    none: '@media (any-hover: none)',
  },
  pointer: {
    fine: '@media (pointer: fine)',
    coarse: '@media (pointer: coarse)',
    none: '@media (pointer: none)',
  },
  anyPointer: {
    fine: '@media (any-pointer: fine)',
    coarse: '@media (any-pointer: coarse)',
    none: '@media (any-pointer: none)',
  },
} as const satisfies Record<string, Record<string, MediaQueryKey>>;

export type MediaQueries = typeof mediaQueries;
