import { createStyles, createClass, createHashClass, compose } from './styles.js';
import { createTokens, useTokens, createTheme } from './tokens.js';
import { createKeyframes } from './keyframes.js';
import * as colorFns from './color.js';
import { getRegisteredCss, insertRules, reset, flushSync } from './sheet.js';
import { createComponent, createRecipe } from './component.js';
import { globalStyle, globalFontFace } from './global.js';
import { createVar, assignVars } from './vars.js';

export type {
  CSSProperties,
  CSSValue,
  StyleDefinitions,
  SelectorFunction,
  TokenValues,
  TokenRef,
  ThemeOverrides,
  KeyframeStops,
  VariantDefinitions,
  ComponentConfig,
  ComponentFunction,
  RecipeConfig,
  RecipeFunction,
  FontFaceProps,
  CSSVarRef,
  RecipeVariants,
} from './types.js';

export { createVar, assignVars };

export type { ColorMixSpace } from './color.js';

/**
 * Style creation API.
 *
 * @example
 * ```ts
 * const button = styles.create('button', {
 *   base: { padding: '8px 16px' },
 *   primary: { backgroundColor: '#0066ff' },
 * });
 *
 * const hashed = styles.hashClass({ display: 'inline-flex' }, 'button');
 *
 * <button className={`${button('base', 'primary')} ${hashed}`}>
 * ```
 */
export const styles = {
  create: createStyles,
  class: createClass,
  hashClass: createHashClass,
  component: createComponent,
  recipe: createRecipe,
  compose,
} as const;

/**
 * Global CSS API for arbitrary selectors and font-face declarations.
 *
 * @example
 * ```ts
 * global.style('body', { margin: 0 });
 * global.fontFace('Inter', { src: "url('/Inter.woff2') format('woff2')", fontWeight: 400 });
 * ```
 */
export const global = {
  style: globalStyle,
  fontFace: globalFontFace,
} as const;

/**
 * Design token API using CSS custom properties.
 *
 * @example
 * ```ts
 * const color = tokens.create('color', {
 *   primary: '#0066ff',
 * });
 *
 * color.primary // "var(--color-primary)"
 * ```
 */
export const tokens = {
  create: createTokens,
  use: useTokens,
  createTheme,
} as const;

/**
 * Keyframe animation API.
 *
 * @example
 * ```ts
 * const fadeIn = keyframes.create('fadeIn', {
 *   from: { opacity: 0 },
 *   to: { opacity: 1 },
 * });
 *
 * const card = styles.create('card', {
 *   base: { animation: `${fadeIn} 300ms ease` },
 * });
 * ```
 */
export const keyframes = {
  create: createKeyframes,
} as const;

/**
 * Type-safe CSS color function helpers.
 *
 * Each function returns a plain CSS color string — no runtime color math.
 * Composes naturally with token references.
 *
 * @example
 * ```ts
 * color.rgb(0, 102, 255)                    // "rgb(0 102 255)"
 * color.oklch(0.7, 0.15, 250)               // "oklch(0.7 0.15 250)"
 * color.mix(theme.primary, 'white', 20)      // "color-mix(in srgb, var(--theme-primary) 20%, white)"
 * color.alpha(theme.primary, 0.5)            // "color-mix(in srgb, var(--theme-primary) 50%, transparent)"
 * color.lightDark('#111', '#eee')            // "light-dark(#111, #eee)"
 * ```
 */
export const color = colorFns;

/**
 * Return all registered CSS as a string (for SSR).
 *
 * Returns every CSS rule registered via `styles.create`, `tokens.create`,
 * `keyframes.create`, etc. Use this in your SSR head/meta function to
 * inject styles into the document.
 *
 * This is safe to import on the client — it has no server-specific
 * dependencies and will simply return whatever CSS has been registered.
 *
 * @example
 * ```ts
 * import { getRegisteredCss } from 'typestyles';
 *
 * // In a route's head function (e.g. TanStack Start):
 * export const Route = createRootRoute({
 *   head: () => ({
 *     styles: [{ id: 'typestyles', children: getRegisteredCss() }],
 *   }),
 * });
 * ```
 */
export { getRegisteredCss };

/**
 * Insert multiple CSS rules into the stylesheet.
 *
 * This is a low-level API used internally by typestyles and by packages
 * like @typestyles/props. You typically won't need to use this directly.
 *
 * @example
 * ```ts
 * import { insertRules } from 'typestyles';
 *
 * insertRules([
 *   { key: '.my-class', css: '.my-class { color: red; }' },
 *   { key: '.another', css: '.another { padding: 8px; }' },
 * ]);
 * ```
 */
export { insertRules };

/**
 * Testing utilities for clearing the stylesheet and flushing pending rules.
 * These are primarily intended for use in tests.
 *
 * @example
 * ```ts
 * import { reset, flushSync } from 'typestyles';
 *
 * // In a test beforeEach:
 * beforeEach(() => {
 *   reset(); // Clear all registered CSS
 * });
 *
 * // To synchronously flush pending rules:
 * flushSync();
 * ```
 */
export { reset, flushSync };
