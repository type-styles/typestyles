/**
 * Join class name parts, filtering out falsy values.
 *
 * A lightweight utility for combining TypeStyles classes, external class
 * strings, and conditional expressions into a single `className` string.
 *
 * @example
 * ```ts
 * import { cx } from 'typestyles';
 *
 * cx('card', isActive && 'active', className);
 * // => "card active my-external-class"
 *
 * cx(button('base', 'primary'), 'extra');
 * // => "button-base button-primary extra"
 * ```
 */
export function cx(...parts: Array<string | undefined | null | false | 0 | ''>): string {
  return parts.filter(Boolean).join(' ');
}
