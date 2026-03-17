import type {
  CSSProperties,
  CSSPropertiesWithUtils,
  SelectorFunction,
  StyleDefinitions,
  StyleDefinitionsWithUtils,
  StyleUtils,
} from './types.js';
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
  const serialized = stableSerialize(properties);
  const hash = hashString(serialized);
  const className = label ? `ts-${sanitizeLabel(label)}-${hash}` : `ts-${hash}`;
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
  (...args: any[]): string;
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
      const utilFn = utils[key as keyof U] as (arg: unknown) => CSSProperties;
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

function stableSerialize(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableSerialize(v)).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableSerialize(v)}`);

  return `{${entries.join(',')}}`;
}

function hashString(input: string): string {
  // FNV-1a 32-bit hash, compact base36 output.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function sanitizeLabel(label: string): string {
  const normalized = label.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return normalized.replace(/-+/g, '-').replace(/^-|-$/g, '') || 'style';
}
