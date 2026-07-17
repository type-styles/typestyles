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
import { joinSelectorAlternatives } from './compound-selector';
import type {
  ComponentAttrsReturn,
  ComponentReturn,
  CompoundSelectionValue,
  CSSProperties,
  FlatComponentReturn,
  MultiSlotReturn,
  SlotAttrsReturn,
  SlotComponentFunction,
  SlotVariantDefinitions,
  VariantDefinitions,
  VariantOptionKey,
  VariantOptionStyle,
} from './types';

const SUPPORTED_OVERRIDE_MODES = new Set(['semantic', 'bem', 'template', 'attribute']);

export type OverrideOptions<L extends string = string> = {
  /**
   * Selector prefix inserted before the component selector, e.g. `.theme-acme`.
   * Emits `.theme-acme .button--intent-primary { … }` (descendant combinator).
   * This is **not** CSS `@scope` — see `styles.scope()` for proximity.
   */
  selectorPrefix?: string;
  /** Cascade layer name; must be on the instance's `layers` stack when set. */
  layer?: L;
};

export type OverrideConfig<V extends VariantDefinitions> = {
  base?: VariantOptionStyle;
  variants?: { [K in keyof V]?: { [O in keyof V[K]]?: VariantOptionStyle } };
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
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
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: Partial<Record<Slots[number], VariantOptionStyle>>;
  }>;
};

export type MultiSlotOverrideConfig<Slots extends readonly string[]> = {
  base?: Partial<Record<Slots[number], VariantOptionStyle>>;
  /** Multi-slot recipes have no variants — forbidden so excess keys type-error. */
  variants?: never;
  compoundVariants?: never;
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
  options: OverrideOptions<string> | undefined,
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
  options: OverrideOptions<string> | undefined,
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

/**
 * Validate every compound selection against `__tsMeta` before emission.
 * Returns false (and warns) when any dimension/option is unknown so we never
 * emit a silently narrower selector (e.g. intent-only instead of intent+size).
 */
function validateCompoundSelections(
  variants: VariantSelectorMap,
  selections: Record<string, unknown>,
): boolean {
  let ok = true;
  for (const [dimension, expected] of Object.entries(selections)) {
    const optionMap = variants[dimension];
    if (!optionMap) {
      warnDev(`Unknown variant dimension "${dimension}" in styles.override() compoundVariants.`);
      ok = false;
      continue;
    }
    const values = Array.isArray(expected) ? expected : [expected];
    for (const value of values) {
      const key = normalizeOptionKey(value);
      if (key == null || optionMap[key] == null) {
        warnDev(
          `Unknown variant option "${dimension}.${String(value)}" in styles.override() compoundVariants.`,
        );
        ok = false;
      }
    }
  }
  return ok;
}

function classCompoundSelector(
  variants: VariantSelectorMap,
  selections: Record<string, unknown>,
): string {
  const entries = Object.entries(selections);
  // Empty compound → no selector (do not emit a bare/base rule).
  if (entries.length === 0) return '';
  return entries
    .map(([dimension, expected]) => {
      const optionMap = variants[dimension];
      if (!optionMap) return '';
      return joinSelectorAlternatives(classFragmentsForDimension(optionMap, expected));
    })
    .join('');
}

function attributeCompoundSelector(
  baseClass: string,
  variants: VariantSelectorMap,
  selections: Record<string, unknown>,
): string {
  if (!baseClass) return '';
  const entries = Object.entries(selections);
  // Empty compound must not collapse to `.base` (unlike class mode which yields '').
  if (entries.length === 0) return '';
  const suffix = entries
    .map(([dimension, expected]) => {
      const optionMap = variants[dimension];
      if (!optionMap) return '';
      return joinSelectorAlternatives(attributeFragmentsForDimension(optionMap, expected));
    })
    .join('');
  if (!suffix) return '';
  return `.${baseClass}${suffix}`;
}

function isAttributeMode(meta: ComponentMeta): boolean {
  return meta.namingMode === 'attribute';
}

function warnDev(message: string): void {
  if (process.env.NODE_ENV === 'production') return;
  console.warn(`[typestyles] ${message}`);
}

/**
 * Resolve the cascade layer for an override emission.
 * When the instance has layers and callers omit `layer`, default to `"overrides"`
 * if that name exists — avoiding unlayered CSS that beats the entire stack
 * (including `utilities`). Custom layer stacks without `"overrides"` must pass
 * `{ layer }` explicitly.
 */
function resolveOverrideLayer(
  classNaming: ClassNamingConfig,
  options: OverrideOptions<string> | undefined,
): string | undefined {
  if (options?.layer != null && options.layer !== '') {
    return options.layer;
  }
  const stack = classNaming.cascadeLayers;
  if (!stack) return undefined;
  if (stack.ownOrder.includes('overrides')) {
    return 'overrides';
  }
  throw new Error(
    '[typestyles] `styles.override(…)` on a layered styles instance requires `{ layer: … }` ' +
      '(or include an `"overrides"` layer in `createStyles({ layers })` to default). ' +
      `Expected one of: ${stack.ownOrder.map((l) => `"${l}"`).join(', ')}.`,
  );
}

function resolveVariantSelector(
  meta: DimensionedComponentMeta,
  dimension: string,
  option: string,
): string | null {
  const frag = meta.variants[dimension]?.[option];
  if (frag == null) return null;
  if (isAttributeMode(meta)) {
    if (!meta.base) return null;
    return `.${meta.base}${frag}`;
  }
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
  options: OverrideOptions<string> | undefined,
): void {
  if (config.base) {
    if (!meta.base) {
      warnDev(
        'styles.override() `base` requires a component with a base class (meta.base is empty).',
      );
    } else {
      emitStyledSelector(classNaming, `.${meta.base}`, config.base, options);
    }
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
      const selections = cv.variants as Record<string, unknown>;
      if (!validateCompoundSelections(meta.variants, selections)) continue;
      const selector = isAttributeMode(meta)
        ? attributeCompoundSelector(meta.base, meta.variants, selections)
        : classCompoundSelector(meta.variants, selections);
      if (!selector) continue;
      emitStyledSelector(classNaming, selector, cv.style, options);
    }
  }
}

function emitFlatOverride(
  classNaming: ClassNamingConfig,
  meta: FlatComponentMeta,
  config: FlatOverrideConfig<string>,
  options: OverrideOptions<string> | undefined,
): void {
  if (config.base) {
    if (!meta.base) {
      warnDev(
        'styles.override() `base` requires a component with a base class (meta.base is empty).',
      );
    } else {
      emitStyledSelector(classNaming, `.${meta.base}`, config.base, options);
    }
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
  options: OverrideOptions<string> | undefined,
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
  options: OverrideOptions<string> | undefined,
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
      const selections = cv.variants as Record<string, unknown>;
      for (const [slot, style] of Object.entries(cv.style ?? {})) {
        if (!style) continue;
        const slotVariants = meta.variants[slot];
        const baseClass = meta.base[slot];
        if (!slotVariants || !baseClass) {
          warnDev(`Unknown slot "${slot}" in styles.override() compoundVariants.`);
          continue;
        }
        if (!validateCompoundSelections(slotVariants, selections)) continue;
        const selector = isAttributeMode(meta)
          ? attributeCompoundSelector(baseClass, slotVariants, selections)
          : classCompoundSelector(slotVariants, selections);
        if (!selector) continue;
        emitStyledSelector(classNaming, selector, style, options);
      }
    }
  }
}

/**
 * Emit recipe-shaped component overrides from `__tsMeta`.
 * Call on the same `styles` instance that created the component — cross-instance
 * calls (component from `stylesA`, `stylesB.override(…)`) are unsupported.
 */
export function createOverride(
  classNaming: ClassNamingConfig,
  component: object,
  config: AnyOverrideConfig,
  options?: OverrideOptions<string>,
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

  const layer = resolveOverrideLayer(classNaming, options);
  const resolvedOptions: OverrideOptions<string> | undefined =
    layer != null ? { ...options, layer } : options;

  switch (meta.kind) {
    case 'dimensioned':
      emitDimensionedOverride(
        classNaming,
        meta,
        config as OverrideConfig<VariantDefinitions>,
        resolvedOptions,
      );
      break;
    case 'flat':
      emitFlatOverride(classNaming, meta, config as FlatOverrideConfig<string>, resolvedOptions);
      break;
    case 'multi-slot':
      emitMultiSlotOverride(
        classNaming,
        meta,
        config as MultiSlotOverrideConfig<readonly string[]>,
        resolvedOptions,
      );
      break;
    case 'slot':
      emitSlotOverride(
        classNaming,
        meta,
        config as SlotOverrideConfig<readonly string[], SlotVariantDefinitions<string>>,
        resolvedOptions,
      );
      break;
  }
}

/** Overload surface mirrored on `styles.override`. */
export type OverrideFn<L extends string = string> = {
  <const V extends VariantDefinitions>(
    component: ComponentReturn<V> | ComponentAttrsReturn<V>,
    config: OverrideConfig<NoInfer<V>>,
    options?: OverrideOptions<L>,
  ): void;
  <const K extends string>(
    component: FlatComponentReturn<K>,
    config: FlatOverrideConfig<NoInfer<K>>,
    options?: OverrideOptions<L>,
  ): void;
  /** Multi-slot before slot-with-variants so branded multi returns do not widen `V`. */
  <const Slots extends readonly string[]>(
    component: MultiSlotReturn<Slots>,
    config: MultiSlotOverrideConfig<Slots>,
    options?: OverrideOptions<L>,
  ): void;
  <const Slots extends readonly string[], V extends SlotVariantDefinitions<Slots[number]>>(
    component: (SlotComponentFunction<Slots, V> | SlotAttrsReturn<Slots, V>) & {
      /** Reject branded multi-slot returns so invalid configs do not fall through here. */
      __tsMultiSlot?: never;
    },
    config: SlotOverrideConfig<NoInfer<Slots>, NoInfer<V>>,
    options?: OverrideOptions<L>,
  ): void;
};
