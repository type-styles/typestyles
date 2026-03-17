import type {
  CSSProperties,
  VariantDefinitions,
  ComponentConfig,
  ComponentFunction,
  RecipeConfig,
  RecipeFunction,
} from './types.js';
import { serializeStyle } from './css.js';
import { insertRules } from './sheet.js';
import { registeredNamespaces } from './registry.js';

/**
 * Create a multi-variant component style and return a selector function.
 *
 * Class naming convention:
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
): ComponentFunction<V> {
  return createVariantFactory(namespace, config, 'component');
}

/**
 * Create a variant recipe and return a className resolver.
 *
 * This is an alias-style API over `styles.component`, using recipe terminology:
 * `base`, `variants`, `compoundVariants`, and `defaultVariants`.
 */
export function createRecipe<V extends VariantDefinitions>(
  namespace: string,
  config: RecipeConfig<V>,
): RecipeFunction<V> {
  return createVariantFactory(namespace, config, 'recipe');
}

function createVariantFactory<V extends VariantDefinitions>(
  namespace: string,
  config: ComponentConfig<V>,
  apiName: 'component' | 'recipe',
): ComponentFunction<V> {
  const { base, variants = {} as V, compoundVariants = [], defaultVariants = {} } = config;

  // Development-mode duplicate detection
  if (process.env.NODE_ENV !== 'production') {
    if (registeredNamespaces.has(namespace)) {
      console.warn(
        `[typestyles] styles.${apiName}('${namespace}', ...) called more than once. ` +
          `This will cause class name collisions. Each namespace should be unique.`
      );
    }
  }
  registeredNamespaces.add(namespace);

  const rules: Array<{ key: string; css: string }> = [];

  // 1. Inject CSS for base
  if (base) {
    rules.push(...serializeStyle(`.${namespace}-base`, base));
  }

  // 2. Inject CSS for each variant option
  for (const [dimension, options] of Object.entries(variants)) {
    for (const [option, properties] of Object.entries(options as Record<string, CSSProperties>)) {
      const className = `.${namespace}-${dimension}-${option}`;
      rules.push(...serializeStyle(className, properties));
    }
  }

  // 3. Inject CSS for each compound variant
  (compoundVariants as Array<{ variants: Record<string, unknown>; style: CSSProperties }>).forEach(
    (cv, index) => {
      const className = `.${namespace}-compound-${index}`;
      rules.push(...serializeStyle(className, cv.style));
    }
  );

  insertRules(rules);

  // 4. Return the selector function
  return ((selections: Record<string, unknown> = {}) => {
    const classes: string[] = [];

    if (base) classes.push(`${namespace}-base`);

    // Resolve final selections (explicit overrides defaultVariants)
    const resolvedSelections: Record<string, unknown> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, CSSProperties>;
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      resolvedSelections[dimension] = normalizeSelection(explicit ?? fallback, optionMap);
    }

    // Apply variant classes
    for (const [dimension, options] of Object.entries(variants)) {
      const selected = resolvedSelections[dimension];
      const optionMap = options as Record<string, CSSProperties>;
      const selectedKey = normalizeSelection(selected, optionMap);
      if (selectedKey != null) {
        classes.push(`${namespace}-${dimension}-${selectedKey}`);
      }
    }

    // Apply compound variant classes
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
        if (matches) classes.push(`${namespace}-compound-${index}`);
      }
    );

    return classes.join(' ');
  }) as ComponentFunction<V>;
}

function normalizeSelection(
  value: unknown,
  options: Record<string, CSSProperties>,
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
