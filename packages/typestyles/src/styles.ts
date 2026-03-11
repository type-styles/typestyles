import type { CSSProperties, SelectorFunction, StyleDefinitions } from './types.js';
import { serializeStyle } from './css.js';
import { insertRules } from './sheet.js';
import { registeredNamespaces } from './registry.js';

/**
 * Create a single class with the given styles. Returns the class name string.
 * Use this when you don't need variants — just a class with typed CSS properties.
 *
 * @example
 * ```ts
 * const card = styles.class('card', {
 *   padding: '1rem',
 *   borderRadius: '0.5rem',
 *   backgroundColor: 'white',
 *   '&:hover': { boxShadow: '0 4px 6px rgb(0 0 0 / 0.1)' },
 * });
 *
 * <div className={card} />  // class="card"
 * ```
 */
export function createClass(name: string, properties: CSSProperties): string {
  if (process.env.NODE_ENV !== 'production') {
    if (registeredNamespaces.has(name)) {
      console.warn(
        `[typestyles] styles.class('${name}', ...) called more than once. ` +
          `This will cause class name collisions. Each class name should be unique.`,
      );
    }
  }
  registeredNamespaces.add(name);

  const selector = `.${name}`;
  const rules = serializeStyle(selector, properties);
  insertRules(rules);

  return name;
}

/**
 * Create a style group and return a selector function.
 *
 * **Two-argument form** (definitions object with 'base' and variants):
 * ```ts
 * const button = styles.create('button', {
 *   base: { padding: '8px 16px' },
 *   primary: { backgroundColor: '#0066ff' },
 * });
 * button('base', 'primary')  // "button-base button-primary"
 * ```
 *
 * **Three-argument form** (base styles + variants, no 'base' key needed):
 * ```ts
 * const button = styles.create('button',
 *   { padding: '8px 16px', borderRadius: '6px' },  // base styles
 *   {
 *     default: { backgroundColor: '#0066ff', color: '#fff' },
 *     outline: { border: '1px solid', backgroundColor: 'transparent' },
 *     large: { padding: '12px 24px' },
 *   }
 * );
 * button('default')           // "button-base button-default" — base always included
 * button('outline', 'large')   // "button-base button-outline button-large"
 * ```
 */
export function createStyles<K extends string>(
  namespace: string,
  definitions: StyleDefinitions & Record<K, CSSProperties>,
): SelectorFunction<K>;
export function createStyles(
  namespace: string,
  base: CSSProperties,
  variants: Record<string, CSSProperties>,
): SelectorFunction<string>;
export function createStyles(
  namespace: string,
  baseOrDefinitions: CSSProperties | (StyleDefinitions & Record<string, CSSProperties>),
  variants?: Record<string, CSSProperties>,
): SelectorFunction<string> {
  const definitions: StyleDefinitions & Record<string, CSSProperties> =
    variants !== undefined
      ? { base: baseOrDefinitions as CSSProperties, ...variants }
      : (baseOrDefinitions as StyleDefinitions & Record<string, CSSProperties>);

  const withBase = variants !== undefined;
  // Development-mode duplicate detection
  if (process.env.NODE_ENV !== 'production') {
    if (registeredNamespaces.has(namespace)) {
      console.warn(
        `[typestyles] styles.create('${namespace}', ...) called more than once. ` +
          `This will cause class name collisions. Each namespace should be unique.`,
      );
    }
  }
  registeredNamespaces.add(namespace);

  // Generate and inject CSS for all variants
  const rules: Array<{ key: string; css: string }> = [];

  for (const [variant, properties] of Object.entries(definitions)) {
    const className = `${namespace}-${variant}`;
    const selector = `.${className}`;
    const variantRules = serializeStyle(selector, properties as CSSProperties);
    rules.push(...variantRules);
  }

  insertRules(rules);

  // Return the selector function
  const selectorFn = (...variants: (string | false | null | undefined)[]): string => {
    const filtered = variants.filter(Boolean);
    const classes = withBase
      ? ['base', ...filtered.filter((v) => v !== 'base')]
      : filtered;
    return classes.map((v) => `${namespace}-${v as string}`).join(' ');
  };

  return selectorFn as SelectorFunction<string>;
}

/**
 * Compose multiple selector functions or class strings into one.
 * Returns a new SelectorFunction that calls all inputs and joins results.
 *
 * @example
 * ```ts
 * const base = styles.create('base', { padding: '8px' });
 * const primary = styles.create('primary', { color: 'blue' });
 * const button = styles.compose(base, primary);
 *
 * button('padding', 'color'); // "base-padding primary-color"
 * ```
 */
type AnySelectorFunction = {
  (...args: unknown[]): string;
};

export function compose(
  ...selectors: Array<AnySelectorFunction | string | false | null | undefined>
): AnySelectorFunction {
  const validSelectors = selectors.filter(Boolean) as Array<AnySelectorFunction | string>;

  return (...args: unknown[]): string => {
    const classNames: string[] = [];

    for (const selector of validSelectors) {
      if (typeof selector === 'string') {
        classNames.push(selector);
      } else {
        const result = selector(...args);
        if (result) classNames.push(result);
      }
    }

    return classNames.join(' ');
  };
}
