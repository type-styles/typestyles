import type {
  CSSProperties,
  CSSPropertiesWithUtils,
  SelectorFunction,
  StyleDefinitions,
  StyleDefinitionsWithUtils,
  StyleUtils,
} from './types.js';
import { serializeStyle, serializeAtomicStyle } from './css.js';
import { insertRules } from './sheet.js';
import { registeredNamespaces } from './registry.js';
import {
  buildComponentClassName,
  buildSingleClassName,
  getClassNamingConfig,
  hashString,
  sanitizeClassSegment,
  stableSerialize,
} from './class-naming.js';

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

  const className = buildSingleClassName(name, properties);
  const selector = `.${className}`;
  const rules = serializeStyle(selector, properties);
  insertRules(rules);

  return className;
}

/**
 * Create a deterministic hashed class from a style object.
 * The same style object shape+values always returns the same class name.
 *
 * Optional `label` is appended as a readable prefix for debugging.
 *
 * @example
 * ```ts
 * const button = styles.hashClass({
 *   padding: '8px 12px',
 *   borderRadius: '8px',
 * });
 *
 * const danger = styles.hashClass(
 *   { backgroundColor: 'red', color: 'white' },
 *   'danger'
 * );
 * ```
 */
export function createHashClass(properties: CSSProperties, label?: string): string {
  const cfg = getClassNamingConfig();
  const serialized =
    cfg.scopeId !== ''
      ? stableSerialize({ scope: cfg.scopeId, properties })
      : stableSerialize(properties);
  const hash = hashString(serialized);
  const className = label
    ? `${cfg.prefix}-${sanitizeClassSegment(label)}-${hash}`
    : `${cfg.prefix}-${hash}`;
  const selector = `.${className}`;
  const rules = serializeStyle(selector, properties);
  insertRules(rules);
  return className;
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
  const variantToClass: Record<string, string> = {};

  for (const [variant, properties] of Object.entries(definitions)) {
    const props = properties as CSSProperties;
    const className = buildComponentClassName(namespace, variant, props);
    variantToClass[variant] = className;
    const selector = `.${className}`;
    const variantRules = serializeStyle(selector, props);
    rules.push(...variantRules);
  }

  insertRules(rules);

  // Return the selector function
  const selectorFn = (...variants: (string | false | null | undefined)[]): string => {
    const filtered = variants.filter(Boolean);
    const classes = withBase
      ? ['base', ...filtered.filter((v) => v !== 'base')]
      : filtered;
    return classes.map((v) => variantToClass[v as string] ?? '').filter(Boolean).join(' ');
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

export type StylesWithUtilsApi<U extends StyleUtils> = {
  class: (name: string, properties: CSSPropertiesWithUtils<U>) => string;
  hashClass: (properties: CSSPropertiesWithUtils<U>, label?: string) => string;
  create: {
    <K extends string>(
      namespace: string,
      definitions: StyleDefinitionsWithUtils<U> & Record<K, CSSPropertiesWithUtils<U>>,
    ): SelectorFunction<K>;
    (
      namespace: string,
      base: CSSPropertiesWithUtils<U>,
      variants: Record<string, CSSPropertiesWithUtils<U>>,
    ): SelectorFunction<string>;
  };
  compose: typeof compose;
};

/**
 * Create a utility-aware styles API, similar to Stitches' `utils`.
 *
 * @example
 * ```ts
 * const u = createStylesWithUtils({
 *   marginX: (value: string | number) => ({ marginLeft: value, marginRight: value }),
 *   size: (value: string | number) => ({ width: value, height: value }),
 * });
 *
 * const card = u.class('card', {
 *   size: 40,
 *   marginX: 16,
 * });
 * ```
 */
export function createStylesWithUtils<U extends StyleUtils>(utils: U): StylesWithUtilsApi<U> {
  const apply = (properties: CSSPropertiesWithUtils<U>): CSSProperties =>
    expandStyleWithUtils(properties, utils);

  function create<K extends string>(
    namespace: string,
    definitions: StyleDefinitionsWithUtils<U> & Record<K, CSSPropertiesWithUtils<U>>,
  ): SelectorFunction<K>;
  function create(
    namespace: string,
    base: CSSPropertiesWithUtils<U>,
    variants: Record<string, CSSPropertiesWithUtils<U>>,
  ): SelectorFunction<string>;
  function create(
    namespace: string,
    baseOrDefinitions:
      | CSSPropertiesWithUtils<U>
      | (StyleDefinitionsWithUtils<U> & Record<string, CSSPropertiesWithUtils<U>>),
    variants?: Record<string, CSSPropertiesWithUtils<U>>,
  ): SelectorFunction<string> {
    if (variants !== undefined) {
      const transformedVariants = Object.fromEntries(
        Object.entries(variants).map(([variant, properties]) => [variant, apply(properties)]),
      );
      return createStyles(namespace, apply(baseOrDefinitions as CSSPropertiesWithUtils<U>), transformedVariants);
    }

    const transformedDefinitions = Object.fromEntries(
      Object.entries(
        baseOrDefinitions as StyleDefinitionsWithUtils<U> & Record<string, CSSPropertiesWithUtils<U>>,
      ).map(([variant, properties]) => [variant, apply(properties)]),
    ) as StyleDefinitions & Record<string, CSSProperties>;

    return createStyles(namespace, transformedDefinitions);
  }

  return {
    class: (name, properties) => createClass(name, apply(properties)),
    hashClass: (properties, label) => createHashClass(apply(properties), label),
    create,
    compose,
  };
}

function expandStyleWithUtils<U extends StyleUtils>(
  properties: CSSPropertiesWithUtils<U>,
  utils: U,
): CSSProperties {
  const expanded: CSSProperties = {};

  for (const [key, value] of Object.entries(properties as Record<string, unknown>)) {
    if (value == null) continue;

    if (key.startsWith('&') || key.startsWith('[') || key.startsWith('@')) {
      if (isObject(value)) {
        assignStyleEntry(
          expanded,
          key,
          expandStyleWithUtils(value as CSSPropertiesWithUtils<U>, utils),
        );
      }
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(utils, key)) {
      const utilFn = utils[key as keyof U] as unknown as (arg: unknown) => CSSProperties;
      const utilResult = utilFn(value);
      const normalized = expandStyleWithUtils(utilResult as CSSPropertiesWithUtils<U>, utils);
      for (const [utilKey, utilValue] of Object.entries(normalized as Record<string, unknown>)) {
        assignStyleEntry(expanded, utilKey, utilValue);
      }
      continue;
    }

    assignStyleEntry(expanded, key, value);
  }

  return expanded;
}

function assignStyleEntry(target: CSSProperties, key: string, value: unknown): void {
  const targetRecord = target as Record<string, unknown>;

  if (isObject(value)) {
    const existing = targetRecord[key];
    if (isObject(existing)) {
      targetRecord[key] = mergeStyleObjects(
        existing as CSSProperties,
        value as CSSProperties,
      );
      return;
    }
    targetRecord[key] = value;
    return;
  }

  targetRecord[key] = value;
}

function mergeStyleObjects(base: CSSProperties, next: CSSProperties): CSSProperties {
  const merged: CSSProperties = { ...base };

  for (const [key, value] of Object.entries(next as Record<string, unknown>)) {
    assignStyleEntry(merged, key, value);
  }

  return merged;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Apply atomic CSS decomposition to a single style object.
 *
 * Each CSS declaration is split into its own class, identified by a stable
 * hash of `property:value`. Identical declarations across different components
 * share the same class, so CSS file size plateaus as the codebase grows.
 *
 * Returns the composed class-name string (space-separated atomic classes).
 * The generated CSS rules are registered immediately.
 *
 * @param properties - The style object to decompose atomically.
 * @param prefix     - Class name prefix. Defaults to the configured class naming prefix (`"ts"`).
 *
 * @example
 * ```ts
 * // These two calls produce the SAME CSS — the `.ts-abc1` class is only
 * // emitted once even though two components use `color: red`.
 * const a = styles.atomic({ color: 'red', fontSize: '14px' });
 * const b = styles.atomic({ color: 'red', fontWeight: 700 });
 *
 * // a → "ts-abc1 ts-def2"
 * // b → "ts-abc1 ts-ghi3"  (ts-abc1 reused — no duplicate CSS)
 * ```
 */
export function atomicStyles(
  properties: CSSProperties,
  prefix?: string,
): string {
  const cfg = getClassNamingConfig();
  const { classes, rules } = serializeAtomicStyle(properties, prefix ?? cfg.prefix);
  insertRules(rules);
  return classes.join(' ');
}
