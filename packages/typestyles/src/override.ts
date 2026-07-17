import type { ClassNamingConfig } from './class-naming';
import {
  getComponentMeta,
  type ComponentMeta,
  type DimensionedComponentMeta,
  type FlatComponentMeta,
  type MultiSlotComponentMeta,
  type SlotComponentMeta,
  type VariantSelectorMap,
} from './component-meta';
import { serializeStyle } from './css';
import { applyLayerToRules, assertOwnLayer } from './layers';
import { insertRules } from './sheet';
import type {
  ComponentAttrsReturn,
  ComponentReturn,
  CSSProperties,
  FlatComponentReturn,
  MultiSlotReturn,
  SlotAttrsReturn,
  SlotComponentFunction,
  SlotVariantDefinitions,
  VariantDefinitions,
  VariantOptionStyle,
} from './types';

const SUPPORTED_OVERRIDE_MODES = new Set(['semantic', 'bem', 'template', 'attribute']);

export type OverrideOptions = {
  /**
   * Selector prefix inserted before the component selector, e.g. `.theme-acme`.
   * Emits `.theme-acme .button--intent-primary { … }` (descendant combinator).
   * This is **not** CSS `@scope` — see `styles.scope()` for proximity.
   */
  selectorPrefix?: string;
  /** Cascade layer name; must be on the instance's `layers` stack when set. */
  layer?: string;
};

type CompoundSelectionValue = string | boolean | readonly (string | boolean)[];

export type OverrideConfig<V extends VariantDefinitions> = {
  base?: VariantOptionStyle;
  variants?: { [K in keyof V]?: { [O in keyof V[K]]?: VariantOptionStyle } };
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue };
    style: VariantOptionStyle;
  }>;
  /** Reserved for phase 2 — typed component vars. */
  vars?: never;
};

export type SlotOverrideConfig<
  Slots extends readonly string[],
  V extends SlotVariantDefinitions<Slots[number]>,
> = {
  base?: Partial<Record<Slots[number], VariantOptionStyle>>;
  variants?: {
    [K in keyof V]?: {
      [O in keyof V[K]]?: Partial<Record<Slots[number], VariantOptionStyle>>;
    };
  };
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue };
    style: Partial<Record<Slots[number], VariantOptionStyle>>;
  }>;
};

export type MultiSlotOverrideConfig<Slots extends readonly string[]> = {
  base?: Partial<Record<Slots[number], VariantOptionStyle>>;
};

export type FlatOverrideConfig<K extends string> = {
  base?: VariantOptionStyle;
} & Partial<Record<Exclude<K, 'base'>, VariantOptionStyle>>;

type AnyOverrideConfig =
  | OverrideConfig<VariantDefinitions>
  | SlotOverrideConfig<readonly string[], SlotVariantDefinitions<string>>
  | MultiSlotOverrideConfig<readonly string[]>
  | FlatOverrideConfig<string>
  | Record<string, unknown>;

function normalizeOptionKey(value: unknown): string | null {
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'string') return value;
  return null;
}

function prefixSelector(selector: string, selectorPrefix?: string): string {
  if (!selectorPrefix) return selector;
  return `${selectorPrefix} ${selector}`;
}

function overrideRuleKey(
  options: OverrideOptions | undefined,
  selector: string,
  ruleKey: string,
): string {
  const layerSegment = options?.layer ?? '';
  const prefixSegment = options?.selectorPrefix ?? '';
  return `override:${prefixSegment}:${layerSegment}:${selector}:${ruleKey}`;
}

function emitStyledSelector(
  classNaming: ClassNamingConfig,
  selector: string,
  styles: VariantOptionStyle,
  options: OverrideOptions | undefined,
): void {
  const prefixed = prefixSelector(selector, options?.selectorPrefix);
  const serialized = serializeStyle(prefixed, styles as CSSProperties, {
    breakpoints: classNaming.breakpoints,
  });
  const keyed = serialized.map((rule) => ({
    key: overrideRuleKey(options, prefixed, rule.key),
    css: rule.css,
  }));

  if (options?.layer != null && options.layer !== '') {
    const stack = classNaming.cascadeLayers;
    if (!stack) {
      throw new Error(
        '[typestyles] `layer` in `styles.override(…)` requires `createStyles({ layers: … })` on this styles instance.',
      );
    }
    assertOwnLayer(stack, options.layer, 'styles.override(…)');
    insertRules(applyLayerToRules(keyed, options.layer, stack));
    return;
  }

  insertRules(keyed);
}

function classFragmentsForDimension(
  optionMap: { [option: string]: string },
  expected: unknown,
): string[] {
  const values = Array.isArray(expected) ? expected : [expected];
  return values
    .map(normalizeOptionKey)
    .filter((selected): selected is string => selected != null && optionMap[selected] != null)
    .map((selected) => {
      const frag = optionMap[selected];
      return frag != null ? `.${frag}` : '';
    })
    .filter(Boolean);
}

function attributeFragmentsForDimension(
  optionMap: { [option: string]: string },
  expected: unknown,
): string[] {
  const values = Array.isArray(expected) ? expected : [expected];
  return values
    .map(normalizeOptionKey)
    .filter((selected): selected is string => selected != null && optionMap[selected] != null)
    .map((selected) => optionMap[selected] ?? '')
    .filter(Boolean);
}

function joinCompoundFragments(fragments: string[]): string {
  if (fragments.length === 0) return '';
  const first = fragments[0];
  if (fragments.length === 1 && first != null) return first;
  return `:is(${fragments.join(', ')})`;
}

function classCompoundSelector(
  variants: VariantSelectorMap,
  selections: Record<string, unknown>,
): string {
  return Object.entries(selections)
    .map(([dimension, expected]) => {
      const optionMap = variants[dimension];
      if (!optionMap) return '';
      return joinCompoundFragments(classFragmentsForDimension(optionMap, expected));
    })
    .join('');
}

function attributeCompoundSelector(
  baseClass: string,
  variants: VariantSelectorMap,
  selections: Record<string, unknown>,
): string {
  const suffix = Object.entries(selections)
    .map(([dimension, expected]) => {
      const optionMap = variants[dimension];
      if (!optionMap) return '';
      return joinCompoundFragments(attributeFragmentsForDimension(optionMap, expected));
    })
    .join('');
  return `.${baseClass}${suffix}`;
}

function isAttributeMode(meta: ComponentMeta): boolean {
  return meta.namingMode === 'attribute';
}

function warnDev(message: string): void {
  if (process.env.NODE_ENV === 'production') return;
  console.warn(`[typestyles] ${message}`);
}

function resolveVariantSelector(
  meta: DimensionedComponentMeta,
  dimension: string,
  option: string,
): string | null {
  const frag = meta.variants[dimension]?.[option];
  if (frag == null) return null;
  if (isAttributeMode(meta)) return `.${meta.base}${frag}`;
  return `.${frag}`;
}

function resolveSlotVariantSelector(
  meta: SlotComponentMeta,
  slot: string,
  dimension: string,
  option: string,
): string | null {
  const frag = meta.variants[slot]?.[dimension]?.[option];
  if (frag == null) return null;
  const base = meta.base[slot];
  if (base == null) return null;
  if (isAttributeMode(meta)) return `.${base}${frag}`;
  return `.${frag}`;
}

function emitDimensionedOverride(
  classNaming: ClassNamingConfig,
  meta: DimensionedComponentMeta,
  config: OverrideConfig<VariantDefinitions>,
  options: OverrideOptions | undefined,
): void {
  if (config.base) {
    emitStyledSelector(classNaming, `.${meta.base}`, config.base, options);
  }

  if (config.variants) {
    for (const [dimension, optionsMap] of Object.entries(config.variants)) {
      if (!optionsMap) continue;
      if (!meta.variants[dimension]) {
        warnDev(`Unknown variant dimension "${dimension}" in styles.override().`);
        continue;
      }
      for (const [option, style] of Object.entries(optionsMap)) {
        if (!style) continue;
        if (meta.variants[dimension]?.[option] == null) {
          warnDev(`Unknown variant option "${dimension}.${option}" in styles.override().`);
          continue;
        }
        const selector = resolveVariantSelector(meta, dimension, option);
        if (selector) emitStyledSelector(classNaming, selector, style, options);
      }
    }
  }

  if (config.compoundVariants) {
    for (const cv of config.compoundVariants) {
      const selector = isAttributeMode(meta)
        ? attributeCompoundSelector(
            meta.base,
            meta.variants,
            cv.variants as Record<string, unknown>,
          )
        : classCompoundSelector(meta.variants, cv.variants as Record<string, unknown>);
      if (!selector) continue;
      emitStyledSelector(classNaming, selector, cv.style, options);
    }
  }
}

function emitFlatOverride(
  classNaming: ClassNamingConfig,
  meta: FlatComponentMeta,
  config: FlatOverrideConfig<string>,
  options: OverrideOptions | undefined,
): void {
  if (config.base) {
    emitStyledSelector(classNaming, `.${meta.base}`, config.base, options);
  }

  for (const [key, style] of Object.entries(config)) {
    if (key === 'base' || key === 'vars' || style == null || typeof style !== 'object') continue;
    if (!meta.variants[key]) {
      warnDev(`Unknown flat variant "${key}" in styles.override().`);
      continue;
    }
    emitStyledSelector(classNaming, `.${meta.variants[key]}`, style as VariantOptionStyle, options);
  }
}

function emitMultiSlotOverride(
  classNaming: ClassNamingConfig,
  meta: MultiSlotComponentMeta,
  config: MultiSlotOverrideConfig<readonly string[]>,
  options: OverrideOptions | undefined,
): void {
  if (!config.base) return;
  for (const [slot, style] of Object.entries(config.base)) {
    if (!style) continue;
    if (!meta.base[slot] && !meta.slots.includes(slot)) {
      warnDev(`Unknown slot "${slot}" in styles.override().`);
      continue;
    }
    const baseClass = meta.base[slot];
    if (!baseClass) {
      warnDev(`Unknown slot "${slot}" in styles.override().`);
      continue;
    }
    emitStyledSelector(classNaming, `.${baseClass}`, style, options);
  }
}

function emitSlotOverride(
  classNaming: ClassNamingConfig,
  meta: SlotComponentMeta,
  config: SlotOverrideConfig<readonly string[], SlotVariantDefinitions<string>>,
  options: OverrideOptions | undefined,
): void {
  if (config.base) {
    for (const [slot, style] of Object.entries(config.base)) {
      if (!style) continue;
      const baseClass = meta.base[slot];
      if (!baseClass) {
        warnDev(`Unknown slot "${slot}" in styles.override().`);
        continue;
      }
      emitStyledSelector(classNaming, `.${baseClass}`, style, options);
    }
  }

  if (config.variants) {
    for (const [dimension, optionsMap] of Object.entries(config.variants)) {
      if (!optionsMap) continue;
      for (const [option, slotStyles] of Object.entries(optionsMap)) {
        if (!slotStyles) continue;
        for (const [slot, style] of Object.entries(slotStyles)) {
          if (!style) continue;
          if (!meta.variants[slot]?.[dimension]?.[option]) {
            warnDev(`Unknown slot variant "${slot}.${dimension}.${option}" in styles.override().`);
            continue;
          }
          const selector = resolveSlotVariantSelector(meta, slot, dimension, option);
          if (selector) emitStyledSelector(classNaming, selector, style, options);
        }
      }
    }
  }

  if (config.compoundVariants) {
    for (const cv of config.compoundVariants) {
      for (const [slot, style] of Object.entries(cv.style ?? {})) {
        if (!style) continue;
        const slotVariants = meta.variants[slot];
        const baseClass = meta.base[slot];
        if (!slotVariants || !baseClass) {
          warnDev(`Unknown slot "${slot}" in styles.override() compoundVariants.`);
          continue;
        }
        const selector = isAttributeMode(meta)
          ? attributeCompoundSelector(
              baseClass,
              slotVariants,
              cv.variants as Record<string, unknown>,
            )
          : classCompoundSelector(slotVariants, cv.variants as Record<string, unknown>);
        if (!selector) continue;
        emitStyledSelector(classNaming, selector, style, options);
      }
    }
  }
}

/**
 * Emit recipe-shaped component overrides from `__tsMeta`.
 * Call on the same `styles` instance that created the component.
 */
export function createOverride(
  classNaming: ClassNamingConfig,
  component: object,
  config: AnyOverrideConfig,
  options?: OverrideOptions,
): void {
  const meta = getComponentMeta(component);
  if (!meta) {
    warnDev('styles.override() requires a styles.component() return with metadata.');
    return;
  }

  if (!SUPPORTED_OVERRIDE_MODES.has(meta.namingMode)) {
    warnDev(
      `styles.override() does not support naming mode "${meta.namingMode}" in v1 (supported: semantic, bem, template, attribute).`,
    );
    return;
  }

  if (classNaming.cascadeLayers && (options?.layer == null || options.layer === '')) {
    warnDev(
      'styles.override() on a layered styles instance should pass `{ layer: … }` (e.g. "overrides") so overrides beat recipe CSS.',
    );
  }

  switch (meta.kind) {
    case 'dimensioned':
      emitDimensionedOverride(
        classNaming,
        meta,
        config as OverrideConfig<VariantDefinitions>,
        options,
      );
      break;
    case 'flat':
      emitFlatOverride(classNaming, meta, config as FlatOverrideConfig<string>, options);
      break;
    case 'multi-slot':
      emitMultiSlotOverride(
        classNaming,
        meta,
        config as MultiSlotOverrideConfig<readonly string[]>,
        options,
      );
      break;
    case 'slot':
      emitSlotOverride(
        classNaming,
        meta,
        config as SlotOverrideConfig<readonly string[], SlotVariantDefinitions<string>>,
        options,
      );
      break;
  }
}

/** Overload surface mirrored on `styles.override`. */
export type OverrideFn = {
  <const V extends VariantDefinitions>(
    component: ComponentReturn<V> | ComponentAttrsReturn<V>,
    config: OverrideConfig<V>,
    options?: OverrideOptions,
  ): void;
  <const K extends string>(
    component: FlatComponentReturn<K>,
    config: FlatOverrideConfig<K>,
    options?: OverrideOptions,
  ): void;
  <const Slots extends readonly string[], V extends SlotVariantDefinitions<Slots[number]>>(
    component: SlotComponentFunction<Slots, V> | SlotAttrsReturn<Slots, V>,
    config: SlotOverrideConfig<Slots, V>,
    options?: OverrideOptions,
  ): void;
  <const Slots extends readonly string[]>(
    component: MultiSlotReturn<Slots>,
    config: MultiSlotOverrideConfig<Slots>,
    options?: OverrideOptions,
  ): void;
};
