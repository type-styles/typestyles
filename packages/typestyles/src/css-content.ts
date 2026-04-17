/**
 * Helper for CSS `content` string values. Emits a double-quoted CSS string; values are plain strings
 * at runtime — same spirit as `calc` / `clamp` in css-math.
 */

/**
 * Wrap `text` in a CSS string (`content: "…";`). `null` / `undefined` yield `''` (omit the property
 * or pair with a conditional if you need no declaration).
 *
 * @example
 * ```ts
 * import { content } from 'typestyles';
 *
 * content() // => '' (skip property or use a conditional if you want no rule)
 * content('') // => '""' → valid `content: "";` for an empty pseudo-element box
 * content('*') // => '"*"' → `content: "*";`
 * ```
 */
export function content(text?: string | null): string {
  if (text == null) return '';
  return JSON.stringify(text);
}
