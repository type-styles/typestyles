import type * as CSS from 'csstype';

/**
 * A CSS value that can be a standard value or a token reference (var() string).
 */
export type CSSValue = string | number;

/**
 * CSS properties with support for nested selectors and at-rules.
 * Extends csstype's Properties with nesting capabilities.
 */
export interface CSSProperties extends CSS.Properties<CSSValue> {
  /** Nested selector (e.g., '&:hover', '& .child', '&::before', '&[data-variant]') */
  [selector: `&${string}`]: CSSProperties;
  /** Attribute selector (e.g., '[data-variant]', '[data-variant="primary"]', '[disabled]') */
  [attribute: `[${string}]`]: CSSProperties;
  /** At-rule (e.g., '@media (max-width: 768px)', '@container', '@supports') */
  [atRule: `@${string}`]: CSSProperties;
}

/**
 * Utility function map used by styles.withUtils().
 * Each key becomes an extra style property that expands into CSSProperties.
 */
export type StyleUtils = Record<string, (value: any) => CSSProperties>;

type UtilityValue<U extends StyleUtils, K extends keyof U> = U[K] extends (
  value: infer V,
) => CSSProperties
  ? V
  : never;

/**
 * CSS properties augmented with user-defined utility keys.
 */
export type CSSPropertiesWithUtils<U extends StyleUtils> = CSS.Properties<CSSValue> & {
  [K in keyof U]?: UtilityValue<U, K>;
} & {
  [selector: `&${string}`]: CSSPropertiesWithUtils<U>;
  [attribute: `[${string}]`]: CSSPropertiesWithUtils<U>;
  [atRule: `@${string}`]: CSSPropertiesWithUtils<U>;
};

/**
 * A map of style names to utility-aware CSS property definitions.
 */
export type StyleDefinitionsWithUtils<U extends StyleUtils> = Record<
  string,
  CSSPropertiesWithUtils<U>
>;

/**
 * A map of variant names to their CSS property definitions.
 */
export type StyleDefinitions = Record<string, CSSProperties>;

/**
 * A selector function returned by styles.create().
 * Accepts variant names (or falsy values for conditional application)
 * and returns a composed class name string.
 */
export interface SelectorFunction<K extends string = string> {
  (...variants: (K | false | null | undefined)[]): string;
}

/**
 * A flat map of token names to their values.
 */
export type TokenValues = Record<string, string>;

/**
 * A typed token reference object. Property access returns var(--namespace-key).
 */
export type TokenRef<T extends TokenValues> = {
  readonly [K in keyof T]: string;
};

/**
 * Theme overrides: a map of token namespaces to partial value overrides.
 */
export type ThemeOverrides = Record<string, Partial<TokenValues>>;

/**
 * Keyframe stops: 'from', 'to', or percentage strings mapped to CSS properties.
 */
export type KeyframeStops = Record<string, CSSProperties>;

/**
 * A map of variant dimensions to their options (each option maps to CSSProperties).
 */
export type VariantDefinitions = Record<string, Record<string, CSSProperties>>;

type VariantOptionKey<V extends VariantDefinitions, K extends keyof V> = Extract<keyof V[K], string>;

type VariantSelectionValue<OptionKey extends string> =
  | OptionKey
  | (Extract<OptionKey, 'true'> extends never ? never : true)
  | (Extract<OptionKey, 'false'> extends never ? never : false);

type CompoundSelectionValue<OptionKey extends string> =
  | VariantSelectionValue<OptionKey>
  | readonly VariantSelectionValue<OptionKey>[];

export type ComponentSelections<V extends VariantDefinitions> = {
  [K in keyof V]?: VariantSelectionValue<VariantOptionKey<V, K>> | null | undefined;
};

/**
 * The full config object passed to styles.component().
 */
export type ComponentConfig<V extends VariantDefinitions> = {
  base?: CSSProperties;
  variants?: V;
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: CSSProperties;
  }>;
  defaultVariants?: ComponentSelections<V>;
};

/**
 * The function returned by styles.component().
 */
export type ComponentFunction<V extends VariantDefinitions> = (
  selections?: ComponentSelections<V>,
) => string;

/**
 * Alias terminology for variant recipes.
 */
export type RecipeConfig<V extends VariantDefinitions> = ComponentConfig<V>;
export type RecipeFunction<V extends VariantDefinitions> = ComponentFunction<V>;

/**
 * A reference to a CSS custom property created by createVar().
 * The string value is `var(--ts-N)` and can be used directly as a CSS value.
 * Template literal type provides type safety without a brand.
 */
export type CSSVarRef = `var(--${string})`;

/**
 * Extract the variant prop types from a ComponentFunction.
 *
 * @example
 * ```ts
 * const button = styles.component('button', {
 *   variants: {
 *     intent: { primary: {...}, ghost: {...} },
 *     size:   { sm: {...}, lg: {...} },
 *   },
 * });
 *
 * type ButtonProps = RecipeVariants<typeof button>;
 * // { intent?: 'primary' | 'ghost'; size?: 'sm' | 'lg' }
 * ```
 */
export type RecipeVariants<T> =
  T extends ComponentFunction<infer V> ? { [K in keyof V]?: keyof V[K] } : never;

/**
 * Font face property declarations.
 */
export type FontFaceProps = {
  src: string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic' | 'oblique' | string;
  fontDisplay?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  fontStretch?: string;
  unicodeRange?: string;
};
