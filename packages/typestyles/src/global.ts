import type { CSSProperties, FontFaceProps } from './types';
import { serializeStyle } from './css';
import { insertRule, insertRules } from './sheet';
import type { GlobalStyleTuple } from './global-style-tuple';
import { parseGlobalStyleArgs } from './global-style-tuple';

/**
 * Apply styles to an arbitrary CSS selector.
 *
 * Use for CSS resets, body/root defaults, third-party elements, or any
 * selector that isn't tied to a specific component class.
 *
 * @example
 * ```ts
 * global.style('body', { margin: 0, fontFamily: 'sans-serif' });
 * global.style('a:hover', { textDecoration: 'underline' });
 * global.style('*, *::before, *::after', { boxSizing: 'border-box' });
 * ```
 *
 * Also accepts a tuple from `typestyles/globals` recipes:
 *
 * ```ts
 * import { boxSizing, body } from 'typestyles/globals';
 * global.style(boxSizing());
 * global.style(body({ margin: 0 }));
 * ```
 *
 * Optional `{ layer }` on the tuple or as a third argument is ignored on the root `global` object —
 * use `createGlobal({ layers })` or `createTypeStyles({ layers }).global` for `@layer`.
 */
export function globalStyle(tuple: GlobalStyleTuple): void;
export function globalStyle(
  selector: string,
  properties: CSSProperties,
  options?: { layer?: string },
): void;
export function globalStyle(
  first: string | GlobalStyleTuple,
  second?: CSSProperties,
  third?: { layer?: string },
): void {
  const { selector, properties, options } = parseGlobalStyleArgs(first, second, third);
  if (process.env.NODE_ENV !== 'production' && options?.layer != null) {
    console.warn(
      '[typestyles] `layer` on root `global.style(...)` is ignored — use `createGlobal({ layers })` or `createTypeStyles({ layers }).global` for cascade layers.',
    );
  }
  const rules = serializeStyle(selector, properties);
  insertRules(rules);
}

/** Apply multiple `typestyles/globals` tuples (e.g. {@link reset}) in one call. */
export function globalApply(...tuples: GlobalStyleTuple[]): void {
  for (const t of tuples) {
    globalStyle(t);
  }
}

/**
 * Declare a `@font-face` rule to load a custom font.
 *
 * Multiple weights/styles of the same family can be registered by calling
 * this function multiple times with different `src` values — each call is
 * deduplicated by `family + src`.
 *
 * @example
 * ```ts
 * global.fontFace('Inter', {
 *   src: "url('/fonts/Inter-Regular.woff2') format('woff2')",
 *   fontWeight: 400,
 *   fontStyle: 'normal',
 *   fontDisplay: 'swap',
 * });
 *
 * global.fontFace('Inter', {
 *   src: "url('/fonts/Inter-Bold.woff2') format('woff2')",
 *   fontWeight: 700,
 *   fontStyle: 'normal',
 *   fontDisplay: 'swap',
 * });
 * ```
 */
export function globalFontFace(family: string, props: FontFaceProps): void {
  const decls: string[] = [`font-family: "${family}"`, `src: ${props.src}`];
  if (props.fontWeight != null) decls.push(`font-weight: ${props.fontWeight}`);
  if (props.fontStyle) decls.push(`font-style: ${props.fontStyle}`);
  if (props.fontDisplay) decls.push(`font-display: ${props.fontDisplay}`);
  if (props.fontStretch) decls.push(`font-stretch: ${props.fontStretch}`);
  if (props.unicodeRange) decls.push(`unicode-range: ${props.unicodeRange}`);
  const css = `@font-face { ${decls.join('; ')}; }`;
  // Key includes src for uniqueness (multiple weights per family)
  insertRule(`font-face:${family}:${props.src}`, css);
}
