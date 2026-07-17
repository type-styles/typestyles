import { createStyles } from './styles';
import { createTokens } from './tokens';
import { createTypeStyles } from './create-type-styles';
import { createGlobal } from './create-global';
import { createTheme, createDarkMode, when, colorMode } from './theme';
import { createKeyframes } from './keyframes';
import {
  getRegisteredCss,
  subscribeRegisteredCss,
  insertRules,
  reset,
  flushSync,
  ensureDocumentStylesAttached,
} from './sheet';
import { globalStyle, globalFontFace, globalApply } from './global';
import { createVar, assignVars } from './vars';
import { cx } from './cx';
import { container, createContainerRef } from './container';
import { atRuleBlock } from './at-rule-block';
import { has, is, where } from './relational-pseudo';
import { calc, clamp } from './css-math';
import { content } from './css-content';

export type {
  StylesApi,
  StylesApiWithLayers,
  CreateStylesInput,
  LayerOption,
  LayeredComponentFn,
  AttributeStylesApi,
  AttributeStylesApiWithLayers,
  AttributeComponentFn,
  LayeredAttributeComponentFn,
} from './styles';
export type { CreateTokensOptions, TokensApi } from './tokens';
export type { BreakpointMap, BreakpointsConfig, ResponsiveValue } from './breakpoints';
export { resolveBreakpoints } from './breakpoints';
export { getTokenLeafValues } from './tokens';
export type { SerializeStyleOptions } from './css';

export type { CascadeLayersInput, CascadeLayersObjectInput, ResolvedCascadeLayers } from './layers';

export type {
  ClassNamingConfig,
  ClassNamingMode,
  ClassNameContext,
  ClassNameTemplate,
} from './class-naming';
export {
  mergeClassNaming,
  defaultClassNamingConfig,
  scopedTokenNamespace,
  fileScopeId,
} from './class-naming';

export type { ScopeOptions } from './scope';
export { createScope } from './scope';

export type {
  OverrideOptions,
  OverrideConfig,
  SlotOverrideConfig,
  MultiSlotOverrideConfig,
  FlatOverrideConfig,
  OverrideFn,
} from './override';

export type {
  ComponentMeta,
  ComponentMetaBase,
  DimensionedComponentMeta,
  FlatComponentMeta,
  SlotComponentMeta,
  MultiSlotComponentMeta,
  VariantSelectorMap,
  SlotVariantSelectorMap,
} from './component-meta';
export { getComponentMeta } from './component-meta';

export { createStyles, createTokens, createTypeStyles, createGlobal };

export type { GlobalApiUnlayered, GlobalApiLayered } from './create-global';

export type { GlobalStyleTuple } from './global-style-tuple';

export { container, createContainerRef, atRuleBlock, has, is, where };

export { calc, clamp, content };

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
  TokenDescriptor,
  CreatedTokenRef,
  InferTokenValues,
  InferTokenNamespace,
  TokenRegistry,
  ThemeOverrides,
  FlatTokenEntry,
  FlatTokenPathEntry,
  KeyframeStops,
  VariantDefinitions,
  VariantOptionStyle,
  VariantOptionKey,
  CompoundSelectionValue,
  ComponentConfig,
  ComponentConfigContext,
  ComponentConfigInput,
  ComponentInternalVarRef,
  RegisteredPropertyRef,
  RegisteredPropertyOptions,
  ComponentReturn,
  ComponentAttrsReturn,
  ComponentAttrsResult,
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
  FontFaceSrc,
  CSSVarRef,
  ComponentVariants,
  ComposeFn,
  ComposeSelectorInput,
  MergeComposeSelections,
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

export { flattenTokenEntries, flattenTokenPaths, isTokenDescriptor } from './types';

export { createVar, assignVars };

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
 * global.apply(...reset());
 * global.fontFace('Inter', { src: "url('/Inter.woff2') format('woff2')", fontWeight: 400 });
 * global.fontFace('Inter', { src: [`local('Inter')`, "url('/Inter.woff2') format('woff2')"] });
 * ```
 */
export const global = {
  style: globalStyle,
  apply: globalApply,
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
 * Return all registered CSS as a string (for SSR).
 */
export { getRegisteredCss };

/**
 * Subscribe to changes in the registered CSS. Returns an unsubscribe function.
 * Compatible with `useSyncExternalStore`.
 */
export { subscribeRegisteredCss };

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
