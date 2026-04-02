import type {
  CSSProperties,
  CSSPropertiesWithUtils,
  ComponentConfig,
  ComponentFunction,
  VariantDefinitions,
  StyleUtils,
} from './types.js';
import { serializeStyle } from './css.js';
import { insertRules } from './sheet.js';
import { registeredNamespaces } from './registry.js';
import {
  buildSingleClassName,
  getClassNamingConfig,
  hashString,
  sanitizeClassSegment,
  stableSerialize,
} from './class-naming.js';
import { createComponent } from './component.js';

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
 * Compose multiple component functions or class strings into one.
 * Returns a function that calls all inputs and joins results.
 *
 * @example
 * ```ts
 * const card = styles.class('card', { padding: '8px' });
 * const button = styles.component('button', {
 *   base: { cursor: 'pointer' },
 *   variants: { intent: { primary: { color: 'blue' } } },
 * });
 *
 * const composed = styles.compose(card, button);
 * composed({ intent: 'primary' }); // "card button button-intent-primary"
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
  component: <V extends VariantDefinitions>(
    namespace: string,
    config: ComponentConfig<V> & { base?: CSSPropertiesWithUtils<U> },
  ) => ComponentFunction<V>;
  compose: typeof compose;
};

/**
 * Create a utility-aware styles API, similar to Stitches' `utils`.
 *
 * @example
 * ```ts
 * const u = styles.withUtils({
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

  function component<V extends VariantDefinitions>(
    namespace: string,
    config: ComponentConfig<V> & { base?: CSSPropertiesWithUtils<U> },
  ): ComponentFunction<V> {
    const transformedConfig: ComponentConfig<V> = {
      ...config,
      base: config.base ? apply(config.base) : undefined,
    };

    // Transform variant styles
    if (config.variants) {
      const transformedVariants: Record<string, Record<string, CSSProperties>> = {};
      for (const [dimension, options] of Object.entries(config.variants)) {
        transformedVariants[dimension] = {};
        for (const [option, properties] of Object.entries(
          options as Record<string, CSSPropertiesWithUtils<U>>,
        )) {
          transformedVariants[dimension][option] = apply(properties);
        }
      }
      transformedConfig.variants = transformedVariants as V;
    }

    // Transform compound variant styles
    if (config.compoundVariants) {
      transformedConfig.compoundVariants = (
        config.compoundVariants as Array<Record<string, unknown>>
      ).map((cv) => {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(cv)) {
          if (key === 'css') {
            result.css = apply(value as CSSPropertiesWithUtils<U>);
          } else {
            result[key] = value;
          }
        }
        return result;
      }) as ComponentConfig<V>['compoundVariants'];
    }

    return createComponent(namespace, transformedConfig);
  }

  return {
    class: (name, properties) => createClass(name, apply(properties)),
    hashClass: (properties, label) => createHashClass(apply(properties), label),
    component,
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
      targetRecord[key] = mergeStyleObjects(existing as CSSProperties, value as CSSProperties);
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
