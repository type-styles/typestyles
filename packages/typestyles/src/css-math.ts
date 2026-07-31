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

/**
 * CSS `sin(value)`.
 *
 * @example
 * ```ts
 * sin('45deg') // "sin(45deg)"
 * ```
 */
export function sin(value: CssMathValue): string {
  return `sin(${value})`;
}

/**
 * CSS `cos(value)`.
 *
 * @example
 * ```ts
 * cos('45deg') // "cos(45deg)"
 * ```
 */
export function cos(value: CssMathValue): string {
  return `cos(${value})`;
}

/**
 * CSS `tan(value)`.
 *
 * @example
 * ```ts
 * tan('45deg') // "tan(45deg)"
 * ```
 */
export function tan(value: CssMathValue): string {
  return `tan(${value})`;
}

/**
 * CSS `atan2(y, x)`.
 *
 * @example
 * ```ts
 * atan2('1', '1') // "atan2(1, 1)"
 * ```
 */
export function atan2(y: CssMathValue, x: CssMathValue): string {
  return `atan2(${y}, ${x})`;
}

/**
 * CSS `pow(base, exponent)`.
 *
 * @example
 * ```ts
 * pow('2', '8') // "pow(2, 8)"
 * ```
 */
export function pow(base: CssMathValue, exponent: CssMathValue): string {
  return `pow(${base}, ${exponent})`;
}

/**
 * CSS `sqrt(value)`.
 *
 * @example
 * ```ts
 * sqrt('16') // "sqrt(16)"
 * ```
 */
export function sqrt(value: CssMathValue): string {
  return `sqrt(${value})`;
}

/**
 * CSS `hypot(...values)`.
 *
 * @example
 * ```ts
 * hypot('3px', '4px') // "hypot(3px, 4px)"
 * ```
 */
export function hypot(...values: CssMathValue[]): string {
  return `hypot(${values.join(', ')})`;
}
