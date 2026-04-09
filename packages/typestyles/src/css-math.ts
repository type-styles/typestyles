/**
 * Helpers for CSS `calc()` and `clamp()` that keep the function parentheses in one place.
 * Values are plain strings at runtime — no validation of inner syntax.
 */

/** Token refs, lengths, percentages, etc. */
export type CssMathValue = string | number;

/**
 * Tagged template: wraps the interpolated expression in `calc(...)`.
 *
 * @example
 * ```ts
 * import { calc } from 'typestyles';
 *
 * calc`100vh - 2 * ${t.space[4]}`
 * // => "calc(100vh - 2 * var(--space-4))"
 * ```
 */
export function calc(strings: TemplateStringsArray, ...values: CssMathValue[]): string {
  let inner = strings[0] ?? '';
  for (let i = 0; i < values.length; i++) {
    inner += String(values[i]) + (strings[i + 1] ?? '');
  }
  return `calc(${inner})`;
}

/**
 * CSS `clamp(MIN, PREFERRED, MAX)`.
 *
 * @example
 * ```ts
 * import { clamp } from 'typestyles';
 *
 * clamp('1rem', '5vw', '3rem')
 * // => "clamp(1rem, 5vw, 3rem)"
 * ```
 */
export function clamp(min: CssMathValue, preferred: CssMathValue, max: CssMathValue): string {
  return `clamp(${min}, ${preferred}, ${max})`;
}
