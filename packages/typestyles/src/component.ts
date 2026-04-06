import type {
  CSSProperties,
  VariantDefinitions,
  ComponentConfig,
  ComponentConfigContext,
  ComponentConfigInput,
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
import { serializeStyle } from './css';
import { insertRules } from './sheet';
import { applyLayerToRules, assertOwnLayer } from './layers';
import { registeredNamespaces } from './registry';
import { buildComponentClassName, type ClassNamingConfig } from './class-naming';
import { createComponentConfigContextPair } from './component-config-context';

// ---------------------------------------------------------------------------
// Reserved keys that signal a dimensioned config (not flat variant keys)
// ---------------------------------------------------------------------------
const RESERVED_KEYS = new Set(['base', 'variants', 'compoundVariants', 'defaultVariants', 'slots']);

/**
 * Detect whether a config uses dimensioned variants (has `variants` key)
 * or flat variants (every non-`base` key is a variant).
 */
function isDimensionedConfig(
  config: Record<string, unknown>,
): config is ComponentConfig<VariantDefinitions> {
  return 'variants' in config || 'compoundVariants' in config || 'defaultVariants' in config;
}

function isSlotWithVariantsConfig(
  config: Record<string, unknown>,
): config is SlotComponentConfig<string, SlotVariantDefinitions<string>> {
  return (
    'slots' in config &&
    ('variants' in config || 'compoundVariants' in config || 'defaultVariants' in config)
  );
}

function isMultiSlotConfig(config: Record<string, unknown>): config is MultiSlotConfig<string> {
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
export function createComponent<V extends VariantDefinitions>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: ComponentConfigInput<V>,
  layer?: string,
): ComponentReturn<V>;

export function createComponent<K extends string>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: FlatComponentConfigInput<K>,
  layer?: string,
): FlatComponentReturn<K>;

export function createComponent<S extends string, V extends SlotVariantDefinitions<S>>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: SlotComponentConfigInput<S, V>,
  layer?: string,
): SlotComponentFunction<S, V>;

export function createComponent<S extends string>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: MultiSlotConfigInput<S>,
  layer?: string,
): MultiSlotReturn<S>;

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

  const resolved = resolveComponentConfig(classNaming, namespace, config);
  if (isMultiSlotConfig(resolved)) {
    return createMultiSlotComponent(
      classNaming,
      namespace,
      resolved as MultiSlotConfig<string>,
      layer,
    );
  }
  if (isSlotWithVariantsConfig(resolved)) {
    return createSlotComponent(
      classNaming,
      namespace,
      resolved as SlotComponentConfig<string, SlotVariantDefinitions<string>>,
      layer,
    );
  }
  if (isDimensionedConfig(resolved)) {
    return createDimensionedComponent(
      classNaming,
      namespace,
      resolved as ComponentConfig<VariantDefinitions>,
      layer,
    );
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

  warnDuplicate(classNaming, namespace);
  registeredNamespaces.add(registryKeyForComponent(classNaming, namespace));

  const rules: Array<{ key: string; css: string }> = [];

  // Track all class names for the destructurable properties
  const classMap: Record<string, string> = {};

  // 1. Base
  let baseClassName: string | undefined;
  if (base) {
    baseClassName = buildComponentClassName(classNaming, namespace, 'base', base);
    classMap['base'] = baseClassName;
    rules.push(...serializeStyle(`.${baseClassName}`, base));
  }

  // 2. Variant options
  const variantClassByKey: Record<string, string> = {};
  for (const [dimension, options] of Object.entries(variants)) {
    for (const [option, properties] of Object.entries(options as Record<string, CSSProperties>)) {
      const segment = `${dimension}-${option}`;
      const className = buildComponentClassName(classNaming, namespace, segment, properties);
      variantClassByKey[segment] = className;
      classMap[segment] = className;
      rules.push(...serializeStyle(`.${className}`, properties));
    }
  }

  // 3. Compound variants
  const compoundClassByIndex: string[] = [];
  (compoundVariants as Array<{ variants: Record<string, unknown>; style: CSSProperties }>).forEach(
    (cv, index) => {
      const className = buildComponentClassName(
        classNaming,
        namespace,
        `compound-${index}`,
        cv.style,
      );
      compoundClassByIndex[index] = className;
      rules.push(...serializeStyle(`.${className}`, cv.style));
    },
  );

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  // 4. Build the callable + destructurable return
  const selectorFn = (selections: Record<string, unknown> = {}): string => {
    const classes: string[] = [];

    if (base && baseClassName) classes.push(baseClassName);

    // Resolve selections with defaults
    const resolved: Record<string, unknown> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, CSSProperties>;
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      resolved[dimension] = normalizeSelection(explicit ?? fallback, optionMap);
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

  return makeCallableObject(
    (...args: unknown[]) => selectorFn(args[0] as Record<string, unknown> | undefined),
    classMap,
  ) as ComponentReturn<V>;
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
  warnDuplicate(classNaming, namespace);
  registeredNamespaces.add(registryKeyForComponent(classNaming, namespace));

  const rules: Array<{ key: string; css: string }> = [];
  const classMap: Record<string, string> = {};
  const variantKeys: string[] = [];

  for (const [key, properties] of Object.entries(config)) {
    if (RESERVED_KEYS.has(key) && key !== 'base') continue;
    const props = properties as CSSProperties;
    const segment = key;
    const className = buildComponentClassName(classNaming, namespace, segment, props);
    classMap[segment] = className;
    rules.push(...serializeStyle(`.${className}`, props));
    if (key !== 'base') {
      variantKeys.push(key);
    }
  }

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  const baseClassName = classMap['base'];

  const selectorFn = (selections: Record<string, unknown> = {}): string => {
    const classes: string[] = [];

    if (baseClassName) classes.push(baseClassName);

    for (const key of variantKeys) {
      if (selections[key]) {
        const cn = classMap[key];
        if (cn) classes.push(cn);
      }
    }

    return classes.join(' ');
  };

  return makeCallableObject(
    (...args: unknown[]) => selectorFn(args[0] as Record<string, unknown> | undefined),
    classMap,
  ) as FlatComponentReturn<K>;
}

// ---------------------------------------------------------------------------
// Multi-slot component (no variants, just multiple independent slot styles)
// ---------------------------------------------------------------------------

function createMultiSlotComponent<S extends string>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: MultiSlotConfig<S>,
  layer?: string,
): MultiSlotReturn<S> {
  const { slots } = config;

  warnDuplicate(classNaming, namespace);
  registeredNamespaces.add(registryKeyForComponent(classNaming, namespace));

  const rules: Array<{ key: string; css: string }> = [];
  const slotClassMap: Record<string, string> = {};

  for (const slot of slots) {
    const properties = (config as Record<string, CSSProperties | undefined>)[slot];
    if (properties) {
      const className = buildComponentClassName(classNaming, namespace, slot, properties);
      slotClassMap[slot] = className;
      rules.push(...serializeStyle(`.${className}`, properties));
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

  return makeMultiSlotObject(selectorFn, slotClassMap) as MultiSlotReturn<S>;
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

function createSlotComponent<S extends string, V extends SlotVariantDefinitions<S>>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: SlotComponentConfig<S, V>,
  layer?: string,
): SlotComponentFunction<S, V> {
  const {
    slots,
    base = {},
    variants = {} as V,
    compoundVariants = [],
    defaultVariants = {},
  } = config;

  warnDuplicate(classNaming, namespace);
  registeredNamespaces.add(registryKeyForComponent(classNaming, namespace));

  const rules: Array<{ key: string; css: string }> = [];

  const baseClassBySlot: Record<string, string> = {};
  for (const [slot, properties] of Object.entries(base as Record<string, CSSProperties>)) {
    const className = buildComponentClassName(classNaming, namespace, slot, properties);
    baseClassBySlot[slot] = className;
    rules.push(...serializeStyle(`.${className}`, properties));
  }

  const variantClassByKey: Record<string, string> = {};
  for (const [dimension, options] of Object.entries(variants)) {
    for (const [option, slotStyles] of Object.entries(
      options as Record<string, Record<string, CSSProperties>>,
    )) {
      for (const [slot, properties] of Object.entries(slotStyles)) {
        const segment = `${slot}-${dimension}-${option}`;
        const className = buildComponentClassName(classNaming, namespace, segment, properties);
        variantClassByKey[segment] = className;
        rules.push(...serializeStyle(`.${className}`, properties));
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
      const className = buildComponentClassName(classNaming, namespace, segment, properties);
      slotCompoundClassByKey[`${slot}::${index}`] = className;
      rules.push(...serializeStyle(`.${className}`, properties));
    }
  });

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  return ((selections: Record<string, unknown> = {}) => {
    const classes = Object.fromEntries(
      (slots as readonly string[]).map((slot) => [slot, [] as string[]]),
    ) as Record<string, string[]>;

    const resolvedSelections: Record<string, unknown> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, unknown>;
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      resolvedSelections[dimension] = normalizeSelection(explicit ?? fallback, optionMap);
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
    ) as Record<S, string>;
  }) as SlotComponentFunction<S, V>;
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

function warnDuplicate(classNaming: ClassNamingConfig, namespace: string): void {
  if (process.env.NODE_ENV !== 'production') {
    const key = registryKeyForComponent(classNaming, namespace);
    if (registeredNamespaces.has(key)) {
      console.warn(
        `[typestyles] styles.component('${namespace}', ...) called more than once. ` +
          `This will cause class name collisions. Each namespace should be unique.`,
      );
    }
  }
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
  selectorFn: (...args: unknown[]) => string,
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
