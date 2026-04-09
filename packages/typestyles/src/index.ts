import { createStyles } from './styles';
import { createTokens } from './tokens';
import { createTypeStyles } from './create-type-styles';
import { createTheme, createDarkMode, when, colorMode } from './theme';
import { createKeyframes } from './keyframes';
import * as colorFns from './color';
import {
  getRegisteredCss,
  insertRules,
  reset,
  flushSync,
  ensureDocumentStylesAttached,
} from './sheet';
import { globalStyle, globalFontFace } from './global';
import { createVar, assignVars } from './vars';
import { cx } from './cx';
import { container, createContainerRef } from './container';
import { atRuleBlock } from './at-rule-block';
import { has, is, where } from './relational-pseudo';
import { calc, clamp } from './css-math';

export type {
  StylesApi,
  StylesApiWithLayers,
  CreateStylesInput,
  LayerOption,
  LayeredComponentFn,
} from './styles';
export type { CreateTokensOptions, TokensApi } from './tokens';

export type { CascadeLayersInput, CascadeLayersObjectInput, ResolvedCascadeLayers } from './layers';

export type { ClassNamingConfig, ClassNamingMode } from './class-naming';
export {
  mergeClassNaming,
  defaultClassNamingConfig,
  scopedTokenNamespace,
  fileScopeId,
} from './class-naming';

export { createStyles, createTokens, createTypeStyles };

export { container, createContainerRef, atRuleBlock, has, is, where };

export { calc, clamp };

export type { CssMathValue } from './css-math';

export type {
  ContainerQueryKey,
  ContainerQueryFeatures,
  ContainerQueryObject,
  ContainerObjectKey,
  ContainerNameRef,
  CreateContainerRefOptions,
} from './container';

export type { HasNestedKey, IsNestedKey, WhereNestedKey, IsPseudoArg } from './relational-pseudo';

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
  FlatTokenEntry,
  KeyframeStops,
  VariantDefinitions,
  VariantOptionStyle,
  ComponentConfig,
  ComponentConfigContext,
  ComponentConfigInput,
  ComponentInternalVarRef,
  ComponentReturn,
  ComponentVarDefinitions,
  ComponentVarDescriptor,
  ComponentVarNode,
  ComponentVarOptions,
  ComponentVarRefTree,
  FlatComponentConfig,
  FlatComponentConfigInput,
  FlatComponentReturn,
  FlatComponentSelections,
  ComponentSelections,
  SlotStyles,
  SlotVariantDefinitions,
  SlotComponentConfig,
  SlotComponentConfigInput,
  SlotComponentFunction,
  MultiSlotConfigInput,
  FontFaceProps,
  CSSVarRef,
  ComponentVariants,
  ThemeCondition,
  ThemeConditionMedia,
  ThemeConditionAttr,
  ThemeConditionClass,
  ThemeConditionSelector,
  ThemeConditionAnd,
  ThemeConditionOr,
  ThemeConditionNot,
  ThemeModeDefinition,
  ThemeConfig,
  ThemeSurface,
  DeepPartialTokenValues,
} from './types';

export { flattenTokenEntries } from './types';

export { createVar, assignVars };

export type { ColorMixSpace } from './color';

export { createTheme, createDarkMode, when, colorMode };

export type { ThemeEmitLayerContext } from './theme';

/**
 * Default style API (semantic class names, empty `scopeId`). Prefer `createStyles({ scopeId, mode, prefix })`
 * per package or micro-frontend for isolation.
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
 * button({ intent: 'primary', size: 'lg' })
 *
 * const card = styles.class('card', { padding: '1rem' });
 * ```
 */
export const styles = createStyles();

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
 * Default token API (unscoped custom properties). Prefer `createTokens({ scopeId })` when multiple
 * bundles share a page.
 *
 * @example
 * ```ts
 * const color = tokens.create('color', { primary: '#0066ff' });
 * color.primary // "var(--color-primary)"
 *
 * const acme = tokens.createTheme('acme', {
 *   base: { color: { primary: '#ff6600' } },
 *   colorMode: tokens.colorMode.mediaOnly({ dark: darkOverrides }),
 * });
 * ```
 */
export const tokens = createTokens();

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
