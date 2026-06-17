import type {
  CSSProperties,
  CSSPropertiesWithUtils,
  StyleUtils,
  VariantDefinitions,
  ComponentConfig,
  ComponentConfigContext,
  ComponentConfigInput,
  ComponentReturn,
  FlatComponentConfigInput,
  FlatComponentReturn,
  SlotVariantDefinitions,
  SlotComponentConfigInput,
  SlotComponentFunction,
  MultiSlotConfigInput,
  MultiSlotReturn,
  RegisteredPropertyOptions,
  RegisteredPropertyRef,
} from './types';
import { serializeStyle } from './css';
import { insertRules } from './sheet';
import type { CascadeLayersInput, CascadeLayersObjectInput } from './layers';
import { applyLayerToRules, assertOwnLayer, resolveCascadeLayers } from './layers';
import { registeredNamespaces, trackEmittedClassName } from './registry';
import {
  defaultClassNamingConfig,
  hashString,
  mergeClassNaming,
  sanitizeClassSegment,
  stableSerialize,
  type ClassNamingConfig,
} from './class-naming';
import { decomposeAtomicStyle, classNamesAndRulesForProperties } from './atomic-decompose';
import { createComponent } from './component';
import { createStylesPropertyFn } from './registered-property';
import {
  container as containerQuery,
  createContainerRef,
  type ContainerNameRef,
} from './container';
import { atRuleBlock as atRuleBlockFn } from './at-rule-block';
import { has as hasNested, is as isNested, where as whereNested } from './relational-pseudo';

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
  layer?: string,
): string {
  const regKey = registryKeyForClass(classNaming, name);
  if (process.env.NODE_ENV !== 'production' && registeredNamespaces.has(regKey)) {
    const scopeLabel = classNaming.scopeId?.trim()
      ? `'${classNaming.scopeId}'`
      : 'default (empty scopeId)';
    throw new Error(
      `[typestyles] styles.class('${name}', ...) was called more than once for scope ${scopeLabel}. ` +
        `Class names would collide. Use a unique class name, or isolate with ` +
        `createStyles({ scopeId: fileScopeId(import.meta) }) or createStyles({ scopeId: 'your-package' }) ` +
        `(import \`fileScopeId\` from 'typestyles').`,
    );
  }
  registeredNamespaces.add(regKey);

  const { classNames, rules } = classNamesAndRulesForProperties(
    classNaming,
    properties,
    name,
    '',
    'class',
  );
  if (classNaming.cascadeLayers) {
    if (layer == null || layer === '') {
      throw new Error(
        `[typestyles] \`layer\` is required in the third argument when using \`createStyles({ layers })\` — ` +
          `e.g. styles.class('${name}', { … }, { layer: '…' }).`,
      );
    }
    assertOwnLayer(classNaming.cascadeLayers, layer, `styles.class('${name}', …)`);
    insertRules(applyLayerToRules(rules, layer, classNaming.cascadeLayers));
  } else {
    insertRules(rules);
  }

  return classNames;
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
  layer?: string,
): string {
  const cfg = classNaming;
  if (cfg.mode === 'atomic') {
    const { classNames, rules } = decomposeAtomicStyle(cfg, properties);
    if (classNaming.cascadeLayers) {
      if (layer == null || layer === '') {
        throw new Error(
          '[typestyles] `layer` is required in the options argument when using `createStyles({ layers })` — ' +
            'e.g. styles.hashClass({ … }, { layer: `utilities` }).',
        );
      }
      assertOwnLayer(classNaming.cascadeLayers, layer, 'styles.hashClass(…)');
      insertRules(applyLayerToRules(rules, layer, classNaming.cascadeLayers));
    } else {
      insertRules(rules);
    }
    return classNames;
  }

  const serialized =
    cfg.scopeId !== ''
      ? stableSerialize({ scope: cfg.scopeId, properties })
      : stableSerialize(properties);
  const hash = hashString(serialized);
  const className = label
    ? `${cfg.prefix}-${sanitizeClassSegment(label)}-${hash}`
    : `${cfg.prefix}-${hash}`;
  // Same payload → same class is intentional dedup; different payloads
  // colliding on one class string is a real hash collision.
  trackEmittedClassName(className, `hashClass:${serialized}`);
  const selector = `.${className}`;
  const rules = serializeStyle(selector, properties);
  if (classNaming.cascadeLayers) {
    if (layer == null || layer === '') {
      throw new Error(
        '[typestyles] `layer` is required in the options argument when using `createStyles({ layers })` — ' +
          'e.g. styles.hashClass({ … }, { layer: `utilities` }).',
      );
    }
    assertOwnLayer(classNaming.cascadeLayers, layer, 'styles.hashClass(…)');
    insertRules(applyLayerToRules(rules, layer, classNaming.cascadeLayers));
  } else {
    insertRules(rules);
  }
  return className;
}

import type { ComposeFn, ComposeSelectorInput } from './types';
import {
  collectComposeAllowedKeys,
  devWarnComposeUnknownKeys,
  type ComposeAwareFn,
} from './compose-meta';

/**
 * Compose multiple component functions or class strings into one.
 * Returns a new function that calls all inputs and joins results.
 *
 * Variant selections are inferred as the intersection of all composed component
 * functions' accepted selection objects.
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
export function compose<const S extends readonly ComposeSelectorInput[]>(
  ...selectors: S
): ComposeFn<S> {
  const validSelectors = selectors.filter(Boolean) as Array<ComposeAwareFn | string>;
  const allowedKeys = collectComposeAllowedKeys(validSelectors);

  const fn = (selections?: Record<string, unknown>): string => {
    devWarnComposeUnknownKeys(selections, allowedKeys);

    const classNames: string[] = [];

    for (const selector of validSelectors) {
      if (typeof selector === 'string') {
        classNames.push(selector);
      } else {
        const result = selector(selections);
        if (result) classNames.push(result);
      }
    }

    return classNames.join(' ');
  };

  return fn as ComposeFn<S>;
}

// ---------------------------------------------------------------------------
// withUtils
// ---------------------------------------------------------------------------

export type StylesApi = {
  /** Resolved naming config for this instance (useful for debugging). */
  readonly classNaming: Readonly<ClassNamingConfig>;
  /**
   * Typed `@container` object keys for nested styles (size features, named containers, or raw conditions).
   * Same function as the named export `container` from `typestyles`.
   */
  readonly container: typeof containerQuery;
  /**
   * Readable `container-name` for `containerName`: `{scopeId}-{label}` or `{prefix}-{label}` when `scopeId` is empty.
   * Same as `createContainerRef(label, { scopeId, prefix })` from this instance’s naming config.
   */
  readonly containerRef: (label: string) => ContainerNameRef;
  /**
   * Build a spreadable `{ [ @key ]: nested }` so computed `@…` keys stay typed (see `atRuleBlock` export).
   */
  readonly atRuleBlock: typeof atRuleBlockFn;
  /**
   * Nested `&:has(…)` object keys (same helpers as the `has` export).
   */
  readonly has: typeof hasNested;
  /**
   * Nested `&:is(…)` object keys for grouped states (same as the `is` export).
   */
  readonly is: typeof isNested;
  /**
   * Nested `&:where(…)` keys — zero-specificity defaults (same as the `where` export).
   */
  readonly where: typeof whereNested;
  /**
   * Register a standalone CSS custom property (optionally with `@property` when `syntax` is set).
   * Returns `{ name, var, toString }` for use in style values and variant overrides.
   */
  property: (id: string, options?: RegisteredPropertyOptions) => RegisteredPropertyRef;
  class: (name: string, properties: CSSProperties) => string;
  hashClass: (properties: CSSProperties, label?: string) => string;
  component: {
    <const V extends VariantDefinitions>(
      namespace: string,
      config: ComponentConfigInput<V>,
    ): ComponentReturn<V>;
    <const K extends string>(
      namespace: string,
      config: FlatComponentConfigInput<K>,
    ): FlatComponentReturn<K>;
    <const Slots extends readonly string[], V extends SlotVariantDefinitions<Slots[number]>>(
      namespace: string,
      config: SlotComponentConfigInput<Slots, V>,
    ): SlotComponentFunction<Slots, V>;
    <const Slots extends readonly string[]>(
      namespace: string,
      config: MultiSlotConfigInput<Slots>,
    ): MultiSlotReturn<Slots>;
  };
  withUtils: <U extends StyleUtils>(utils: U) => StylesWithUtilsApi<U>;
  compose: typeof compose;
};

/** Options argument for styles when `createStyles({ layers })` is used. */
export type LayerOption<L extends string = string> = { readonly layer: L };

export type CreateStylesInput = Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & {
  layers?: CascadeLayersInput;
  /**
   * Only applies when using `createTokens` / `createTypeStyles` for `:root` and theme CSS.
   * Ignored by `createStyles` alone (passing it here avoids repeating the key at the factory).
   */
  tokenLayer?: string;
  /**
   * When set, prefer the overloads that return `StylesWithUtilsApi` — this field exists so combined
   * option objects type-check; do not rely on `createStyles(options?: CreateStylesInput)` alone for utils.
   */
  utils?: StyleUtils;
};

export type LayeredComponentFn<L extends string> = {
  <const V extends VariantDefinitions>(
    namespace: string,
    config: ComponentConfigInput<V>,
    options: LayerOption<L>,
  ): ComponentReturn<V>;
  <const K extends string>(
    namespace: string,
    config: FlatComponentConfigInput<K>,
    options: LayerOption<L>,
  ): FlatComponentReturn<K>;
  <const Slots extends readonly string[], V extends SlotVariantDefinitions<Slots[number]>>(
    namespace: string,
    config: SlotComponentConfigInput<Slots, V>,
    options: LayerOption<L>,
  ): SlotComponentFunction<Slots, V>;
  <const Slots extends readonly string[]>(
    namespace: string,
    config: MultiSlotConfigInput<Slots>,
    options: LayerOption<L>,
  ): MultiSlotReturn<Slots>;
};

export type LayeredComponentFnWithUtils<L extends string> = {
  <const V extends VariantDefinitions>(
    namespace: string,
    config: ComponentConfigInput<V>,
    options: LayerOption<L>,
  ): ComponentReturn<V>;
  <const K extends string>(
    namespace: string,
    config: FlatComponentConfigInput<K>,
    options: LayerOption<L>,
  ): FlatComponentReturn<K>;
  <const Slots extends readonly string[], V extends SlotVariantDefinitions<Slots[number]>>(
    namespace: string,
    config: SlotComponentConfigInput<Slots, V>,
    options: LayerOption<L>,
  ): SlotComponentFunction<Slots, V>;
  <const Slots extends readonly string[]>(
    namespace: string,
    config: MultiSlotConfigInput<Slots>,
    options: LayerOption<L>,
  ): MultiSlotReturn<Slots>;
};

export type StylesWithUtilsApiLayered<U extends StyleUtils, L extends string> = Omit<
  StylesWithUtilsApi<U>,
  'class' | 'hashClass' | 'component'
> & {
  class: (name: string, properties: CSSPropertiesWithUtils<U>, options: LayerOption<L>) => string;
  hashClass: (
    properties: CSSPropertiesWithUtils<U>,
    options: LayerOption<L> & { label?: string },
  ) => string;
  component: LayeredComponentFnWithUtils<L>;
  compose: typeof compose;
};

export type StylesApiWithLayers<L extends string> = Omit<
  StylesApi,
  'class' | 'hashClass' | 'component' | 'withUtils'
> & {
  class: (name: string, properties: CSSProperties, options: LayerOption<L>) => string;
  hashClass: (properties: CSSProperties, options: LayerOption<L> & { label?: string }) => string;
  component: LayeredComponentFn<L>;
  withUtils: <U extends StyleUtils>(utils: U) => StylesWithUtilsApiLayered<U, L>;
};

/**
 * Create a styles API with its own class naming config (scope, mode, prefix).
 * Use one instance per package or micro-frontend so hashed names stay isolated without global mutation.
 * Pass **`scopeId`** (or `fileScopeId(import.meta)` per module) so duplicate logical namespaces across
 * files do not collide; in development, registering the same name twice under one scope throws.
 *
 * Pass **`layers`** to enable CSS cascade layers: a tuple (or `{ order, prependFrameworkLayers? }`)
 * defines a single `@layer a, b, c;` preamble, and every `class` / `hashClass` / `component` call
 * must pass `{ layer: … }` with a name from that stack.
 *
 * Pass **`utils`** to register shorthand expanders on this instance (same behavior as
 * `styles.withUtils(utils)` on the default export, without a second parallel API object).
 */
export function createStyles<const L extends readonly string[], U extends StyleUtils>(
  options: Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & {
    layers: L;
    tokenLayer?: L[number];
    utils: U;
  },
): StylesWithUtilsApiLayered<U, L[number]>;

export function createStyles<U extends StyleUtils>(
  options: Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & {
    layers: CascadeLayersObjectInput;
    tokenLayer?: string;
    utils: U;
  },
): StylesWithUtilsApiLayered<U, string>;

export function createStyles<U extends StyleUtils>(
  options: Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & { utils: U },
): StylesWithUtilsApi<U>;

export function createStyles<const L extends readonly string[]>(
  options: Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & {
    layers: L;
    tokenLayer?: L[number];
  },
): StylesApiWithLayers<L[number]>;

export function createStyles(
  options: Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & {
    layers: CascadeLayersObjectInput;
    tokenLayer?: string;
  },
): StylesApiWithLayers<string>;

export function createStyles(options?: CreateStylesInput): StylesApi;

export function createStyles(
  options?: CreateStylesInput,
):
  | StylesApi
  | StylesApiWithLayers<string>
  | StylesWithUtilsApi<StyleUtils>
  | StylesWithUtilsApiLayered<StyleUtils, string> {
  const partial = (options ?? {}) as CreateStylesInput;
  const { layers, tokenLayer: tokenLayerHint, utils, ...namingPartial } = partial;

  if (process.env.NODE_ENV !== 'production' && tokenLayerHint !== undefined && !layers) {
    console.warn(
      '[typestyles] `tokenLayer` on `createStyles` is ignored without `layers`. Use `createTokens` or `createTypeStyles` to emit token CSS into a layer.',
    );
  }

  const cascadeLayers = layers ? resolveCascadeLayers(layers, namingPartial.scopeId) : undefined;
  const classNaming = mergeClassNaming({ ...namingPartial, cascadeLayers });

  if (utils !== undefined) {
    if (classNaming.cascadeLayers) {
      return createStylesWithUtilsLayered(utils, classNaming) as StylesWithUtilsApiLayered<
        StyleUtils,
        string
      >;
    }
    return createStylesWithUtils(utils, classNaming) as StylesWithUtilsApi<StyleUtils>;
  }

  return buildStylesRuntimeApi(classNaming) as StylesApi | StylesApiWithLayers<string>;
}

function buildStylesRuntimeApi(
  classNaming: ClassNamingConfig,
): StylesApi | StylesApiWithLayers<string> {
  const layered = Boolean(classNaming.cascadeLayers);

  const componentImpl = (
    namespace: string,
    config: Record<string, unknown> | ((ctx: ComponentConfigContext) => Record<string, unknown>),
    options?: LayerOption<string>,
  ) => createComponent(classNaming, namespace, config, options?.layer);

  const containerRef = (label: string): ContainerNameRef =>
    createContainerRef(label, {
      scopeId: classNaming.scopeId,
      prefix: classNaming.prefix,
    });

  const property = createStylesPropertyFn(classNaming);

  if (layered) {
    return {
      classNaming,
      container: containerQuery,
      containerRef,
      atRuleBlock: atRuleBlockFn,
      has: hasNested,
      is: isNested,
      where: whereNested,
      property,
      class: (name: string, properties: CSSProperties, options: LayerOption<string>) => {
        const layer = options.layer;
        return createClass(classNaming, name, properties, layer);
      },
      hashClass: (properties: CSSProperties, options: LayerOption<string> & { label?: string }) => {
        const { layer, label } = options;
        return createHashClass(classNaming, properties, label, layer);
      },
      component: componentImpl as unknown as LayeredComponentFn<string>,
      withUtils: (utils) => createStylesWithUtilsLayered(utils, classNaming),
      compose,
      // `as` (not `satisfies`): checking `typeof container` overloads with conditional literal returns hits TS2589.
    } as StylesApiWithLayers<string>;
  }

  return {
    classNaming,
    container: containerQuery,
    containerRef,
    atRuleBlock: atRuleBlockFn,
    has: hasNested,
    is: isNested,
    where: whereNested,
    property,
    class: (name: string, properties: CSSProperties) => createClass(classNaming, name, properties),
    hashClass: (properties: CSSProperties, label?: string) =>
      createHashClass(classNaming, properties, label),
    component: ((namespace: string, config: unknown) =>
      createComponent(
        classNaming,
        namespace,
        config as
          | Record<string, unknown>
          | ((ctx: ComponentConfigContext) => Record<string, unknown>),
      )) as StylesApi['component'],
    withUtils: (utils) => createStylesWithUtils(utils, classNaming),
    compose,
    // `as` (not `satisfies`): checking `typeof container` overloads with conditional literal returns hits TS2589.
  } as StylesApi;
}

export type StylesWithUtilsApi<U extends StyleUtils> = {
  readonly container: typeof containerQuery;
  readonly containerRef: (label: string) => ContainerNameRef;
  readonly atRuleBlock: typeof atRuleBlockFn;
  readonly has: typeof hasNested;
  readonly is: typeof isNested;
  readonly where: typeof whereNested;
  class: (name: string, properties: CSSPropertiesWithUtils<U>) => string;
  hashClass: (properties: CSSPropertiesWithUtils<U>, label?: string) => string;
  component: {
    <const V extends VariantDefinitions>(
      namespace: string,
      config: ComponentConfigInput<V>,
    ): ComponentReturn<V>;
    <const K extends string>(
      namespace: string,
      config: FlatComponentConfigInput<K>,
    ): FlatComponentReturn<K>;
    <const Slots extends readonly string[], V extends SlotVariantDefinitions<Slots[number]>>(
      namespace: string,
      config: SlotComponentConfigInput<Slots, V>,
    ): SlotComponentFunction<Slots, V>;
    <const Slots extends readonly string[]>(
      namespace: string,
      config: MultiSlotConfigInput<Slots>,
    ): MultiSlotReturn<Slots>;
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
  const containerRef = (label: string): ContainerNameRef =>
    createContainerRef(label, {
      scopeId: classNaming.scopeId,
      prefix: classNaming.prefix,
    });

  const apply = (properties: CSSPropertiesWithUtils<U>): CSSProperties =>
    expandStyleWithUtils(properties, utils);

  const transformComponentConfigWithUtils = makeTransformComponentConfigWithUtils(apply);

  function component(
    namespace: string,
    config: Record<string, unknown> | ((ctx: ComponentConfigContext) => Record<string, unknown>),
  ): unknown {
    if (typeof config === 'function') {
      return createComponent(classNaming, namespace, (ctx) =>
        transformComponentConfigWithUtils(config(ctx) as Record<string, unknown>),
      );
    }
    return createComponent(
      classNaming,
      namespace,
      transformComponentConfigWithUtils(config) as ComponentConfig<VariantDefinitions>,
    );
  }

  return {
    container: containerQuery,
    containerRef,
    atRuleBlock: atRuleBlockFn,
    has: hasNested,
    is: isNested,
    where: whereNested,
    class: (name, properties) => createClass(classNaming, name, apply(properties)),
    hashClass: (properties, label) => createHashClass(classNaming, apply(properties), label),
    component: component as StylesWithUtilsApi<U>['component'],
    compose,
  };
}

function createStylesWithUtilsLayered<U extends StyleUtils>(
  utils: U,
  classNaming: ClassNamingConfig,
): StylesWithUtilsApiLayered<U, string> {
  const containerRef = (label: string): ContainerNameRef =>
    createContainerRef(label, {
      scopeId: classNaming.scopeId,
      prefix: classNaming.prefix,
    });

  const apply = (properties: CSSPropertiesWithUtils<U>): CSSProperties =>
    expandStyleWithUtils(properties, utils);

  const transformComponentConfigWithUtils = makeTransformComponentConfigWithUtils(apply);

  function component(
    namespace: string,
    config: Record<string, unknown> | ((ctx: ComponentConfigContext) => Record<string, unknown>),
    options?: LayerOption<string>,
  ): unknown {
    const layer = options?.layer;
    if (typeof config === 'function') {
      return createComponent(
        classNaming,
        namespace,
        (ctx) => transformComponentConfigWithUtils(config(ctx) as Record<string, unknown>),
        layer,
      );
    }
    return createComponent(
      classNaming,
      namespace,
      transformComponentConfigWithUtils(config) as ComponentConfig<VariantDefinitions>,
      layer,
    );
  }

  return {
    container: containerQuery,
    containerRef,
    atRuleBlock: atRuleBlockFn,
    has: hasNested,
    is: isNested,
    where: whereNested,
    class: (name: string, properties: CSSPropertiesWithUtils<U>, options: LayerOption<string>) =>
      createClass(classNaming, name, apply(properties), options.layer),
    hashClass: (
      properties: CSSPropertiesWithUtils<U>,
      options: LayerOption<string> & { label?: string },
    ) => createHashClass(classNaming, apply(properties), options.label, options.layer),
    component: component as unknown as LayeredComponentFnWithUtils<string>,
    compose,
  };
}

function makeTransformComponentConfigWithUtils<U extends StyleUtils>(
  apply: (properties: CSSPropertiesWithUtils<U>) => CSSProperties,
): (raw: Record<string, unknown>) => Record<string, unknown> {
  return function transformComponentConfigWithUtils(
    raw: Record<string, unknown>,
  ): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(raw)) {
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
        transformed[key] = apply(value as CSSPropertiesWithUtils<U>);
      } else {
        transformed[key] = value;
      }
    }

    return transformed;
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
