import type { ClassNamingMode } from './class-naming';

const COMPONENT_META = '__tsMeta';

export type VariantSelectorMap = {
  /** dimension → option → selector fragment */
  [dimension: string]: { [option: string]: string };
};

export type SlotVariantSelectorMap = {
  [slot: string]: VariantSelectorMap;
};

export type ComponentMetaBase = {
  namespace: string;
  /**
   * Naming mode of the creating `styles` instance. Emission branches on this
   * (class conjunction vs attribute conjunction).
   */
  namingMode: ClassNamingMode;
};

/** Class modes: full class name without dot. Attribute: attr fragment only. */
export type DimensionedComponentMeta = ComponentMetaBase & {
  kind: 'dimensioned';
  base: string;
  variants: VariantSelectorMap;
};

export type FlatComponentMeta = ComponentMetaBase & {
  kind: 'flat';
  base: string;
  /** Flat variant key → class name (no dimensions). */
  variants: Record<string, string>;
};

export type SlotComponentMeta = ComponentMetaBase & {
  kind: 'slot';
  slots: readonly string[];
  base: Record<string, string>;
  variants: SlotVariantSelectorMap;
};

export type MultiSlotComponentMeta = ComponentMetaBase & {
  kind: 'multi-slot';
  slots: readonly string[];
  base: Record<string, string>;
  /** Multi-slot recipes have no variants. */
  variants?: undefined;
};

export type ComponentMeta =
  | DimensionedComponentMeta
  | FlatComponentMeta
  | SlotComponentMeta
  | MultiSlotComponentMeta;

type MetaCarrier = object & {
  [COMPONENT_META]?: ComponentMeta;
};

/**
 * First class token from a possibly space-separated class list (atomic mode).
 * Override v1 skips unsupported modes, but meta still records a usable token.
 */
export function firstClassToken(classNames: string): string {
  const trimmed = classNames.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0] ?? '';
}

export function buildClassVariantSelectorMap(
  variants: Record<string, Record<string, unknown>>,
  classForOption: (dimension: string, option: string) => string,
): VariantSelectorMap {
  const map: VariantSelectorMap = {};
  for (const [dimension, options] of Object.entries(variants)) {
    const optionMap: { [option: string]: string } = {};
    for (const option of Object.keys(options)) {
      optionMap[option] = firstClassToken(classForOption(dimension, option));
    }
    map[dimension] = optionMap;
  }
  return map;
}

export function attachComponentMeta(target: object, meta: ComponentMeta): void {
  Object.defineProperty(target, COMPONENT_META, {
    value: meta,
    enumerable: false,
    writable: false,
    configurable: true,
  });
}

/**
 * Read the public component metadata blob attached by `styles.component()`.
 * Returns `undefined` when the value is not a TypeStyles component return.
 */
export function getComponentMeta(component: object): ComponentMeta | undefined {
  return (component as MetaCarrier)[COMPONENT_META];
}
