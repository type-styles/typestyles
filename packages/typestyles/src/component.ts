import type {
  CSSProperties,
  VariantDefinitions,
  ComponentAttrsResult,
  ComponentAttrsReturn,
  ComponentConfig,
  ComponentConfigContext,
  ComponentConfigInput,
  ComponentConfigInputAttribute,
  ComponentReturn,
  FlatComponentConfig,
  FlatComponentConfigInput,
  FlatComponentReturn,
  SlotComponentConfig,
  SlotComponentConfigInput,
  SlotComponentFunction,
  SlotVariantDefinitions,
  MultiSlotConfig,
  MultiSlotConfigInput,
  MultiSlotReturn,
} from './types';
import { insertRules, invalidateComponentNamespaceForDev } from './sheet';
import { applyLayerToRules, assertOwnLayer } from './layers';
import { registeredNamespaces, warnUnscopedCollision } from './registry';
import { emittedComponentClassPrefix, type ClassNamingConfig } from './class-naming';
import { classNamesAndRulesForProperties } from './atomic-decompose';
import { createComponentConfigContextPair } from './component-config-context';
import { attachComposeMeta } from './compose-meta';

// ---------------------------------------------------------------------------
// Reserved keys that signal a dimensioned config (not flat variant keys)
// ---------------------------------------------------------------------------
const RESERVED_KEYS = new Set([
  'base',
  'variants',
  'compoundVariants',
  'defaultVariants',
  'slots',
  'variantStrategy',
]);

function devWarnUnknownVariantDimensions(
  namespace: string,
  selections: Record<string, unknown>,
  variants: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === 'production') return;
  for (const key of Object.keys(selections)) {
    if (!Object.prototype.hasOwnProperty.call(variants, key)) {
      console.error(
        `[typestyles] Unknown variant dimension "${key}" for namespace "${namespace}".`,
      );
    }
  }
}

/** When `effective` resolves to no valid option class, warn in dev (typos, bad defaults). */
function devWarnInvalidDimensionOption(
  namespace: string,
  dimension: string,
  effective: unknown,
  selected: string | undefined,
  optionMap: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === 'production') return;
  if (effective == null || effective === false) return;
  if (selected != null && Object.prototype.hasOwnProperty.call(optionMap, selected)) return;
  console.error(
    `[typestyles] Unknown variant "${String(effective)}" for dimension "${dimension}" in namespace "${namespace}".`,
  );
}

function devWarnUnknownFlatVariantKeys(
  namespace: string,
  selections: Record<string, unknown>,
  variantKeys: readonly string[],
): void {
  if (process.env.NODE_ENV === 'production') return;
  const allowed = new Set(variantKeys);
  for (const key of Object.keys(selections)) {
    if (key === 'base') continue;
    if (!allowed.has(key)) {
      console.error(`[typestyles] Unknown variant "${key}" for namespace "${namespace}".`);
    }
  }
}

/**
 * Detect whether a config uses dimensioned variants (has `variants` key)
 * or flat variants (every non-`base` key is a variant).
 */
function isDimensionedConfig(
  config: Record<string, unknown>,
): config is ComponentConfig<VariantDefinitions> {
  return (
    'variants' in config ||
    'compoundVariants' in config ||
    'defaultVariants' in config ||
    'variantStrategy' in config
  );
}

function isSlotWithVariantsConfig(
  config: Record<string, unknown>,
): config is SlotComponentConfig<readonly string[], SlotVariantDefinitions<string>> {
  return (
    'slots' in config &&
    ('variants' in config || 'compoundVariants' in config || 'defaultVariants' in config)
  );
}

function isMultiSlotConfig(
  config: Record<string, unknown>,
): config is MultiSlotConfig<readonly string[]> {
  return (
    'slots' in config &&
    !('variants' in config || 'compoundVariants' in config || 'defaultVariants' in config)
  );
}

function resolveComponentConfig(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: Record<string, unknown> | ((ctx: ComponentConfigContext) => Record<string, unknown>),
): Record<string, unknown> {
  if (typeof config === 'function') {
    const { ctx, mergeVarDefaultsInto } = createComponentConfigContextPair(classNaming, namespace);
    const resolved = config(ctx) as Record<string, unknown>;
    return mergeVarDefaultsInto(resolved);
  }
  return config;
}

// ---------------------------------------------------------------------------
// Public API — overloads
// ---------------------------------------------------------------------------

/**
 * Create a multi-variant component style.
 *
 * Returns an object that is **both callable and destructurable**:
 * - Call it as a function with variant selections → class string (base always included)
 * - Destructure it to access individual class strings
 *
 * Supports two config styles:
 *
 * **Dimensioned variants** (recommended for multi-axis variants):
 * ```ts
 * const button = styles.component('button', {
 *   base: { padding: '8px 16px' },
 *   variants: {
 *     intent: {
 *       primary: { backgroundColor: '#0066ff', color: '#fff' },
 *       ghost: { backgroundColor: 'transparent' },
 *     },
 *     size: {
 *       sm: { fontSize: '14px' },
 *       lg: { fontSize: '18px', padding: '12px 24px' },
 *     },
 *   },
 *   compoundVariants: [
 *     { variants: { intent: 'primary', size: 'lg' }, style: { fontWeight: 700 } },
 *   ],
 *   defaultVariants: { intent: 'primary', size: 'sm' },
 * });
 *
 * // Function call — base always included, defaults applied
 * button()                                    // "button-base button-intent-primary button-size-sm"
 * button({ intent: 'ghost' })                 // "button-base button-intent-ghost button-size-sm"
 * button({ intent: 'primary', size: 'lg' })   // includes compound class
 *
 * // Destructure individual class strings
 * const { base, 'intent-primary': primary } = button;
 * ```
 *
 * **Flat variants** (simple boolean-style toggles):
 * ```ts
 * const card = styles.component('card', {
 *   base: { padding: '16px', borderRadius: '8px' },
 *   elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
 *   compact: { padding: '8px' },
 * });
 *
 * // Function call
 * card()                        // "card-base"
 * card({ elevated: true })      // "card-base card-elevated"
 *
 * // Destructure
 * const { base, elevated } = card;
 * ```
 *
 * **Function config** — declare internal custom properties for variant-driven styling:
 * ```ts
 * const badge = styles.component('badge', (c) => {
 *   const v = c.vars({
 *     textColor: '#333',
 *     borderColor: { value: '#ccc', syntax: '<color>', inherits: false },
 *   });
 *   return {
 *     base: { color: v.textColor.var, borderColor: v.borderColor.var, borderWidth: '1px' },
 *     variants: {
 *       tone: {
 *         neutral: {},
 *         danger: { [v.textColor.name]: '#900', [v.borderColor.name]: '#f00' },
 *       },
 *     },
 *     defaultVariants: { tone: 'neutral' },
 *   };
 * });
 * ```
 */
/**
 * Attribute-driven variants — `variantStrategy: 'attribute'` compiles each `variants` option to a
 * `&[data-{dimension}="{option}"]` selector scoped under the single `base` class instead of a
 * discrete class. Boolean dimensions (`{ true, false }` option keys) are presence-based:
 * `true` → `&[data-{dimension}]`, `false` → `&:not([data-{dimension}])`.
 *
 * ```ts
 * const button = styles.component('button', {
 *   base: { padding: '8px 16px' },
 *   variants: {
 *     variant: {
 *       primary: { backgroundColor: '#0066ff', color: '#fff' },
 *       secondary: { backgroundColor: '#6b7280', color: '#fff' },
 *     },
 *   },
 *   defaultVariants: { variant: 'primary' },
 *   variantStrategy: 'attribute',
 * });
 *
 * const b = button({ variant: 'primary' });
 * b.className   // "button-base"
 * b.attrs       // { 'data-variant': 'primary' }
 * b.props       // { className: 'button-base', 'data-variant': 'primary' }
 * String(b)     // "button-base"
 * ```
 *
 * Only the plain dimensioned config shape is supported — not `slots` or flat configs.
 * Not settable per-dimension: `variantStrategy` applies to the whole component.
 */
export function createComponent<const V extends VariantDefinitions>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: ComponentConfigInputAttribute<V>,
  layer?: string,
): ComponentAttrsReturn<V>;

export function createComponent<const V extends VariantDefinitions>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: ComponentConfigInput<V>,
  layer?: string,
): ComponentReturn<V>;

export function createComponent<const K extends string>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: FlatComponentConfigInput<K>,
  layer?: string,
): FlatComponentReturn<K>;

export function createComponent<
  const Slots extends readonly string[],
  V extends SlotVariantDefinitions<Slots[number]>,
>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: SlotComponentConfigInput<Slots, V>,
  layer?: string,
): SlotComponentFunction<Slots, V>;

export function createComponent<const Slots extends readonly string[]>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: MultiSlotConfigInput<Slots>,
  layer?: string,
): MultiSlotReturn<Slots>;

export function createComponent(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: Record<string, unknown> | ((ctx: ComponentConfigContext) => Record<string, unknown>),
  layer?: string,
): unknown {
  if (classNaming.cascadeLayers) {
    if (layer == null || layer === '') {
      throw new Error(
        `[typestyles] \`layer\` is required in the third argument when using \`createStyles({ layers })\` — ` +
          `e.g. styles.component('${namespace}', config, { layer: '…' }).`,
      );
    }
    assertOwnLayer(classNaming.cascadeLayers, layer, `styles.component('${namespace}', …)`);
  }

  claimComponentNamespace(classNaming, namespace);

  const resolved = resolveComponentConfig(classNaming, namespace, config);
  if (isMultiSlotConfig(resolved)) {
    return createMultiSlotComponent(
      classNaming,
      namespace,
      resolved as MultiSlotConfig<readonly string[]>,
      layer,
    );
  }
  if (isSlotWithVariantsConfig(resolved)) {
    return createSlotComponent(
      classNaming,
      namespace,
      resolved as SlotComponentConfig<readonly string[], SlotVariantDefinitions<string>>,
      layer,
    );
  }
  if (isDimensionedConfig(resolved)) {
    const dimensionedConfig = resolved as ComponentConfig<VariantDefinitions>;
    const effectiveVariantStrategy =
      dimensionedConfig.variantStrategy ?? classNaming.defaultVariantStrategy ?? 'class';
    if (effectiveVariantStrategy === 'attribute') {
      return createAttributeDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
    }
    return createDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
  }
  return createFlatComponent(
    classNaming,
    namespace,
    resolved as FlatComponentConfig<string>,
    layer,
  );
}

// ---------------------------------------------------------------------------
// Dimensioned variant component (the primary path)
// ---------------------------------------------------------------------------

function registryKeyForComponent(classNaming: ClassNamingConfig, namespace: string): string {
  const scope = classNaming.scopeId || 'default';
  return `${scope}:${namespace}`;
}

/**
 * Reserves the logical namespace before config resolution so nested `styles.component` calls
 * cannot bypass duplicate detection.
 *
 * In **development**, a second registration for the same scope + namespace clears prior sheet
 * keys and registry state (same as `typestyles/hmr` invalidation). Some bundlers (notably Astro)
 * can re-run the module before `import.meta.hot.dispose` fires, so this keeps HMR from throwing.
 * In **production**, duplicate registration does not throw (rule insertion dedupes by key).
 */
function claimComponentNamespace(classNaming: ClassNamingConfig, namespace: string): void {
  const key = registryKeyForComponent(classNaming, namespace);
  if (process.env.NODE_ENV !== 'production' && registeredNamespaces.has(key)) {
    if (!classNaming.scopeId) {
      warnUnscopedCollision(namespace, 'styles.component');
    }
    invalidateComponentNamespaceForDev(
      namespace,
      emittedComponentClassPrefix(classNaming, namespace) ?? undefined,
    );
  }
  registeredNamespaces.add(key);
}

function finalizeComponentRules(
  classNaming: ClassNamingConfig,
  layer: string | undefined,
  rules: Array<{ key: string; css: string }>,
): Array<{ key: string; css: string }> {
  if (classNaming.cascadeLayers && layer) {
    return applyLayerToRules(rules, layer, classNaming.cascadeLayers);
  }
  return rules;
}

function createDimensionedComponent<V extends VariantDefinitions>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: ComponentConfig<V>,
  layer?: string,
): ComponentReturn<V> {
  const { base, variants = {} as V, compoundVariants = [], defaultVariants = {} } = config;

  const rules: Array<{ key: string; css: string }> = [];

  // Track all class names for the destructurable properties
  const classMap: Record<string, string> = {};

  // 1. Base
  let baseClassName: string | undefined;
  if (base) {
    const emitted = classNamesAndRulesForProperties(
      classNaming,
      base,
      namespace,
      'base',
      'component',
    );
    baseClassName = emitted.classNames;
    classMap['base'] = baseClassName;
    rules.push(...emitted.rules);
  }

  // 2. Variant options
  const variantClassByKey: Record<string, string> = {};
  for (const [dimension, options] of Object.entries(variants)) {
    for (const [option, properties] of Object.entries(options as Record<string, CSSProperties>)) {
      const segment = `${dimension}-${option}`;
      const emitted = classNamesAndRulesForProperties(
        classNaming,
        properties,
        namespace,
        segment,
        'component',
      );
      variantClassByKey[segment] = emitted.classNames;
      classMap[segment] = emitted.classNames;
      rules.push(...emitted.rules);
    }
  }

  // 3. Compound variants
  const compoundClassByIndex: string[] = [];
  (compoundVariants as Array<{ variants: Record<string, unknown>; style: CSSProperties }>).forEach(
    (cv, index) => {
      const emitted = classNamesAndRulesForProperties(
        classNaming,
        cv.style,
        namespace,
        `compound-${index}`,
        'component',
      );
      compoundClassByIndex[index] = emitted.classNames;
      rules.push(...emitted.rules);
    },
  );

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  // 4. Build the callable + destructurable return
  const selectorFn = (selections: Record<string, unknown> = {}): string => {
    const classes: string[] = [];

    if (base && baseClassName) classes.push(baseClassName);

    devWarnUnknownVariantDimensions(namespace, selections, variants as Record<string, unknown>);

    // Resolve selections with defaults
    const resolved: Record<string, unknown> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, CSSProperties>;
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      const effective = explicit ?? fallback;
      const selected = normalizeSelection(effective, optionMap);
      resolved[dimension] = selected;

      devWarnInvalidDimensionOption(
        namespace,
        dimension,
        effective,
        selected,
        optionMap as Record<string, unknown>,
      );
    }

    // Apply variant classes
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, CSSProperties>;
      const selected = normalizeSelection(resolved[dimension], optionMap);
      if (selected != null) {
        const key = `${dimension}-${selected}`;
        const cn = variantClassByKey[key];
        if (cn) classes.push(cn);
      }
    }

    // Apply compound variant classes
    (
      compoundVariants as Array<{ variants: Record<string, unknown>; style: CSSProperties }>
    ).forEach((cv, index) => {
      const matches = Object.entries(cv.variants).every(([k, expected]) => {
        const options = (variants as Record<string, Record<string, CSSProperties>>)[k];
        if (!options) return false;

        const selected = normalizeSelection(resolved[k], options);
        if (selected == null) return false;

        if (Array.isArray(expected)) {
          return expected.some((value) => normalizeSelection(value, options) === selected);
        }

        return normalizeSelection(expected, options) === selected;
      });
      if (matches) {
        const cn = compoundClassByIndex[index];
        if (cn) classes.push(cn);
      }
    });

    return classes.join(' ');
  };

  const result = makeCallableObject(
    (...args: unknown[]) => selectorFn(args[0] as Record<string, unknown> | undefined),
    classMap,
  ) as ComponentReturn<V>;

  attachComposeMeta(result, Object.keys(variants));

  return result;
}

// ---------------------------------------------------------------------------
// Dimensioned variant component — attribute strategy
// (variantStrategy: 'attribute'; see specs/attribute-driven-variants.md)
// ---------------------------------------------------------------------------

/**
 * Whether a dimension's option keys are exactly `{ true, false }` — the boolean-variant
 * convention already used by `normalizeSelection` / the docs. Boolean dimensions compile to a
 * presence selector (`&[data-x]` / `&:not([data-x])`) instead of a value match.
 */
function isBooleanOptionKeys(optionKeys: readonly string[]): boolean {
  return optionKeys.length === 2 && optionKeys.includes('true') && optionKeys.includes('false');
}

/** `&[data-{dimension}="{option}"]`, or the boolean presence-selector form. */
function attributeSelectorFor(
  dimension: string,
  option: string,
  optionKeys: readonly string[],
): string {
  const attrName = `data-${dimension}`;
  if (isBooleanOptionKeys(optionKeys)) {
    return option === 'true' ? `[${attrName}]` : `:not([${attrName}])`;
  }
  return `[${attrName}="${option}"]`;
}

/** Merge `properties` into `target[key]`, combining with any prior properties at that selector. */
function mergeIntoSelectorKey(
  target: Record<string, unknown>,
  key: string,
  properties: CSSProperties,
): void {
  const existing = target[key] as CSSProperties | undefined;
  target[key] = existing ? { ...existing, ...properties } : { ...properties };
}

function createAttributeDimensionedComponent<V extends VariantDefinitions>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: ComponentConfig<V>,
  layer?: string,
): ComponentAttrsReturn<V> {
  const { base, variants = {} as V, compoundVariants = [], defaultVariants = {} } = config;

  // Fold each variant option's style into `base` as a synthetic `&[data-x="y"]` nested-selector
  // key, then run it through the same base-emission path every other component shape uses — this
  // reuses the existing nested-selector CSS pipeline (atomic-decompose.ts / css.ts) as-is, so
  // semantic/hashed/compact/atomic naming modes all work with no mode-specific branching here.
  const mergedBase: Record<string, unknown> = { ...(base ?? {}) };

  for (const [dimension, options] of Object.entries(variants)) {
    const optionMap = options as Record<string, CSSProperties>;
    const optionKeys = Object.keys(optionMap);
    for (const [option, properties] of Object.entries(optionMap)) {
      if (properties == null || Object.keys(properties).length === 0) continue;
      const selectorKey = `&${attributeSelectorFor(dimension, option, optionKeys)}`;
      mergeIntoSelectorKey(mergedBase, selectorKey, properties);
    }
  }

  (compoundVariants as Array<{ variants: Record<string, unknown>; style: CSSProperties }>).forEach(
    (cv) => {
      const selectorSuffix = Object.entries(cv.variants)
        .map(([dimension, expected]) => {
          const optionMap = (variants as Record<string, Record<string, CSSProperties>>)[dimension];
          if (!optionMap) return '';
          const optionKeys = Object.keys(optionMap);
          const values = Array.isArray(expected) ? expected : [expected];
          const selectors = values
            .map((value) => normalizeSelection(value, optionMap))
            .filter((selected): selected is string => selected != null)
            .map((selected) => attributeSelectorFor(dimension, selected, optionKeys));
          if (selectors.length === 0) return '';
          return selectors.length === 1 ? selectors[0] : `:is(${selectors.join(', ')})`;
        })
        .join('');

      if (!selectorSuffix) return;
      mergeIntoSelectorKey(mergedBase, `&${selectorSuffix}`, cv.style);
    },
  );

  const rules: Array<{ key: string; css: string }> = [];
  const emitted = classNamesAndRulesForProperties(
    classNaming,
    mergedBase as CSSProperties,
    namespace,
    'base',
    'component',
  );
  const baseClassName = emitted.classNames;
  rules.push(...emitted.rules);

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  const selectorFn = (selections: Record<string, unknown> = {}): ComponentAttrsResult => {
    devWarnUnknownVariantDimensions(namespace, selections, variants as Record<string, unknown>);

    const attrs: Record<string, string> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, CSSProperties>;
      const optionKeys = Object.keys(optionMap);
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      const effective = explicit ?? fallback;
      const selected = normalizeSelection(effective, optionMap);

      devWarnInvalidDimensionOption(
        namespace,
        dimension,
        effective,
        selected,
        optionMap as Record<string, unknown>,
      );

      if (selected == null) continue;

      if (isBooleanOptionKeys(optionKeys)) {
        if (selected === 'true') attrs[`data-${dimension}`] = '';
      } else {
        attrs[`data-${dimension}`] = selected;
      }
    }

    return createComponentAttrsResult(baseClassName, attrs);
  };

  return makeCallableObject(
    (...args: unknown[]) => selectorFn(args[0] as Record<string, unknown> | undefined),
    { base: baseClassName },
  ) as ComponentAttrsReturn<V>;
}

function createComponentAttrsResult(
  className: string,
  attrs: Record<string, string>,
): ComponentAttrsResult {
  const props = { className, ...attrs };
  return {
    className,
    attrs,
    props,
    toString() {
      return className;
    },
    [Symbol.toPrimitive]() {
      return className;
    },
  };
}

// ---------------------------------------------------------------------------
// Flat variant component
// ---------------------------------------------------------------------------

function createFlatComponent<K extends string>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: FlatComponentConfig<K>,
  layer?: string,
): FlatComponentReturn<K> {
  const rules: Array<{ key: string; css: string }> = [];
  const classMap: Record<string, string> = {};
  const variantKeys: string[] = [];

  for (const [key, properties] of Object.entries(config)) {
    if (RESERVED_KEYS.has(key) && key !== 'base') continue;
    const props = properties as CSSProperties;
    const segment = key;
    const emitted = classNamesAndRulesForProperties(
      classNaming,
      props,
      namespace,
      segment,
      'component',
    );
    classMap[segment] = emitted.classNames;
    rules.push(...emitted.rules);
    if (key !== 'base') {
      variantKeys.push(key);
    }
  }

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  const baseClassName = classMap['base'];

  const selectorFn = (selections: Record<string, unknown> = {}): string => {
    const classes: string[] = [];

    devWarnUnknownFlatVariantKeys(namespace, selections, variantKeys);

    if (baseClassName) classes.push(baseClassName);

    for (const key of variantKeys) {
      if (selections[key]) {
        const cn = classMap[key];
        if (cn) classes.push(cn);
      }
    }

    return classes.join(' ');
  };

  const result = makeCallableObject(
    (...args: unknown[]) => selectorFn(args[0] as Record<string, unknown> | undefined),
    classMap,
  ) as FlatComponentReturn<K>;

  attachComposeMeta(result, variantKeys);

  return result;
}

// ---------------------------------------------------------------------------
// Multi-slot component (no variants, just multiple independent slot styles)
// ---------------------------------------------------------------------------

function createMultiSlotComponent<Slots extends readonly string[]>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: MultiSlotConfig<Slots>,
  layer?: string,
): MultiSlotReturn<Slots> {
  const { slots } = config;

  const rules: Array<{ key: string; css: string }> = [];
  const slotClassMap: Record<string, string> = {};

  for (const slot of slots) {
    const properties = (config as Record<string, CSSProperties | undefined>)[slot];
    if (properties) {
      const emitted = classNamesAndRulesForProperties(
        classNaming,
        properties,
        namespace,
        slot,
        'component',
      );
      slotClassMap[slot] = emitted.classNames;
      rules.push(...emitted.rules);
    } else {
      slotClassMap[slot] = '';
    }
  }

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  const selectorFn = (): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const slot of slots) {
      result[slot] = slotClassMap[slot] || '';
    }
    return result;
  };

  return makeMultiSlotObject(selectorFn, slotClassMap) as MultiSlotReturn<Slots>;
}

function makeMultiSlotObject(
  selectorFn: () => Record<string, string>,
  slotClassMap: Record<string, string>,
): unknown {
  const fn = function (this: unknown) {
    return selectorFn();
  };

  Object.defineProperties(
    fn,
    Object.fromEntries(
      Object.entries(slotClassMap).map(([key, value]) => [
        key,
        { value, enumerable: true, writable: false, configurable: false },
      ]),
    ),
  );

  return fn;
}

// ---------------------------------------------------------------------------
// Slot component (unchanged behavior, kept for complex multi-element components)
// ---------------------------------------------------------------------------

function createSlotComponent<
  Slots extends readonly string[],
  V extends SlotVariantDefinitions<Slots[number]>,
>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: SlotComponentConfig<Slots, V>,
  layer?: string,
): SlotComponentFunction<Slots, V> {
  const {
    slots,
    base = {},
    variants = {} as V,
    compoundVariants = [],
    defaultVariants = {},
  } = config;

  const rules: Array<{ key: string; css: string }> = [];

  const baseClassBySlot: Record<string, string> = {};
  for (const [slot, properties] of Object.entries(base as Record<string, CSSProperties>)) {
    const emitted = classNamesAndRulesForProperties(
      classNaming,
      properties,
      namespace,
      slot,
      'component',
    );
    baseClassBySlot[slot] = emitted.classNames;
    rules.push(...emitted.rules);
  }

  const variantClassByKey: Record<string, string> = {};
  for (const [dimension, options] of Object.entries(variants)) {
    for (const [option, slotStyles] of Object.entries(
      options as Record<string, Record<string, CSSProperties>>,
    )) {
      for (const [slot, properties] of Object.entries(slotStyles)) {
        const segment = `${slot}-${dimension}-${option}`;
        const emitted = classNamesAndRulesForProperties(
          classNaming,
          properties,
          namespace,
          segment,
          'component',
        );
        variantClassByKey[segment] = emitted.classNames;
        rules.push(...emitted.rules);
      }
    }
  }

  const slotCompoundClassByKey: Record<string, string> = {};
  (
    compoundVariants as Array<{
      variants: Record<string, unknown>;
      style: Record<string, CSSProperties>;
    }>
  ).forEach((cv, index) => {
    for (const [slot, properties] of Object.entries(cv.style)) {
      const segment = `${slot}-compound-${index}`;
      const emitted = classNamesAndRulesForProperties(
        classNaming,
        properties,
        namespace,
        segment,
        'component',
      );
      slotCompoundClassByKey[`${slot}::${index}`] = emitted.classNames;
      rules.push(...emitted.rules);
    }
  });

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  return ((selections: Record<string, unknown> = {}) => {
    const classes = Object.fromEntries(
      (slots as readonly string[]).map((slot) => [slot, [] as string[]]),
    ) as Record<string, string[]>;

    devWarnUnknownVariantDimensions(namespace, selections, variants as Record<string, unknown>);

    const resolvedSelections: Record<string, unknown> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, unknown>;
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      const effective = explicit ?? fallback;
      const selected = normalizeSelection(effective, optionMap);
      resolvedSelections[dimension] = selected;

      devWarnInvalidDimensionOption(namespace, dimension, effective, selected, optionMap);
    }

    for (const [slot, properties] of Object.entries(base as Record<string, CSSProperties>)) {
      const cn = baseClassBySlot[slot];
      if (cn && classes[slot]) classes[slot].push(cn);
      void properties; // used only for iteration
    }

    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, Record<string, CSSProperties>>;
      const selected = normalizeSelection(resolvedSelections[dimension], optionMap);
      if (selected == null) continue;
      const slotStyles = optionMap[selected];
      if (!slotStyles) continue;

      for (const slot of Object.keys(slotStyles)) {
        const segment = `${slot}-${dimension}-${selected}`;
        const cn = variantClassByKey[segment];
        if (cn && classes[slot]) classes[slot].push(cn);
      }
    }

    (
      compoundVariants as Array<{
        variants: Record<string, unknown>;
        style: Record<string, CSSProperties>;
      }>
    ).forEach((cv, index) => {
      const matches = Object.entries(cv.variants).every(([k, expected]) => {
        const options = (variants as Record<string, Record<string, unknown>>)[k];
        if (!options) return false;

        const selected = normalizeSelection(resolvedSelections[k], options);
        if (selected == null) return false;

        if (Array.isArray(expected)) {
          return expected.some((value) => normalizeSelection(value, options) === selected);
        }

        return normalizeSelection(expected, options) === selected;
      });

      if (!matches) return;

      for (const slot of Object.keys(cv.style)) {
        const cn = slotCompoundClassByKey[`${slot}::${index}`];
        if (cn && classes[slot]) classes[slot].push(cn);
      }
    });

    return Object.fromEntries(
      (slots as readonly string[]).map((slot) => [slot, classes[slot].join(' ')]),
    ) as Record<Slots[number], string>;
  }) as SlotComponentFunction<Slots, V>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeSelection(value: unknown, options: Record<string, unknown>): string | undefined {
  if (value == null) return undefined;

  if (typeof value === 'boolean') {
    const boolKey = String(value);
    if (Object.prototype.hasOwnProperty.call(options, boolKey)) return boolKey;
    if (value === false) return undefined;
    return boolKey;
  }

  return String(value);
}

/**
 * Create an object that is both callable as a function and has properties
 * for each class in the classMap. This is the CVA-style return.
 *
 * Uses a Proxy so that:
 * - Calling it invokes selectorFn
 * - Property access returns the class string from classMap
 * - Destructuring works via standard property enumeration
 */
function makeCallableObject(
  selectorFn: (...args: unknown[]) => unknown,
  classMap: Record<string, string>,
): unknown {
  // Create the function as the base (makes it callable)
  const fn = function (this: unknown, ...args: unknown[]) {
    return selectorFn(...args);
  };

  // Copy class map properties onto the function
  Object.defineProperties(
    fn,
    Object.fromEntries(
      Object.entries(classMap).map(([key, value]) => [
        key,
        { value, enumerable: true, writable: false, configurable: false },
      ]),
    ),
  );

  return fn;
}
