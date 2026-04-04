import type {
  CSSProperties,
  CSSPropertiesWithUtils,
  StyleUtils,
  VariantDefinitions,
  ComponentConfig,
  ComponentReturn,
  FlatComponentConfig,
  FlatComponentReturn,
  SlotVariantDefinitions,
  SlotComponentConfig,
  SlotComponentFunction,
  MultiSlotConfig,
  MultiSlotReturn,
} from './types.js';
import { serializeStyle } from './css.js';
import { insertRules } from './sheet.js';
import { registeredNamespaces } from './registry.js';
import {
  buildSingleClassName,
  defaultClassNamingConfig,
  hashString,
  mergeClassNaming,
  sanitizeClassSegment,
  stableSerialize,
  type ClassNamingConfig,
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
function registryKeyForClass(classNaming: ClassNamingConfig, name: string): string {
  const scope = classNaming.scopeId || 'default';
  return `${scope}:${name}`;
}

export function createClass(
  classNaming: ClassNamingConfig,
  name: string,
  properties: CSSProperties,
): string {
  const regKey = registryKeyForClass(classNaming, name);
  if (process.env.NODE_ENV !== 'production') {
    if (registeredNamespaces.has(regKey)) {
      console.warn(
        `[typestyles] styles.class('${name}', ...) called more than once. ` +
          `This will cause class name collisions. Each class name should be unique.`,
      );
    }
  }
  registeredNamespaces.add(regKey);

  const className = buildSingleClassName(classNaming, name, properties);
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
export function createHashClass(
  classNaming: ClassNamingConfig,
  properties: CSSProperties,
  label?: string,
): string {
  const cfg = classNaming;
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
 * Returns a new function that calls all inputs and joins results.
 *
 * @example
 * ```ts
 * const base = styles.component('base', { base: { padding: '8px' } });
 * const primary = styles.component('primary', { base: { color: 'blue' } });
 * const button = styles.compose(base, primary);
 *
 * button(); // "base-base primary-base"
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

// ---------------------------------------------------------------------------
// withUtils
// ---------------------------------------------------------------------------

export type StylesApi = {
  /** Resolved naming config for this instance (useful for debugging). */
  readonly classNaming: Readonly<ClassNamingConfig>;
  class: (name: string, properties: CSSProperties) => string;
  hashClass: (properties: CSSProperties, label?: string) => string;
  component: {
    <V extends VariantDefinitions>(
      namespace: string,
      config: ComponentConfig<V>,
    ): ComponentReturn<V>;
    <K extends string>(namespace: string, config: FlatComponentConfig<K>): FlatComponentReturn<K>;
    <S extends string, V extends SlotVariantDefinitions<S>>(
      namespace: string,
      config: SlotComponentConfig<S, V>,
    ): SlotComponentFunction<S, V>;
    <S extends string>(namespace: string, config: MultiSlotConfig<S>): MultiSlotReturn<S>;
  };
  withUtils: <U extends StyleUtils>(utils: U) => StylesWithUtilsApi<U>;
  compose: typeof compose;
};

/**
 * Create a styles API with its own class naming config (scope, mode, prefix).
 * Use one instance per package or micro-frontend so hashed names and dev warnings
 * stay isolated without global mutation.
 */
export function createStyles(partial?: Partial<ClassNamingConfig>): StylesApi {
  const classNaming = mergeClassNaming(partial);

  return {
    classNaming,
    class: (name, properties) => createClass(classNaming, name, properties),
    hashClass: (properties, label) => createHashClass(classNaming, properties, label),
    component: ((namespace: string, config: Record<string, unknown>) =>
      createComponent(classNaming, namespace, config)) as StylesApi['component'],
    withUtils: (utils) => createStylesWithUtils(utils, classNaming),
    compose,
  };
}

export type StylesWithUtilsApi<U extends StyleUtils> = {
  class: (name: string, properties: CSSPropertiesWithUtils<U>) => string;
  hashClass: (properties: CSSPropertiesWithUtils<U>, label?: string) => string;
  component: {
    <V extends VariantDefinitions>(
      namespace: string,
      config: ComponentConfig<V>,
    ): ComponentReturn<V>;
    <K extends string>(namespace: string, config: FlatComponentConfig<K>): FlatComponentReturn<K>;
    <S extends string, V extends SlotVariantDefinitions<S>>(
      namespace: string,
      config: SlotComponentConfig<S, V>,
    ): SlotComponentFunction<S, V>;
    <S extends string>(namespace: string, config: MultiSlotConfig<S>): MultiSlotReturn<S>;
  };
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
 * const card = u.component('card', {
 *   base: { size: 40, marginX: 16 },
 * });
 * ```
 */
export function createStylesWithUtils<U extends StyleUtils>(
  utils: U,
  classNaming: ClassNamingConfig = defaultClassNamingConfig,
): StylesWithUtilsApi<U> {
  const apply = (properties: CSSPropertiesWithUtils<U>): CSSProperties =>
    expandStyleWithUtils(properties, utils);

  function component(namespace: string, config: Record<string, unknown>): unknown {
    const transformed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(config)) {
      if (key === 'base' && value && typeof value === 'object') {
        transformed[key] = apply(value as CSSPropertiesWithUtils<U>);
      } else if (key === 'variants' && value && typeof value === 'object') {
        const variants: Record<string, Record<string, CSSProperties>> = {};
        for (const [dim, options] of Object.entries(value as Record<string, unknown>)) {
          variants[dim] = {};
          for (const [opt, props] of Object.entries(options as Record<string, unknown>)) {
            variants[dim][opt] = apply(props as CSSPropertiesWithUtils<U>);
          }
        }
        transformed[key] = variants;
      } else if (key === 'compoundVariants' && Array.isArray(value)) {
        transformed[key] = value.map(
          (cv: { variants: Record<string, unknown>; style: CSSPropertiesWithUtils<U> }) => ({
            ...cv,
            style: apply(cv.style),
          }),
        );
      } else if (
        key !== 'defaultVariants' &&
        key !== 'slots' &&
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        // Flat variant — apply utils to the CSS properties
        transformed[key] = apply(value as CSSPropertiesWithUtils<U>);
      } else {
        transformed[key] = value;
      }
    }

    return createComponent(
      classNaming,
      namespace,
      transformed as ComponentConfig<VariantDefinitions>,
    );
  }

  return {
    class: (name, properties) => createClass(classNaming, name, apply(properties)),
    hashClass: (properties, label) => createHashClass(classNaming, apply(properties), label),
    component: component as StylesWithUtilsApi<U>['component'],
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
