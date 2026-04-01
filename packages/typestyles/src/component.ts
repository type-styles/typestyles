import type {
  CSSProperties,
  VariantDefinitions,
  ComponentConfig,
  ComponentFunction,
  SlotComponentConfig,
  SlotComponentFunction,
  SlotVariantDefinitions,
} from './types.js';
import { serializeStyle } from './css.js';
import { insertRules } from './sheet.js';
import { registeredNamespaces } from './registry.js';
import { buildComponentClassName } from './class-naming.js';
import { getBreakpoints, buildBreakpointClassName } from './breakpoints.js';

/**
 * Create a multi-variant component style and return a selector function.
 *
 * Class naming convention (default `semantic` mode; see `configureClassNaming`):
 *   base                         → `{namespace}-base`
 *   variants.intent.primary      → `{namespace}-intent-primary`
 *   compoundVariants[0]          → `{namespace}-compound-0`
 *
 * @example
 * ```ts
 * const button = styles.component('button', {
 *   base: { padding: '8px 16px' },
 *   variants: {
 *     intent: {
 *       primary: { backgroundColor: '#0066ff', color: '#fff' },
 *       ghost:   { backgroundColor: 'transparent', border: '1px solid currentColor' },
 *     },
 *     size: {
 *       sm: { fontSize: '12px' },
 *       lg: { fontSize: '18px' },
 *     },
 *   },
 *   compoundVariants: [
 *     { variants: { intent: 'primary', size: 'lg' }, style: { fontWeight: 700 } },
 *   ],
 *   defaultVariants: { intent: 'primary', size: 'sm' },
 * });
 *
 * button()                        // "button-base button-intent-primary button-size-sm"
 * button({ intent: 'ghost' })     // "button-base button-intent-ghost button-size-sm"
 * button({ intent: 'primary', size: 'lg' }) // includes compound class
 * ```
 */
export function createComponent<V extends VariantDefinitions>(
  namespace: string,
  config: ComponentConfig<V>,
): ComponentFunction<V>;

export function createComponent<S extends string, V extends SlotVariantDefinitions<S>>(
  namespace: string,
  config: SlotComponentConfig<S, V>,
): SlotComponentFunction<S, V>;
export function createComponent(
  namespace: string,
  config: ComponentConfig<VariantDefinitions> | SlotComponentConfig<string, SlotVariantDefinitions<string>>,
): ComponentFunction<VariantDefinitions> | SlotComponentFunction<string, SlotVariantDefinitions<string>> {
  if ('slots' in config) {
    return createSlotComponent(
      namespace,
      config as SlotComponentConfig<string, SlotVariantDefinitions<string>>,
    );
  }
  return createSingleComponent(namespace, config as ComponentConfig<VariantDefinitions>);
}

function createSingleComponent<V extends VariantDefinitions>(
  namespace: string,
  config: ComponentConfig<V>,
): ComponentFunction<V> {
  const { base, variants = {} as V, compoundVariants = [], defaultVariants = {} } = config;

  // Development-mode duplicate detection
  if (process.env.NODE_ENV !== 'production') {
    if (registeredNamespaces.has(namespace)) {
      console.warn(
        `[typestyles] styles.component('${namespace}', ...) called more than once. ` +
          `This will cause class name collisions. Each namespace should be unique.`
      );
    }
  }
  registeredNamespaces.add(namespace);

  const rules: Array<{ key: string; css: string }> = [];

  let baseClassName: string | undefined;
  const variantClassByKey: Record<string, string> = {};
  // Map of "bp:dimension-option" → breakpoint-prefixed class name
  const responsiveClassByKey: Record<string, string> = {};
  const compoundClassByIndex: string[] = [];

  // 1. Inject CSS for base
  if (base) {
    baseClassName = buildComponentClassName(namespace, 'base', base);
    rules.push(...serializeStyle(`.${baseClassName}`, base));
  }

  // 2. Inject CSS for each variant option, plus breakpoint-responsive variants
  const breakpoints = getBreakpoints();
  for (const [dimension, options] of Object.entries(variants)) {
    for (const [option, properties] of Object.entries(options as Record<string, CSSProperties>)) {
      const segment = `${dimension}-${option}`;
      const className = buildComponentClassName(namespace, segment, properties);
      variantClassByKey[segment] = className;
      rules.push(...serializeStyle(`.${className}`, properties));

      // Generate a media-query-wrapped class for each configured breakpoint
      for (const [bp, minWidth] of Object.entries(breakpoints)) {
        const bpClassName = buildBreakpointClassName(bp, className);
        responsiveClassByKey[`${bp}:${segment}`] = bpClassName;
        const innerRules = serializeStyle(`.${bpClassName}`, properties);
        for (const inner of innerRules) {
          rules.push({
            key: `bp:${bp}:${inner.key}`,
            css: `@media (min-width: ${minWidth}) { ${inner.css} }`,
          });
        }
      }
    }
  }

  // 3. Inject CSS for each compound variant
  (compoundVariants as Array<{ variants: Record<string, unknown>; style: CSSProperties }>).forEach(
    (cv, index) => {
      const className = buildComponentClassName(namespace, `compound-${index}`, cv.style);
      compoundClassByIndex[index] = className;
      rules.push(...serializeStyle(`.${className}`, cv.style));
    }
  );

  insertRules(rules);

  // 4. Return the selector function
  return ((selections: Record<string, unknown> = {}) => {
    const classes: string[] = [];

    if (base && baseClassName) classes.push(baseClassName);

    // Resolve final selections (explicit overrides defaultVariants).
    // A selection can be a plain value or a responsive object like
    // { initial: 'sm', md: 'lg' }.
    const resolvedSelections: Record<string, unknown> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, CSSProperties>;
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      const raw = explicit ?? fallback;
      // Normalize responsive objects: extract the 'initial' key as the base value
      resolvedSelections[dimension] = isResponsiveObject(raw)
        ? normalizeSelection(raw['initial'], optionMap)
        : normalizeSelection(raw, optionMap);
    }

    // Apply variant classes
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, CSSProperties>;
      const raw = (selections[dimension] ?? (defaultVariants as Record<string, unknown>)[dimension]);

      if (isResponsiveObject(raw)) {
        // Apply initial (base) class if present
        const initialKey = normalizeSelection(raw['initial'], optionMap);
        if (initialKey != null) {
          const cn = variantClassByKey[`${dimension}-${initialKey}`];
          if (cn) classes.push(cn);
        }
        // Apply breakpoint-specific classes
        for (const [bp, bpValue] of Object.entries(raw)) {
          if (bp === 'initial') continue;
          const bpKey = normalizeSelection(bpValue, optionMap);
          if (bpKey != null) {
            const cn = responsiveClassByKey[`${bp}:${dimension}-${bpKey}`];
            if (cn) classes.push(cn);
          }
        }
      } else {
        const selectedKey = normalizeSelection(resolvedSelections[dimension], optionMap);
        if (selectedKey != null) {
          const variantKey = `${dimension}-${selectedKey}`;
          const cn = variantClassByKey[variantKey];
          if (cn) classes.push(cn);
        }
      }
    }

    // Apply compound variant classes (uses the resolved initial value for matching)
    (compoundVariants as Array<{ variants: Record<string, unknown>; style: CSSProperties }>).forEach(
      (cv, index) => {
        const matches = Object.entries(cv.variants).every(([k, expected]) => {
          const options = (variants as Record<string, Record<string, CSSProperties>>)[k];
          if (!options) return false;

          const selected = normalizeSelection(resolvedSelections[k], options);
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
      }
    );

    return classes.join(' ');
  }) as ComponentFunction<V>;
}

/**
 * Check whether a variant selection is a responsive object
 * (e.g. `{ initial: 'sm', md: 'lg' }`) vs a plain scalar value.
 */
function isResponsiveObject(
  value: unknown,
): value is Record<string, string | boolean | null | undefined> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof RegExp)
  );
}


function normalizeSelection(
  value: unknown,
  options: Record<string, unknown>,
): string | undefined {
  if (value == null) return undefined;

  if (typeof value === 'boolean') {
    const boolKey = String(value);
    if (Object.prototype.hasOwnProperty.call(options, boolKey)) return boolKey;
    // Preserve existing behavior: false acts as an opt-out when no "false" variant is defined.
    if (value === false) return undefined;
    return boolKey;
  }

  return String(value);
}

function createSlotComponent<S extends string, V extends SlotVariantDefinitions<S>>(
  namespace: string,
  config: SlotComponentConfig<S, V>,
): SlotComponentFunction<S, V> {
  const { slots, base = {}, variants = {} as V, compoundVariants = [], defaultVariants = {} } = config;

  // Development-mode duplicate detection
  if (process.env.NODE_ENV !== 'production') {
    if (registeredNamespaces.has(namespace)) {
      console.warn(
        `[typestyles] styles.component('${namespace}', ...) called more than once. ` +
          `This will cause class name collisions. Each namespace should be unique.`
      );
    }
  }
  registeredNamespaces.add(namespace);

  const rules: Array<{ key: string; css: string }> = [];

  const baseClassBySlot: Record<string, string> = {};
  for (const [slot, properties] of Object.entries(base as Record<string, CSSProperties>)) {
    const className = buildComponentClassName(namespace, slot, properties);
    baseClassBySlot[slot] = className;
    rules.push(...serializeStyle(`.${className}`, properties));
  }

  const variantClassByKey: Record<string, string> = {};
  for (const [dimension, options] of Object.entries(variants)) {
    for (const [option, slotStyles] of Object.entries(options as Record<string, Record<string, CSSProperties>>)) {
      for (const [slot, properties] of Object.entries(slotStyles)) {
        const segment = `${slot}-${dimension}-${option}`;
        const className = buildComponentClassName(namespace, segment, properties);
        variantClassByKey[segment] = className;
        rules.push(...serializeStyle(`.${className}`, properties));
      }
    }
  }

  const slotCompoundClassByKey: Record<string, string> = {};
  (compoundVariants as Array<{ variants: Record<string, unknown>; style: Record<string, CSSProperties> }>).forEach(
    (cv, index) => {
      for (const [slot, properties] of Object.entries(cv.style)) {
        const segment = `${slot}-compound-${index}`;
        const className = buildComponentClassName(namespace, segment, properties);
        slotCompoundClassByKey[`${slot}::${index}`] = className;
        rules.push(...serializeStyle(`.${className}`, properties));
      }
    }
  );

  insertRules(rules);

  return ((selections: Record<string, unknown> = {}) => {
    const classes = Object.fromEntries((slots as readonly string[]).map((slot) => [slot, [] as string[]])) as Record<
      string,
      string[]
    >;

    const resolvedSelections: Record<string, unknown> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, unknown>;
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      resolvedSelections[dimension] = normalizeSelection(explicit ?? fallback, optionMap);
    }

    for (const slot of Object.keys(base as Record<string, CSSProperties>)) {
      const cn = baseClassBySlot[slot];
      if (cn && classes[slot]) classes[slot].push(cn);
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

    (compoundVariants as Array<{ variants: Record<string, unknown>; style: Record<string, CSSProperties> }>).forEach(
      (cv, index) => {
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
      }
    );

    return Object.fromEntries(
      (slots as readonly string[]).map((slot) => [slot, classes[slot].join(' ')])
    ) as Record<S, string>;
  }) as SlotComponentFunction<S, V>;
}
