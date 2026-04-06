import type { JoinComma } from './join-selector-list-types.js';

/**
 * Object key for nested styles using {@link has} — compiles to `.base:has(…)`.
 * Prefer variadic {@link has} so keys narrow to a single literal (mixes cleanly with longhands).
 */
export type HasNestedKey = `&:has(${string})`;

/**
 * Object key for nested styles using {@link is} — compiles to `.base:is(…)`.
 */
export type IsNestedKey = `&:is(${string})`;

/**
 * Object key for nested styles using {@link where} — compiles to `.base:where(…)` (zero-specificity).
 */
export type WhereNestedKey = `&:where(${string})`;

/**
 * Pseudos often grouped with {@link is} for shared focus/hover styles.
 * Plain strings still work; this union improves autocomplete at call sites.
 */
export type IsPseudoArg =
  | ':hover'
  | ':active'
  | ':focus'
  | ':focus-visible'
  | ':focus-within'
  | ':disabled'
  | ':enabled'
  | ':checked'
  | ':indeterminate'
  | ':read-only'
  | ':read-write'
  | ':placeholder-shown'
  | ':default'
  | ':required'
  | ':optional'
  | ':valid'
  | ':invalid'
  | ':in-range'
  | ':out-of-range'
  | ':any-link'
  | ':link'
  | ':visited'
  | ':target'
  | ':target-within';

function joinSelectorListArguments(parts: readonly string[]): string {
  const trimmed = parts.map((p) => p.trim()).filter((p) => p.length > 0);
  return trimmed.join(', ');
}

/**
 * Build a nested style key for `:has()` — parental/descendant-aware styling without leaving the style object.
 *
 * Accepts a [relative selector list](https://drafts.csswg.org/selectors/#relative-real-selector-list):
 * multiple arguments become comma-separated branches inside `:has()`.
 *
 * **Ecosystem:** StyleX exposes contextual selectors via dedicated `when.*` helpers; Panda/Stitches lean on
 * nesting strings. TypeStyles keeps emit as real CSS and adds small builders beside raw `'&:has(…)'` keys.
 *
 * @example
 * ```ts
 * styles.class('nav', {
 *   base: { display: 'flex' },
 *   [has('.active')]: { borderBottom: '2px solid blue' },
 * });
 * ```
 */
export function has<const T extends readonly string[]>(
  ...relativeSelectors: T
): `&:has(${JoinComma<T>})`;
export function has(...relativeSelectors: string[]): HasNestedKey {
  const inner = joinSelectorListArguments(relativeSelectors);
  if (!inner) {
    throw new Error('[typestyles] has(…): pass at least one non-empty relative selector string.');
  }
  return `&:has(${inner})` as HasNestedKey;
}

/**
 * Build a nested style key for `:is()` — group pseudos or tags into one branch with the specificity of the
 * most specific argument selector.
 *
 * @example
 * ```ts
 * [is(':hover', ':focus-visible')]: { outline: '2px solid blue' }
 * ```
 */
export function is<const T extends readonly string[]>(...selectors: T): `&:is(${JoinComma<T>})`;
export function is(...selectors: string[]): IsNestedKey {
  const inner = joinSelectorListArguments(selectors);
  if (!inner) {
    throw new Error('[typestyles] is(…): pass at least one non-empty selector string.');
  }
  return `&:is(${inner})` as IsNestedKey;
}

/**
 * Build a nested style key for `:where()` — **zero-specificity** wrapper so library defaults stay easy for
 * consumers to override (unlike `:is()`, which preserves specificity of its arguments).
 *
 * @example
 * ```ts
 * [where('.nav')]: { display: 'flex', gap: '8px' }
 * ```
 */
export function where<const T extends readonly string[]>(
  ...selectors: T
): `&:where(${JoinComma<T>})`;
export function where(...selectors: string[]): WhereNestedKey {
  const inner = joinSelectorListArguments(selectors);
  if (!inner) {
    throw new Error('[typestyles] where(…): pass at least one non-empty selector string.');
  }
  return `&:where(${inner})` as WhereNestedKey;
}
