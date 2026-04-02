import { createClass, createHashClass, compose, createStylesWithUtils, cx } from './styles.js';
import { createTokens, useTokens, createTheme } from './tokens.js';
import { createKeyframes } from './keyframes.js';
import * as colorFns from './color.js';
import {
  getRegisteredCss,
  insertRules,
  reset,
  flushSync,
  ensureDocumentStylesAttached,
} from './sheet.js';
import { createComponent } from './component.js';
import { globalStyle, globalFontFace } from './global.js';
import { createVar, assignVars } from './vars.js';
import { cx } from './cx.js';

export type { ClassNamingConfig, ClassNamingMode } from './class-naming.js';
export { configureClassNaming, getClassNamingConfig, resetClassNaming } from './class-naming.js';

export type {
  CSSProperties,
  CSSValue,
  StyleDefinitions,
  StyleDefinitionsWithUtils,
  CSSPropertiesWithUtils,
  StyleUtils,
  TokenValues,
  TokenRef,
  ThemeOverrides,
  KeyframeStops,
  VariantDefinitions,
  ComponentConfig,
  ComponentReturn,
  FlatComponentConfig,
  FlatComponentReturn,
  FlatComponentSelections,
  ComponentSelections,
  SlotStyles,
  SlotVariantDefinitions,
  SlotComponentConfig,
  SlotComponentFunction,
  FontFaceProps,
  CSSVarRef,
  ComponentVariants,
} from './types.js';

export { createVar, assignVars };

export type { ColorMixSpace } from './color.js';

/**
 * Class name joining utility. Filters out falsy values and joins with spaces.
 *
 * @example
 * ```ts
 * import { cx } from 'typestyles';
 *
 * <div className={cx(card(), isActive && 'active', className)} />
 * ```
 */
export { cx };

/**
 * Style creation API.
 *
 * @example
 * ```ts
 * // Multi-variant component (CVA-style)
 * const button = styles.component('button', {
 *   base: { padding: '8px 16px' },
 *   variants: {
 *     intent: { primary: { backgroundColor: '#0066ff' } },
 *     size: { sm: { fontSize: '14px' }, lg: { fontSize: '18px' } },
 *   },
 *   defaultVariants: { intent: 'primary', size: 'sm' },
 * });
 *
 * // Call as function — base always included
 * button({ intent: 'primary', size: 'lg' })
 *
 * // Destructure individual class strings
 * const { base, 'intent-primary': primary } = button;
 *
 * // Single class (no variants)
 * const card = styles.class('card', { padding: '1rem' });
 * ```
 */
export const styles = {
  component: createComponent,
  class: createClass,
  hashClass: createHashClass,
  withUtils: createStylesWithUtils,
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
 * const card = styles.component('card', {
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
 */
export { getRegisteredCss };

/**
 * Insert multiple CSS rules into the stylesheet.
 * Low-level API used internally and by packages like @typestyles/props.
 */
export { insertRules };

/**
 * Testing utilities for clearing the stylesheet and flushing pending rules.
 */
export { reset, flushSync, ensureDocumentStylesAttached };

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
 * cx(card('root'), isActive && 'active', externalClassName);
 * // => "card-root active my-external-class"
 * ```
 */
export { cx };
