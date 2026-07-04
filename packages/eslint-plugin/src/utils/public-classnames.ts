import type { TSESTree } from '@typescript-eslint/utils';

/**
 * Static mirror of the class names TypeStyles emits in `semantic` naming mode
 * (see `class-naming.ts` / `component.ts` in the core package):
 *
 * - `styles.class('card', …)` → `card`
 * - `styles.component('button', { base, variants })` → `button-base`, `button-{dim}-{opt}`,
 *   `button-compound-{i}`
 * - flat configs → `button-{key}` (including `button-base`)
 * - slot configs → `button-{slot}`, `button-{slot}-{dim}-{opt}`, `button-{slot}-compound-{i}`
 *
 * Names are computed for the default scope (no `scopeId` prefix) — snapshots
 * should list the same unprefixed logical names.
 */

const RESERVED_KEYS = new Set(['base', 'variants', 'compoundVariants', 'defaultVariants', 'slots']);

export interface EmittedClassNamesResult {
  /** Emitted semantic class names for this call (default-scope, unprefixed). */
  classNames: string[];
  /** True when the config could not be statically analyzed (dynamic keys, spreads, non-literal config). */
  unanalyzable: boolean;
}

function staticKeyName(prop: TSESTree.ObjectExpression['properties'][number]): string | null {
  if (prop.type !== 'Property' || prop.computed) return null;
  if (prop.key.type === 'Identifier') return prop.key.name;
  if (prop.key.type === 'Literal' && typeof prop.key.value === 'string') return prop.key.value;
  return null;
}

/** Static `key → value` map for an object literal; `null` when spreads or computed keys hide entries. */
function staticEntries(obj: TSESTree.ObjectExpression): Map<string, TSESTree.Node> | null {
  const entries = new Map<string, TSESTree.Node>();
  for (const prop of obj.properties) {
    const key = staticKeyName(prop);
    if (key == null) return null;
    entries.set(key, (prop as TSESTree.Property).value);
  }
  return entries;
}

/**
 * Resolve a `styles.component` config argument to an object literal.
 * Handles a plain object and the function-config form `(c) => ({ … })`.
 */
export function resolveConfigObject(
  arg: TSESTree.CallExpressionArgument | undefined,
): TSESTree.ObjectExpression | null {
  if (!arg || arg.type === 'SpreadElement') return null;
  if (arg.type === 'ObjectExpression') return arg;
  if (arg.type === 'ArrowFunctionExpression' && arg.body.type === 'ObjectExpression') {
    return arg.body;
  }
  return null;
}

function slotNames(node: TSESTree.Node | undefined): string[] | null {
  if (!node || node.type !== 'ArrayExpression') return null;
  const slots: string[] = [];
  for (const el of node.elements) {
    if (el?.type === 'Literal' && typeof el.value === 'string') {
      slots.push(el.value);
    } else {
      return null;
    }
  }
  return slots;
}

/** Compute the class names a `styles.class(name, …)` call emits in semantic mode. */
export function classNamesForClassCall(name: string): EmittedClassNamesResult {
  return { classNames: [name], unanalyzable: false };
}

/** Compute the class names a `styles.component(namespace, config)` call emits in semantic mode. */
export function classNamesForComponentCall(
  namespace: string,
  configArg: TSESTree.CallExpressionArgument | undefined,
): EmittedClassNamesResult {
  const unanalyzable: EmittedClassNamesResult = { classNames: [], unanalyzable: true };

  const config = resolveConfigObject(configArg);
  if (!config) return unanalyzable;

  const entries = staticEntries(config);
  if (!entries) return unanalyzable;

  const segments: string[] = [];
  const dimensioned =
    entries.has('variants') || entries.has('compoundVariants') || entries.has('defaultVariants');
  const slots = entries.has('slots') ? slotNames(entries.get('slots')) : undefined;
  if (entries.has('slots') && slots == null) return unanalyzable;

  if (slots && !dimensioned) {
    // Multi-slot: one class per slot that has a style object.
    for (const slot of slots) {
      if (entries.has(slot)) segments.push(slot);
    }
  } else if (slots && dimensioned) {
    // Slot component: base is Record<slot, props>; variant options are Record<slot, props>.
    const base = entries.get('base');
    if (base) {
      if (base.type !== 'ObjectExpression') return unanalyzable;
      const baseEntries = staticEntries(base);
      if (!baseEntries) return unanalyzable;
      segments.push(...baseEntries.keys());
    }
    const variantSegments = slotVariantSegments(entries.get('variants'));
    if (variantSegments == null) return unanalyzable;
    segments.push(...variantSegments);
    const compoundSegments = slotCompoundSegments(entries.get('compoundVariants'));
    if (compoundSegments == null) return unanalyzable;
    segments.push(...compoundSegments);
  } else if (dimensioned) {
    if (entries.has('base')) segments.push('base');
    const variantSegments = dimensionedVariantSegments(entries.get('variants'));
    if (variantSegments == null) return unanalyzable;
    segments.push(...variantSegments);
    const compound = entries.get('compoundVariants');
    if (compound) {
      if (compound.type !== 'ArrayExpression') return unanalyzable;
      compound.elements.forEach((_, index) => segments.push(`compound-${index}`));
    }
  } else {
    // Flat config: every non-reserved key (plus `base`) emits a class.
    for (const key of entries.keys()) {
      if (RESERVED_KEYS.has(key) && key !== 'base') continue;
      segments.push(key);
    }
  }

  return {
    classNames: segments.map((segment) => `${namespace}-${segment}`),
    unanalyzable: false,
  };
}

function dimensionedVariantSegments(variants: TSESTree.Node | undefined): string[] | null {
  if (!variants) return [];
  if (variants.type !== 'ObjectExpression') return null;
  const dims = staticEntries(variants);
  if (!dims) return null;

  const segments: string[] = [];
  for (const [dimension, options] of dims) {
    if (options.type !== 'ObjectExpression') return null;
    const optionEntries = staticEntries(options);
    if (!optionEntries) return null;
    for (const option of optionEntries.keys()) {
      segments.push(`${dimension}-${option}`);
    }
  }
  return segments;
}

function slotVariantSegments(variants: TSESTree.Node | undefined): string[] | null {
  if (!variants) return [];
  if (variants.type !== 'ObjectExpression') return null;
  const dims = staticEntries(variants);
  if (!dims) return null;

  const segments: string[] = [];
  for (const [dimension, options] of dims) {
    if (options.type !== 'ObjectExpression') return null;
    const optionEntries = staticEntries(options);
    if (!optionEntries) return null;
    for (const [option, slotStyles] of optionEntries) {
      if (slotStyles.type !== 'ObjectExpression') return null;
      const slotEntries = staticEntries(slotStyles);
      if (!slotEntries) return null;
      for (const slot of slotEntries.keys()) {
        segments.push(`${slot}-${dimension}-${option}`);
      }
    }
  }
  return segments;
}

function slotCompoundSegments(compound: TSESTree.Node | undefined): string[] | null {
  if (!compound) return [];
  if (compound.type !== 'ArrayExpression') return null;

  const segments: string[] = [];
  for (const [index, element] of compound.elements.entries()) {
    if (!element || element.type !== 'ObjectExpression') return null;
    const entries = staticEntries(element);
    if (!entries) return null;
    const style = entries.get('style');
    if (!style || style.type !== 'ObjectExpression') return null;
    const styleEntries = staticEntries(style);
    if (!styleEntries) return null;
    for (const slot of styleEntries.keys()) {
      segments.push(`${slot}-compound-${index}`);
    }
  }
  return segments;
}
