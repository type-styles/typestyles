import type { ComponentAttrsResult } from './types';

/**
 * Anything that coerces to a class string via `toString()`/`Symbol.toPrimitive` — covers
 * `ThemeSurface` (`tokens.createTheme(...)`) and `ComponentAttrsResult`
 * (`createStyles({ mode: 'attribute' })`) alongside plain strings.
 */
type Stringable = { toString(): string };

export function isComponentAttrsResult(value: unknown): value is ComponentAttrsResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'attrs' in value &&
    'className' in value &&
    'props' in value
  );
}

const warnedStacks = new Set<string>();

export function devWarnOnce(message: string): void {
  if (process.env.NODE_ENV === 'production') return;
  const stack = new Error().stack ?? '';
  const key = `${message}\n${stack.split('\n', 4).join('\n')}`;
  if (warnedStacks.has(key)) return;
  warnedStacks.add(key);
  console.warn(`[typestyles] ${message}`);
}

/** @internal Test helper — reset dev-warning dedupe state between tests. */
export function resetBindingDevWarnings(): void {
  warnedStacks.clear();
}

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
 *
 * cx(attrButton({ variant: 'primary' }), 'extra');
 * // => "button-base extra" — ComponentAttrsResult coerces via toString()
 * ```
 */
export function cx(
  ...parts: Array<string | Stringable | undefined | null | false | 0 | ''>
): string {
  if (process.env.NODE_ENV !== 'production') {
    for (const part of parts) {
      if (isComponentAttrsResult(part)) {
        devWarnOnce(
          `cx() dropped attrs on "${part.className || 'recipe'}" — use mergeProps() or combine() instead.`,
        );
      }
    }
  }
  return parts.filter(Boolean).join(' ');
}
