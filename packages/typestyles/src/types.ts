import type * as CSS from 'csstype';

/**
 * A CSS value that can be a standard value or a token reference (var() string).
 *
 * Values are emitted verbatim. TypeScript does **not** validate CSS syntax, so a typo in
 * `calc()`, `clamp()`, `min()`, `max()`, `url()`, etc. (for example a missing `)`) can produce
 * invalid CSS that breaks parsing for following rules. Use **`calc`** (tagged template) and
 * **`clamp`** from `typestyles` to keep function parentheses balanced, or small named helpers;
 * see the docs “TypeScript Tips” page.
 */
export type CSSValue = string | number;

/**
 * CSS properties with support for nested selectors and at-rules.
 * Extends csstype's Properties with nesting capabilities.
 *
 * For `@…` keys, **`container()`** / **`styles.container()`** infer a **literal** `@container …` template so
 * `[container({ minWidth: 400 })]` mixes with longhands without casting. For **dynamic** `@…` strings, spread
 * **`atRuleBlock` / `styles.atRuleBlock`**. Same idea for **`has` / `is` / `where`**: variadic literals narrow
 * to `&:…` keys; if the key is only known as `string`, spread a one-key object or use `atRuleBlock`.
 */
export interface CSSProperties extends CSS.Properties<CSSValue> {
  /** Nested selector (e.g., '&:hover', `has('.x')`, '& .child', '&::before', '&[data-variant]') */
  [selector: `&${string}`]: CSSProperties;
  /**
   * Ancestor-prefixed selector where `&` is the styled element (e.g. `html[data-mode="dark"] &`,
   * `html:not([data-mode="light"]) &`). Runtime serialization replaces every `&` with the class selector.
   */
  [selectorWithAncestor: `${string}&${string}`]: CSSProperties;
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
  [selectorWithAncestor: `${string}&${string}`]: CSSPropertiesWithUtils<U>;
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
 * A token value can be a string/number or a nested object of token values.
 * Supports arbitrarily deep nesting for hierarchical token structures.
 */
export type TokenValues =
  | string
  | number
  | {
      [key: string]: TokenValues;
    };

/**
 * A flattened key-value pair for CSS custom property generation.
 */
export type FlatTokenEntry = [key: string, value: string];

/**
 * Flattens a nested TokenValues object into an array of [key, value] pairs.
 * Deeply nested objects are flattened with keys joined by hyphens.
 *
 * @example
 * flattenTokens({ text: { primary: '#000' } })
 * // => [['text-primary', '#000']]
 */
export function flattenTokenEntries(obj: TokenValues, prefix = ''): FlatTokenEntry[] {
  const entries: FlatTokenEntry[] = [];

  if (obj === null || obj === undefined) {
    return entries;
  }

  if (typeof obj === 'string' || typeof obj === 'number') {
    if (prefix) {
      entries.push([prefix, String(obj)]);
    }
    return entries;
  }

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key}` : key;

    if (typeof value === 'string' || typeof value === 'number') {
      entries.push([newKey, String(value)]);
    } else if (value !== null && typeof value === 'object') {
      entries.push(...flattenTokenEntries(value as TokenValues, newKey));
    }
  }

  return entries;
}

/**
 * A typed token reference object. Property access returns var(--namespace-key).
 * Supports nested access: token.text.primary => var(--namespace-text-primary)
 */
export type TokenRef<T extends TokenValues> = T extends string | number
  ? string
  : {
      readonly [K in keyof T]: T[K] extends TokenValues ? TokenRef<T[K]> : string;
    };

/**
 * Nested token values where any object level may omit keys (for mode layers that
 * only tweak a subtree of `base`).
 */
export type DeepPartialTokenValues =
  | string
  | number
  | {
      [key: string]: DeepPartialTokenValues | undefined;
    };

/**
 * Theme overrides: namespaces map to full or deeply partial token trees.
 * Aligns with `tokens.create` namespaces; mode `overrides` often only set a subset of keys.
 */
export type ThemeOverrides = {
  [namespace: string]: DeepPartialTokenValues | undefined;
};

/**
 * Keyframe stops: 'from', 'to', or percentage strings mapped to CSS properties.
 */
export type KeyframeStops = Record<string, CSSProperties>;

// ---------------------------------------------------------------------------
// Theme condition types (discriminated union)
// ---------------------------------------------------------------------------

/** Match a media query (e.g. `(prefers-color-scheme: dark)`). */
export type ThemeConditionMedia = {
  readonly type: 'media';
  readonly query: string;
};

/** Match an attribute on the themed element (`self`) or an ancestor (`ancestor`). */
export type ThemeConditionAttr = {
  readonly type: 'attr';
  readonly name: string;
  readonly value: string;
  readonly scope: 'self' | 'ancestor';
};

/** Match a class on the themed element (`self`) or an ancestor (`ancestor`). */
export type ThemeConditionClass = {
  readonly type: 'class';
  readonly name: string;
  readonly scope: 'self' | 'ancestor';
};

/** Raw selector escape hatch — the selector is used as an ancestor context for the theme class. */
export type ThemeConditionSelector = {
  readonly type: 'selector';
  readonly selector: string;
};

/** All child conditions must hold. */
export type ThemeConditionAnd = {
  readonly type: 'and';
  readonly conditions: readonly ThemeCondition[];
};

/** Any child condition must hold (emits separate rules per branch). */
export type ThemeConditionOr = {
  readonly type: 'or';
  readonly conditions: readonly ThemeCondition[];
};

/** Negate a single-branch condition (see `tokens.when.not` JSDoc for limits). */
export type ThemeConditionNot = {
  readonly type: 'not';
  readonly condition: ThemeCondition;
};

/**
 * A condition that determines **when** a set of token overrides applies.
 * Conditions compile to media queries, selector prefixes/suffixes, or combinations.
 */
export type ThemeCondition =
  | ThemeConditionMedia
  | ThemeConditionAttr
  | ThemeConditionClass
  | ThemeConditionSelector
  | ThemeConditionAnd
  | ThemeConditionOr
  | ThemeConditionNot;

// ---------------------------------------------------------------------------
// Theme mode / config / surface
// ---------------------------------------------------------------------------

/**
 * A single mode layer within a theme surface.
 * Applies `overrides` when `when` is satisfied.
 */
export type ThemeModeDefinition = {
  readonly id: string;
  readonly overrides: ThemeOverrides;
  readonly when: ThemeCondition;
};

/**
 * Configuration for `tokens.createTheme()`.
 * Provide `modes` (manual) **or** `colorMode` (preset), not both.
 */
export type ThemeConfig = {
  /** Base token overrides — emitted as `.theme-{name} { … }`. */
  base?: ThemeOverrides;
  /** Manual mode layers with explicit conditions. Mutually exclusive with `colorMode`. */
  modes?: ThemeModeDefinition[];
  /** Preset mode layers from `tokens.colorMode.*`. Mutually exclusive with `modes`. */
  colorMode?: ThemeModeDefinition[];
};

/**
 * The object returned by `tokens.createTheme()`.
 *
 * - `surface.className` — the generated class name (e.g. `"theme-acme"`)
 * - `surface.name` — the theme name (e.g. `"acme"`)
 * - `String(surface)` / template interpolation — coerces to `className`
 */
export interface ThemeSurface {
  readonly className: string;
  readonly name: string;
  toString(): string;
  [Symbol.toPrimitive](hint: string): string;
}

// ---------------------------------------------------------------------------
// Component API types
// ---------------------------------------------------------------------------

/**
 * Styles for a single variant option (or slot variant block).
 * Union with a permissive record so **`[v.name]: value`** from {@link ComponentInternalVarRef}
 * (custom properties) infers as `{ [key: string]: … }` and still matches — that shape is not
 * assignable to {@link CSSProperties} alone, which would otherwise reject the dimensioned overload
 * and fall through to unrelated `component` overloads. **`Record<string, unknown>`** also covers
 * objects that mix custom-property keys with nested selector blocks like `'&:hover'`.
 */
export type VariantOptionStyle = CSSProperties | Record<string, unknown>;

/**
 * A map of variant dimensions to their options (each option is {@link VariantOptionStyle}).
 */
export type VariantDefinitions = Record<string, Record<string, VariantOptionStyle>>;
export type SlotStyles<S extends string> = Partial<Record<S, VariantOptionStyle>>;
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

/**
 * A CSS custom property reference as a `var(--…)` value (tokens, `createVar()`, component internal vars).
 */
export type CSSVarRef = `var(--${string})`;

// ---------------------------------------------------------------------------
// Dimensioned variant config (has `variants: { ... }`)
// ---------------------------------------------------------------------------

/**
 * Leaf shape for `ctx.vars({ … })` — mirrors typed tokens: `value` is the default (merged into `base`);
 * optional `syntax` / `inherits` register `@property` like typed design tokens.
 */
export type ComponentVarDescriptor = {
  value: string | number;
  syntax?: string;
  inherits?: boolean;
};

/**
 * Nested map of component internal vars (same nesting as `tokens.create` / theme token trees).
 */
export type ComponentVarNode =
  | string
  | number
  | ComponentVarDescriptor
  | { [key: string]: ComponentVarNode };

export type ComponentVarDefinitions = {
  [key: string]: ComponentVarNode;
};

/**
 * Options for `ctx.var(id, options?)`. Set `value` to merge a default into `base` and as `@property` initial-value when `syntax` is set.
 */
export type ComponentVarOptions = {
  value?: string | number;
  syntax?: string;
  inherits?: boolean;
};

/**
 * Reference to a component-scoped custom property: `.name` for declaration keys and transitions, `.var` for values.
 */
export type ComponentInternalVarRef = {
  readonly name: string;
  readonly var: CSSVarRef;
};

/**
 * Context passed to `styles.component(namespace, (ctx) => { ... })` to declare internal custom properties.
 */
/** Proxy tree returned by `ctx.vars({ … })` — leaves are `{ name, var }`, nested objects are sub-trees. */
export type ComponentVarRefTree<T> = {
  [K in keyof T]: T[K] extends ComponentVarDescriptor | string | number
    ? ComponentInternalVarRef
    : ComponentVarRefTree<T[K]>;
};

export type ComponentConfigContext = {
  var: (id: string, options?: ComponentVarOptions) => ComponentInternalVarRef;
  vars: <const T extends ComponentVarDefinitions>(definitions: T) => ComponentVarRefTree<T>;
};

/**
 * The full config object passed to styles.component() with dimensioned variants.
 */
export type ComponentConfig<V extends VariantDefinitions> = {
  base?: CSSProperties;
  variants?: V;
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: VariantOptionStyle;
  }>;
  defaultVariants?: ComponentSelections<V>;
};

// ---------------------------------------------------------------------------
// Flat variant config (no `variants` key — each key besides `base` is a variant)
// ---------------------------------------------------------------------------

/**
 * Config for flat variants: `{ base: {...}, elevated: {...}, compact: {...} }`.
 * Each key besides `base` is a boolean-style variant.
 *
 * **`variants`**, **`defaultVariants`**, **`compoundVariants`**, and **`slots`** are forbidden
 * on this shape so TypeScript does not pick the flat overload for CVA-style or slot configs.
 * Nested variant maps can otherwise satisfy {@link CSSProperties} too loosely (index signatures),
 * which produced wrong callable types for `styles.component(ns, (ctx) => ({ variants: … }), { layer })`
 * when cascade layers are enabled.
 */
export type FlatComponentConfig<K extends string> = {
  base?: CSSProperties;
  variants?: never;
  defaultVariants?: never;
  compoundVariants?: never;
  slots?: never;
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
// Multi-slot components (no variants, just multiple independent slot styles)
// ---------------------------------------------------------------------------

export type MultiSlotConfig<Slots extends readonly string[]> = {
  slots: Slots;
} & Partial<Record<Slots[number], CSSProperties>>;

export type MultiSlotReturn<Slots extends readonly string[]> = {
  (): Record<Slots[number], string>;
} & {
  readonly [K in Slots[number]]: string;
};

// ---------------------------------------------------------------------------
// Slot component types
// ---------------------------------------------------------------------------

export type SlotComponentConfig<
  Slots extends readonly string[],
  V extends SlotVariantDefinitions<Slots[number]>,
> = {
  slots: Slots;
  base?: SlotStyles<Slots[number]>;
  variants?: V;
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: SlotStyles<Slots[number]>;
  }>;
  defaultVariants?: ComponentSelections<V>;
};

export type SlotComponentFunction<
  Slots extends readonly string[],
  V extends SlotVariantDefinitions<Slots[number]>,
> = (selections?: ComponentSelections<V>) => Record<Slots[number], string>;

/**
 * Config for `styles.component` may be a plain object or a function that receives {@link ComponentConfigContext}.
 */
export type ComponentConfigInput<V extends VariantDefinitions> =
  | ComponentConfig<V>
  | ((ctx: ComponentConfigContext) => ComponentConfig<V>);

export type FlatComponentConfigInput<K extends string> =
  | FlatComponentConfig<K>
  | ((ctx: ComponentConfigContext) => FlatComponentConfig<K>);

export type SlotComponentConfigInput<
  Slots extends readonly string[],
  V extends SlotVariantDefinitions<Slots[number]>,
> =
  | SlotComponentConfig<Slots, V>
  | ((ctx: ComponentConfigContext) => SlotComponentConfig<Slots, V>);

export type MultiSlotConfigInput<Slots extends readonly string[]> =
  | MultiSlotConfig<Slots>
  | ((ctx: ComponentConfigContext) => MultiSlotConfig<Slots>);

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
 * `src` value for {@link FontFaceProps}: a single CSS `src` fragment or multiple
 * fragments joined with commas (same as authoring `url(...), local(...)` by hand).
 */
export type FontFaceSrc = string | readonly string[];

/**
 * Font face property declarations.
 *
 * Maps to standard `@font-face` descriptors. Values are emitted verbatim in CSS.
 */
export type FontFaceProps = {
  src: FontFaceSrc;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic' | 'oblique' | string;
  fontDisplay?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  fontStretch?: string;
  unicodeRange?: string;
  /** `size-adjust` — fallback tuning and font-size-adjust related metrics. */
  sizeAdjust?: string;
  /** `ascent-override` */
  ascentOverride?: string;
  /** `descent-override` */
  descentOverride?: string;
  /** `line-gap-override` */
  lineGapOverride?: string;
};
