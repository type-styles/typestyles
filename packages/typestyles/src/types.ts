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
type BivariantCallback<Arg, Ret> = {
  bivarianceHack(value: Arg): Ret;
}['bivarianceHack'];

export type StyleUtils = Record<string, BivariantCallback<unknown, CSSProperties>>;

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

// ---------------------------------------------------------------------------
// Component API types
// ---------------------------------------------------------------------------

/**
 * A map of variant dimensions to their options (each option maps to CSSProperties).
 */
export type VariantDefinitions = Record<string, Record<string, CSSProperties>>;
export type SlotStyles<S extends string> = Partial<Record<S, CSSProperties>>;
export type SlotVariantDefinitions<S extends string> = Record<
  string,
  Record<string, SlotStyles<S>>
>;

type VariantDimensions = Record<string, Record<string, unknown>>;
type VariantOptionKey<V extends VariantDimensions, K extends keyof V> = Extract<keyof V[K], string>;

type VariantSelectionValue<OptionKey extends string> =
  | OptionKey
  | (Extract<OptionKey, 'true'> extends never ? never : true)
  | (Extract<OptionKey, 'false'> extends never ? never : false);

type CompoundSelectionValue<OptionKey extends string> =
  | VariantSelectionValue<OptionKey>
  | readonly VariantSelectionValue<OptionKey>[];

export type ComponentSelections<V extends VariantDimensions> = {
  [K in keyof V]?: VariantSelectionValue<VariantOptionKey<V, K>> | null | undefined;
};

// ---------------------------------------------------------------------------
// Dimensioned variant config (has `variants: { ... }`)
// ---------------------------------------------------------------------------

/**
 * The full config object passed to styles.component() with dimensioned variants.
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

// ---------------------------------------------------------------------------
// Flat variant config (no `variants` key — each key besides `base` is a variant)
// ---------------------------------------------------------------------------

/**
 * Config for flat variants: `{ base: {...}, elevated: {...}, compact: {...} }`.
 * Each key besides `base` is a boolean-style variant.
 */
export type FlatComponentConfig<K extends string> = {
  base?: CSSProperties;
} & Record<K, CSSProperties>;

/**
 * Selection object for flat variants: `{ elevated: true, compact: true }`.
 */
export type FlatComponentSelections<K extends string> = {
  [P in K]?: boolean | null | undefined;
};

// ---------------------------------------------------------------------------
// CVA-style return: callable AND destructurable
// ---------------------------------------------------------------------------

/**
 * All possible variant class string keys that can be destructured from a
 * dimensioned component. Includes 'base' plus all `{dimension}-{option}` keys
 * flattened from the variants config.
 */
type DimensionedVariantKeys<V extends VariantDefinitions> = {
  [D in keyof V]: keyof V[D] extends string ? `${D & string}-${keyof V[D] & string}` : never;
}[keyof V];

/**
 * The CVA-style return for dimensioned variants.
 * Callable as a function, destructurable as an object.
 */
export type ComponentReturn<V extends VariantDefinitions> = {
  /** Call with variant selections to get composed class string (base always included). */
  (selections?: ComponentSelections<V>): string;
} & {
  /** The base class string. */
  readonly base: string;
} & {
  /** Individual variant class strings, keyed as `{dimension}-{option}`. */
  readonly [K in DimensionedVariantKeys<V>]: string;
};

/**
 * The CVA-style return for flat variants.
 * Callable as a function, destructurable as an object.
 */
export type FlatComponentReturn<K extends string> = {
  /** Call with variant selections to get composed class string (base always included). */
  (selections?: FlatComponentSelections<Exclude<K, 'base'>>): string;
} & {
  /** The base class string. */
  readonly base: string;
} & {
  /** Individual variant class strings. */
  readonly [P in Exclude<K, 'base'>]: string;
};

// ---------------------------------------------------------------------------
// Slot component types
// ---------------------------------------------------------------------------

export type SlotComponentConfig<S extends string, V extends SlotVariantDefinitions<S>> = {
  slots: readonly S[];
  base?: SlotStyles<S>;
  variants?: V;
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: SlotStyles<S>;
  }>;
  defaultVariants?: ComponentSelections<V>;
};

export type SlotComponentFunction<S extends string, V extends SlotVariantDefinitions<S>> = (
  selections?: ComponentSelections<V>,
) => Record<S, string>;

/**
 * A reference to a CSS custom property created by createVar().
 * The string value is `var(--ts-N)` and can be used directly as a CSS value.
 * Template literal type provides type safety without a brand.
 */
export type CSSVarRef = `var(--${string})`;

/**
 * Extract the variant prop types from a ComponentReturn or ComponentFunction.
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
 * type ButtonProps = ComponentVariants<typeof button>;
 * // { intent?: 'primary' | 'ghost'; size?: 'sm' | 'lg' }
 * ```
 */
export type ComponentVariants<T> = T extends (selections?: ComponentSelections<infer V>) => unknown
  ? { [K in keyof V]?: keyof V[K] }
  : never;

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
