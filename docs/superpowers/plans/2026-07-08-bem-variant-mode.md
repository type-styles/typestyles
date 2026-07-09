# BEM Variant Mode + Attribute-Mode Relocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `mode: 'bem'` (BEM class naming, including multi-part components via `slots`) to `createStyles()`, and relocate the unreleased `variantStrategy: 'attribute'` feature (PR #130) from a per-component field into `mode: 'attribute'`, fixing a type/runtime mismatch in the process.

**Architecture:** `ClassNamingMode` grows two values, `'attribute'` and `'bem'`, each mutually exclusive with the other three (`semantic | hashed | compact | atomic`) and with each other, exactly like those three already are with one another. `variantStrategy`/`defaultVariantStrategy` are deleted outright (unreleased, no deprecation needed). `styles.component()`'s dispatch (in `component.ts`) branches on `classNaming.mode` instead of a per-call/per-instance field. BEM's dimensioned/slot component builders bypass the shared hash/semantic naming pipeline entirely — they compute literal `block--modifier`/`block__element` strings directly and call `serializeStyle()` (already exported from `css.ts`) to emit rules, since BEM is inherently "always readable," never hashed. `createStyles()`/`createTypeStyles()` gain new overloads keyed on the literal `mode: 'attribute'`, returning an `AttributeStylesApi` whose `component()` only accepts the dimensioned config shape (no `slots`, no flat) and returns `{ className, attrs, props }`. `mode: 'bem'` needs **no** new overloads — it returns plain strings from the existing `StylesApi` shape, same as `semantic`/`hashed`/`compact`/`atomic`.

**Tech Stack:** TypeScript (strict), Vitest, the existing `typestyles` monorepo package (`packages/typestyles`).

## Global Constraints

- This is an **unreleased** change (see `specs/attribute-driven-variants.md`'s revision note — `typestyles` is at `0.8.2` on the registry, PR #130's changeset is still unconsumed). Do not add deprecation shims, back-compat fields, or migration guides for `variantStrategy` — delete it outright.
- Follow `specs/attribute-driven-variants.md` and `specs/bem-variant-mode.md` exactly; they are the approved design. If an implementation detail isn't covered by either spec, prefer the option that keeps `mode: 'bem'`/`mode: 'attribute'` consistent with the other four `ClassNamingMode` values (e.g. `styles.class()` and flat `styles.component()` configs are naming-unaffected by `bem`/`attribute` — they behave like `semantic`).
- Every new dev-mode warning must be gated behind `process.env.NODE_ENV !== 'production'` (existing convention — see `devWarnUnknownVariantDimensions` in `component.ts`).
- Run `pnpm --filter typestyles typecheck`, `pnpm --filter typestyles test`, and `pnpm --filter typestyles lint` after every task; all three must pass before moving to the next task.
- Follow this repo's commit convention: `type: summary` (e.g. `feat: add bem variant mode`), body explaining the why, `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` trailer. Do not push or open a PR unless asked.

---

### Task 1: `class-naming.ts` — extend `ClassNamingMode`, remove `defaultVariantStrategy`, add BEM naming helpers

**Files:**

- Modify: `packages/typestyles/src/class-naming.ts`
- Test: `packages/typestyles/src/class-naming.test.ts`

**Interfaces:**

- Produces: `ClassNamingMode = 'semantic' | 'hashed' | 'compact' | 'atomic' | 'attribute' | 'bem'`; `buildBemBlockClassName(cfg, namespace): string`; `buildBemElementClassName(cfg, namespace, slot): string`; `buildBemModifierClassName(cfg, namespace, blockOrElementClassName, option): string`. These three are consumed by Tasks 4 and 5.

- [ ] **Step 1: Write failing tests for the naming helpers**

Add to `packages/typestyles/src/class-naming.test.ts` (open the file first to see its existing `describe` structure and match its import style — it already imports from `./class-naming`):

Add `mergeClassNaming` to the existing `import { fileScopeId } from './class-naming';` line (it becomes `import { fileScopeId, mergeClassNaming, buildBemBlockClassName, buildBemElementClassName, buildBemModifierClassName } from './class-naming';`), then add:

```ts
describe('BEM naming helpers', () => {
  it('buildBemBlockClassName returns the bare namespace (no scope)', () => {
    const cfg = mergeClassNaming({ mode: 'bem' });
    expect(buildBemBlockClassName(cfg, 'button')).toBe('button');
  });

  it('buildBemBlockClassName prefixes the sanitized scopeId when set', () => {
    const cfg = mergeClassNaming({ mode: 'bem', scopeId: 'My UI' });
    expect(buildBemBlockClassName(cfg, 'button')).toBe('my-ui-button');
  });

  it('buildBemElementClassName appends __slot to the block name', () => {
    const cfg = mergeClassNaming({ mode: 'bem' });
    expect(buildBemElementClassName(cfg, 'dialog', 'trigger')).toBe('dialog__trigger');
  });

  it('buildBemModifierClassName appends --option to a given block/element class name', () => {
    const cfg = mergeClassNaming({ mode: 'bem' });
    const block = buildBemBlockClassName(cfg, 'button');
    expect(buildBemModifierClassName(cfg, 'button', block, 'primary')).toBe('button--primary');
    const element = buildBemElementClassName(cfg, 'dialog', 'trigger');
    expect(buildBemModifierClassName(cfg, 'dialog', element, 'primary')).toBe(
      'dialog__trigger--primary',
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter typestyles test -- class-naming`
Expected: FAIL — `buildBemBlockClassName`/`buildBemElementClassName`/`buildBemModifierClassName` are not exported yet.

- [ ] **Step 3: Extend `ClassNamingMode`, remove `defaultVariantStrategy`, widen the readable-mode branches**

In `packages/typestyles/src/class-naming.ts`:

Replace:

```ts
export type ClassNamingMode = 'semantic' | 'hashed' | 'compact' | 'atomic';
```

with:

```ts
export type ClassNamingMode = 'semantic' | 'hashed' | 'compact' | 'atomic' | 'attribute' | 'bem';
```

Update the doc comment directly above it (currently documents `semantic`/`hashed`/`compact`/`atomic`) to also cover the two new values:

```ts
/**
 * How generated class names are formed for `styles.class`, `styles.component`,
 * and related APIs.
 *
 * - `semantic` — readable names like `button-base`, `button-intent-primary` (default).
 *   With `scopeId` set, names are prefixed with the sanitized scope: `my-ui-button-base`.
 * - `hashed` — stable hash from namespace, variant segment, and declarations, with a short namespace slug for debugging.
 * - `compact` — hash-only names (shortest) for whole style objects; same collision properties as `hashed` when `scopeId` differs.
 * - `atomic` — one class per CSS declaration; identical declarations dedupe across the codebase.
 * - `attribute` — dimensioned `styles.component()` variants compile to `&[data-{dimension}="{option}"]`
 *   selectors under one base class instead of discrete classes; the call returns
 *   `{ className, attrs, props }`. See `specs/attribute-driven-variants.md`. Not supported for
 *   `slots` or flat configs — `styles.class()` and flat configs behave like `semantic`.
 * - `bem` — dimensioned/slot `styles.component()` variants compile to BEM modifier classes
 *   (`block--modifier`, `block__element--modifier`); the base/root class drops the `-base` suffix.
 *   See `specs/bem-variant-mode.md`. `styles.class()` and flat configs behave like `semantic`.
 */
```

Remove the `defaultVariantStrategy` field and its doc comment from `ClassNamingConfig`:

```ts
export type ClassNamingConfig = {
  mode: ClassNamingMode;
  /** Prefix for hashed / compact / atomic output and for `hashClass`. Default `ts`. */
  prefix: string;
  /**
   * Package, app, or per-file id: same logical `styles.component` / `styles.class` name under different
   * scopes produces different classes — in `semantic` mode the sanitized scope is prefixed onto the
   * class name (`my-ui-button-base`); in `hashed`/`compact`/`atomic` mode it is mixed into the hash. This matches
   * how `tokens.create` scopes custom property names. In development, re-registering the same
   * scope + component name (e.g. HMR) clears prior rules instead of throwing. Use
   * `fileScopeId(import.meta)` for file-local isolation (CSS Modules–style).
   */
  scopeId: string;
  /**
   * When set (via `createStyles({ layers: … })`), every `class` / `hashClass` / `component`
   * call must pass `{ layer: … }` and emitted rules are wrapped in `@layer`.
   */
  cascadeLayers?: ResolvedCascadeLayers;
  /**
   * Breakpoint names → media query conditions (without `@media` wrapper).
   * Enables `{ base, md, lg }` shorthand on CSS property values.
   */
  breakpoints?: Record<string, string>;
};
```

(This deletes the `defaultVariantStrategy?: 'class' | 'attribute';` field and its doc comment entirely — no replacement field.)

Change every occurrence of `if (cfg.mode === 'semantic')` in this file to `if (cfg.mode === 'semantic' || cfg.mode === 'attribute' || cfg.mode === 'bem')` — there are four: in `emittedComponentClassPrefix`, `emittedClassName`, `buildSingleClassName`, and `buildComponentClassName`. This makes `attribute` and `bem` behave exactly like `semantic` for `styles.class()` and for the one shared-pipeline call each of them still makes (`attribute`'s single base-class emission; `bem`'s flat-config and non-BEM-aware calls) — per both specs, "`styles.class()` (non-component calls) behaves identically to `semantic` mode."

Add a `bem`-specific branch to `emittedComponentClassPrefix` only (for HMR dev-invalidation — `bem`'s block/modifier/element classes are never `${namespace}-...`, they're `${namespace}`/`${namespace}--...`/`${namespace}__...`, so the semantic branch's trailing `-` would fail to match). Change:

```ts
export function emittedComponentClassPrefix(
  cfg: ClassNamingConfig,
  namespace: string,
): string | null {
  if (cfg.mode === 'semantic' || cfg.mode === 'attribute' || cfg.mode === 'bem')
    return `${semanticScopePrefix(cfg)}${namespace}-`;
  return null;
}
```

to:

```ts
export function emittedComponentClassPrefix(
  cfg: ClassNamingConfig,
  namespace: string,
): string | null {
  if (cfg.mode === 'bem') return `${semanticScopePrefix(cfg)}${namespace}`;
  if (cfg.mode === 'semantic' || cfg.mode === 'attribute')
    return `${semanticScopePrefix(cfg)}${namespace}-`;
  return null;
}
```

- [ ] **Step 4: Add the BEM naming helpers**

Append to the end of `packages/typestyles/src/class-naming.ts` (these are pure string templates — BEM mode is never hashed — plus registry tracking, matching what `buildComponentClassName` already does):

```ts
/**
 * `mode: 'bem'` naming — see `specs/bem-variant-mode.md`. Pure string templates (BEM is always
 * readable, never hashed), with the same registry tracking `buildComponentClassName` does.
 */

/** The `root` slot / single-component base class: the bare block, e.g. `button`, `my-ui-dialog`. */
export function buildBemBlockClassName(cfg: ClassNamingConfig, namespace: string): string {
  const className = `${semanticScopePrefix(cfg)}${namespace}`;
  trackEmittedClassName(className, ownerKey(cfg, namespace));
  return className;
}

/** A non-`root` slot: `${block}__${slot}`, e.g. `dialog__trigger`. */
export function buildBemElementClassName(
  cfg: ClassNamingConfig,
  namespace: string,
  slot: string,
): string {
  const className = `${semanticScopePrefix(cfg)}${namespace}__${slot}`;
  trackEmittedClassName(className, ownerKey(cfg, namespace));
  return className;
}

/**
 * A modifier on a given block or element class: `${blockOrElementClassName}--${option}`.
 * `blockOrElementClassName` is whatever `buildBemBlockClassName`/`buildBemElementClassName`
 * already returned for this component/slot — callers pass it through rather than recomputing it,
 * so this never re-derives the scope prefix.
 */
export function buildBemModifierClassName(
  cfg: ClassNamingConfig,
  namespace: string,
  blockOrElementClassName: string,
  option: string,
): string {
  const className = `${blockOrElementClassName}--${option}`;
  trackEmittedClassName(className, ownerKey(cfg, namespace));
  return className;
}
```

`ownerKey` and `semanticScopePrefix` are already private functions in this same file (used by `buildComponentClassName` etc.) — no new imports needed.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter typestyles test -- class-naming`
Expected: PASS

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter typestyles typecheck`
Expected: Fails right now — `defaultVariantStrategy` is still referenced by `component.ts`/`types.ts`/`styles.ts` (fixed in later tasks). Confirm the _only_ errors are about `defaultVariantStrategy`/`variantStrategy`, not about anything in `class-naming.ts` itself.

- [ ] **Step 7: Commit**

```bash
git add packages/typestyles/src/class-naming.ts packages/typestyles/src/class-naming.test.ts
git commit -m "$(cat <<'EOF'
feat: add bem/attribute ClassNamingMode values and BEM naming helpers

Extends ClassNamingMode with 'attribute' and 'bem', removes the
per-component defaultVariantStrategy field (unreleased, no deprecation
needed), and adds pure-template BEM class-name builders. Downstream
callers are updated in later commits on this branch.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `types.ts` — remove `variantStrategy` plumbing

**Files:**

- Modify: `packages/typestyles/src/types.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces: `ComponentConfig<V>` (no `variantStrategy` field), `FlatComponentConfig<K>` (no `variantStrategy` field), `SlotComponentConfig<Slots, V>` (no `variantStrategy` field). `ComponentConfigInputAttribute<V>` is deleted — Tasks 3 and 6 must not reference it.

- [ ] **Step 1: Remove `variantStrategy` from `ComponentConfig`**

In `packages/typestyles/src/types.ts`, replace:

```ts
/**
 * The full config object passed to styles.component() with dimensioned variants.
 *
 * `variantStrategy` selects how each `variants` option compiles:
 * - `'class'` (default) — each option is a discrete class, selected by the JS call.
 * - `'attribute'` — each option compiles to a `&[data-{dimension}="{option}"]` selector scoped
 *   under the single `base` class; the call returns a {@link ComponentAttrsResult} instead of a
 *   class string. See {@link ComponentAttrsReturn}.
 */
export type ComponentConfig<V extends VariantDefinitions> = {
  base?: CSSProperties;
  variants?: V;
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: VariantOptionStyle;
  }>;
  defaultVariants?: ComponentSelections<V>;
  variantStrategy?: 'class' | 'attribute';
};

/**
 * Dimensioned config requiring the literal `variantStrategy: 'attribute'` — used to select the
 * {@link ComponentAttrsReturn}-returning overload of `styles.component()`. Also covers the
 * function-config form (`(ctx) => ...`) so internal vars (`ctx.var`/`ctx.vars`) still type-check
 * under attribute mode.
 */
export type ComponentConfigInputAttribute<V extends VariantDefinitions> =
  | (ComponentConfig<V> & { variantStrategy: 'attribute' })
  | ((ctx: ComponentConfigContext) => ComponentConfig<V> & { variantStrategy: 'attribute' });
```

with:

```ts
/**
 * The full config object passed to styles.component() with dimensioned variants. How `variants`
 * compiles (discrete classes, `&[data-x="y"]` attributes, or BEM modifier classes) is selected by
 * `createStyles({ mode })`, not by anything in this config — see {@link ComponentAttrsReturn} and
 * `specs/attribute-driven-variants.md` / `specs/bem-variant-mode.md`.
 */
export type ComponentConfig<V extends VariantDefinitions> = {
  base?: CSSProperties;
  variants?: V;
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: VariantOptionStyle;
  }>;
  defaultVariants?: ComponentSelections<V>;
};
```

- [ ] **Step 2: Remove `variantStrategy?: never` from `FlatComponentConfig` and `SlotComponentConfig`**

Replace:

```ts
export type FlatComponentConfig<K extends string> = {
  base?: CSSProperties;
  variants?: never;
  defaultVariants?: never;
  compoundVariants?: never;
  slots?: never;
  variantStrategy?: never;
} & Record<K, CSSProperties>;
```

with:

```ts
export type FlatComponentConfig<K extends string> = {
  base?: CSSProperties;
  variants?: never;
  defaultVariants?: never;
  compoundVariants?: never;
  slots?: never;
} & Record<K, CSSProperties>;
```

Replace:

```ts
export type SlotComponentConfig<
  Slots extends readonly string[],
  V extends SlotVariantDefinitions<Slots[number]>,
> = {
  slots: Slots;
  base?: SlotStyles<Slots[number]>;
  variants?: V;
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: SlotStyles<Slots[number]>;
  }>;
  defaultVariants?: ComponentSelections<V>;
  /** Not supported for multi-slot components in v1 — see `specs/attribute-driven-variants.md`. */
  variantStrategy?: never;
};
```

with:

```ts
export type SlotComponentConfig<
  Slots extends readonly string[],
  V extends SlotVariantDefinitions<Slots[number]>,
> = {
  slots: Slots;
  base?: SlotStyles<Slots[number]>;
  variants?: V;
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: SlotStyles<Slots[number]>;
  }>;
  defaultVariants?: ComponentSelections<V>;
};
```

- [ ] **Step 3: Typecheck (expected to still fail elsewhere)**

Run: `pnpm --filter typestyles typecheck`
Expected: Errors in `component.ts`/`styles.ts` referencing the now-deleted `ComponentConfigInputAttribute` and `variantStrategy` — fixed in Tasks 3 and 6. Confirm no NEW errors originate from `types.ts` itself.

- [ ] **Step 4: Commit**

```bash
git add packages/typestyles/src/types.ts
git commit -m "$(cat <<'EOF'
feat: remove variantStrategy field from component config types

variantStrategy moves to createStyles({ mode }) — see class-naming.ts.
Part of the pre-release relocation described in
specs/attribute-driven-variants.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `component.ts` — mode-based dispatch, migrate attribute tests, guard `slots` under `mode: 'attribute'`

**Files:**

- Modify: `packages/typestyles/src/component.ts:25-329` (imports, `RESERVED_KEYS`, `isDimensionedConfig`, `createComponent` overloads/dispatch)
- Modify: `packages/typestyles/src/component-attribute-variants.test.ts`

**Interfaces:**

- Consumes: nothing new from prior tasks besides the type/config changes already made.
- Produces: `createComponent(...)` now dispatches on `classNaming.mode` (`'attribute'` → `createAttributeDimensionedComponent`, else → `createDimensionedComponent`/`createSlotComponent`/`createMultiSlotComponent`/`createFlatComponent` unchanged for now — Tasks 4/5 add the `'bem'` branches). Throws for `slots` under `mode: 'attribute'`.

- [ ] **Step 1: Remove `ComponentConfigInputAttribute` import and the dead `variantStrategy` overload**

In `packages/typestyles/src/component.ts`, remove `ComponentAttrsResult,` — no wait, keep `ComponentAttrsResult`/`ComponentAttrsReturn` (still used). Remove only `ComponentConfigInputAttribute` from the type-only import block at the top:

```ts
import type {
  CSSProperties,
  VariantDefinitions,
  ComponentAttrsResult,
  ComponentAttrsReturn,
  ComponentConfig,
  ComponentConfigContext,
  ComponentConfigInput,
  ComponentConfigInputAttribute,
  ComponentReturn,
  FlatComponentConfig,
  FlatComponentConfigInput,
  FlatComponentReturn,
  SlotComponentConfig,
  SlotComponentConfigInput,
  SlotComponentFunction,
  SlotVariantDefinitions,
  MultiSlotConfig,
  MultiSlotConfigInput,
  MultiSlotReturn,
} from './types';
```

becomes:

```ts
import type {
  CSSProperties,
  VariantDefinitions,
  ComponentAttrsResult,
  ComponentAttrsReturn,
  ComponentConfig,
  ComponentConfigContext,
  ComponentConfigInput,
  ComponentReturn,
  FlatComponentConfig,
  FlatComponentConfigInput,
  FlatComponentReturn,
  SlotComponentConfig,
  SlotComponentConfigInput,
  SlotComponentFunction,
  SlotVariantDefinitions,
  MultiSlotConfig,
  MultiSlotConfigInput,
  MultiSlotReturn,
} from './types';
```

Also add `serializeStyle` to the `./css` import — check the top of the file for an existing `./css` import; there isn't one today, so add a new import line near the other local imports:

```ts
import { serializeStyle } from './css';
```

- [ ] **Step 2: Remove `'variantStrategy'` from `RESERVED_KEYS` and `isDimensionedConfig`**

Replace:

```ts
const RESERVED_KEYS = new Set([
  'base',
  'variants',
  'compoundVariants',
  'defaultVariants',
  'slots',
  'variantStrategy',
]);
```

with:

```ts
const RESERVED_KEYS = new Set(['base', 'variants', 'compoundVariants', 'defaultVariants', 'slots']);
```

Replace:

```ts
function isDimensionedConfig(
  config: Record<string, unknown>,
): config is ComponentConfig<VariantDefinitions> {
  return (
    'variants' in config ||
    'compoundVariants' in config ||
    'defaultVariants' in config ||
    'variantStrategy' in config
  );
}
```

with:

```ts
function isDimensionedConfig(
  config: Record<string, unknown>,
): config is ComponentConfig<VariantDefinitions> {
  return 'variants' in config || 'compoundVariants' in config || 'defaultVariants' in config;
}
```

- [ ] **Step 3: Remove the `ComponentConfigInputAttribute` overload from `createComponent` and update its JSDoc**

Delete this whole overload block (it required the now-deleted type):

```ts
export function createComponent<const V extends VariantDefinitions>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: ComponentConfigInputAttribute<V>,
  layer?: string,
): ComponentAttrsReturn<V>;
```

(leave the remaining four `createComponent` overloads — `ComponentConfigInput<V>`, `FlatComponentConfigInput<K>`, `SlotComponentConfigInput`, `MultiSlotConfigInput` — untouched).

Replace the JSDoc block directly above (currently titled "Attribute-driven variants — `variantStrategy: 'attribute'` ...") with:

````ts
/**
 * Attribute-driven variants — `createStyles({ mode: 'attribute' })` compiles each `variants`
 * option to a `&[data-{dimension}="{option}"]` selector scoped under the single `base` class
 * instead of a discrete class. Boolean dimensions (`{ true, false }` option keys) are
 * presence-based: `true` → `&[data-{dimension}]`, `false` → `&:not([data-{dimension}])`.
 *
 * ```ts
 * const { styles } = createStyles({ mode: 'attribute' });
 * const button = styles.component('button', {
 *   base: { padding: '8px 16px' },
 *   variants: {
 *     variant: {
 *       primary: { backgroundColor: '#0066ff', color: '#fff' },
 *       secondary: { backgroundColor: '#6b7280', color: '#fff' },
 *     },
 *   },
 *   defaultVariants: { variant: 'primary' },
 * });
 *
 * const b = button({ variant: 'primary' });
 * b.className   // "button-base"
 * b.attrs       // { 'data-variant': 'primary' }
 * b.props       // { className: 'button-base', 'data-variant': 'primary' }
 * String(b)     // "button-base"
 * ```
 *
 * Only the plain dimensioned config shape is supported — not `slots` or flat configs. See
 * `specs/attribute-driven-variants.md`. For BEM modifier classes instead, see
 * `createStyles({ mode: 'bem' })` (`specs/bem-variant-mode.md`).
 */
````

- [ ] **Step 4: Update the dispatch body to branch on `classNaming.mode`, guarding `slots` under `mode: 'attribute'`**

Replace:

```ts
  claimComponentNamespace(classNaming, namespace);

  const resolved = resolveComponentConfig(classNaming, namespace, config);
  if (isMultiSlotConfig(resolved)) {
    return createMultiSlotComponent(
      classNaming,
      namespace,
      resolved as MultiSlotConfig<readonly string[]>,
      layer,
    );
  }
  if (isSlotWithVariantsConfig(resolved)) {
    return createSlotComponent(
      classNaming,
      namespace,
      resolved as SlotComponentConfig<readonly string[], SlotVariantDefinitions<string>>,
      layer,
    );
  }
  if (isDimensionedConfig(resolved)) {
    const dimensionedConfig = resolved as ComponentConfig<VariantDefinitions>;
    const effectiveVariantStrategy =
      dimensionedConfig.variantStrategy ?? classNaming.defaultVariantStrategy ?? 'class';
    if (effectiveVariantStrategy === 'attribute') {
      return createAttributeDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
    }
    return createDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
  }
  return createFlatComponent(
    classNaming,
    namespace,
    resolved as FlatComponentConfig<string>,
    layer,
  );
}
```

with:

```ts
  claimComponentNamespace(classNaming, namespace);

  const resolved = resolveComponentConfig(classNaming, namespace, config);
  if (isMultiSlotConfig(resolved)) {
    assertSlotsSupportedForMode(classNaming, namespace);
    return createMultiSlotComponent(
      classNaming,
      namespace,
      resolved as MultiSlotConfig<readonly string[]>,
      layer,
    );
  }
  if (isSlotWithVariantsConfig(resolved)) {
    assertSlotsSupportedForMode(classNaming, namespace);
    return createSlotComponent(
      classNaming,
      namespace,
      resolved as SlotComponentConfig<readonly string[], SlotVariantDefinitions<string>>,
      layer,
    );
  }
  if (isDimensionedConfig(resolved)) {
    const dimensionedConfig = resolved as ComponentConfig<VariantDefinitions>;
    if (classNaming.mode === 'attribute') {
      return createAttributeDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
    }
    return createDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
  }
  return createFlatComponent(
    classNaming,
    namespace,
    resolved as FlatComponentConfig<string>,
    layer,
  );
}

/**
 * `slots` (multi-slot and slot-with-variants configs) is not supported under
 * `createStyles({ mode: 'attribute' })` — excluded at the type level (no `slots`-accepting
 * overload exists on that instance's `styles.component()`, see `styles.ts`), and re-checked here
 * as a runtime backstop for callers who bypass the types (`as any`, plain JS). See
 * `specs/attribute-driven-variants.md`'s "Explicitly out of scope."
 */
function assertSlotsSupportedForMode(classNaming: ClassNamingConfig, namespace: string): void {
  if (classNaming.mode === 'attribute') {
    throw new Error(
      `[typestyles] \`slots\` is not supported with \`createStyles({ mode: 'attribute' })\` — namespace "${namespace}". See specs/attribute-driven-variants.md.`,
    );
  }
}
```

Note: Task 4/5 will add a `classNaming.mode === 'bem'` branch inside this same `if (isDimensionedConfig(...))`/`isSlotWithVariantsConfig`/`isMultiSlotConfig` dispatch — don't worry about `bem` yet in this task.

- [ ] **Step 5: Rewrite `component-attribute-variants.test.ts` for the `mode`-based API**

Open `packages/typestyles/src/component-attribute-variants.test.ts`. Every test currently calls `createComponent(defaultClassNamingConfig, name, { ...config, variantStrategy: 'attribute' })`. Replace `defaultClassNamingConfig` with `mergeClassNaming({ mode: 'attribute' })` and delete the `variantStrategy: 'attribute'` line from every config object. Update the import line:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createComponent } from './component';
import { mergeClassNaming } from './class-naming';
import { createStyles } from './styles';
import { cx } from './cx';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { registeredNamespaces } from './registry';

const attributeMode = mergeClassNaming({ mode: 'attribute' });

describe('createComponent — attribute-mode dimensioned variants', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('returns a callable function', () => {
    const btn = createComponent(attributeMode, 'attrbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });
    expect(typeof btn).toBe('function');
  });

  it('exposes only the base class — no per-option destructurable keys', () => {
    const btn = createComponent(attributeMode, 'noopt', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });
    expect(btn.base).toBe('noopt-base');
    expect(Object.keys(btn)).toEqual(['base']);
  });

  it('resolves className, attrs, and props for a single dimension', () => {
    const btn = createComponent(attributeMode, 'sbtn', {
      base: { padding: '8px' },
      variants: {
        variant: {
          primary: { backgroundColor: 'blue' },
          secondary: { backgroundColor: 'gray' },
        },
      },
    });

    const b = btn({ variant: 'primary' });
    expect(b.className).toBe('sbtn-base');
    expect(b.attrs).toEqual({ 'data-variant': 'primary' });
    expect(b.props).toEqual({ className: 'sbtn-base', 'data-variant': 'primary' });
  });

  it('resolves className, attrs, and props for multiple dimensions', () => {
    const btn = createComponent(attributeMode, 'mbtn', {
      base: { padding: '8px' },
      variants: {
        variant: {
          primary: { backgroundColor: 'blue' },
          secondary: { backgroundColor: 'gray' },
        },
        size: {
          small: { fontSize: '14px' },
          large: { fontSize: '18px' },
        },
      },
    });

    const b = btn({ variant: 'primary', size: 'small' });
    expect(b.className).toBe('mbtn-base');
    expect(b.attrs).toEqual({ 'data-variant': 'primary', 'data-size': 'small' });
    expect(b.props).toEqual({
      className: 'mbtn-base',
      'data-variant': 'primary',
      'data-size': 'small',
    });
  });

  it('applies defaultVariants when selection is omitted', () => {
    const btn = createComponent(attributeMode, 'dbtn', {
      base: { padding: '8px' },
      variants: {
        variant: {
          primary: { backgroundColor: 'blue' },
          secondary: { backgroundColor: 'gray' },
        },
      },
      defaultVariants: { variant: 'primary' },
    });

    expect(btn().attrs).toEqual({ 'data-variant': 'primary' });
    expect(btn({}).attrs).toEqual({ 'data-variant': 'primary' });
    expect(btn({ variant: 'secondary' }).attrs).toEqual({ 'data-variant': 'secondary' });
  });

  it('boolean dimension is presence-based: true -> empty-string attr, false -> omitted', () => {
    const btn = createComponent(attributeMode, 'boolbtn', {
      base: { padding: '8px' },
      variants: {
        disabled: {
          true: { opacity: 0.5 },
          false: {},
        },
      },
    });

    expect(btn({ disabled: true }).attrs).toEqual({ 'data-disabled': '' });
    expect(btn({ disabled: false }).attrs).toEqual({});
    expect(btn().attrs).toEqual({});
  });

  it('String(result) and template coercion return the base class name', () => {
    const btn = createComponent(attributeMode, 'strbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    const b = btn({ variant: 'primary' });
    expect(String(b)).toBe('strbtn-base');
    expect(`${b}`).toBe('strbtn-base');
  });

  it('interops with cx()', () => {
    const btn = createComponent(attributeMode, 'cxbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    const b = btn({ variant: 'primary' });
    expect(cx(b, 'extra')).toBe('cxbtn-base extra');
  });

  it('logs console.error in dev for unknown variant dimension', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    const btn = createComponent(attributeMode, 'unknowndim', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    btn({ bogus: 'x' } as unknown as Record<string, unknown>);

    expect(err).toHaveBeenCalledWith(expect.stringContaining('Unknown variant dimension "bogus"'));
    err.mockRestore();
  });

  it('logs console.error in dev for unknown variant option', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    const btn = createComponent(attributeMode, 'unknownopt', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    btn({ variant: 'nope' as 'primary' });

    expect(err).toHaveBeenCalledWith(expect.stringContaining('Unknown variant "nope"'));
    err.mockRestore();
  });

  it('throws when a slots config is passed under mode: "attribute"', () => {
    expect(() =>
      createComponent(attributeMode, 'slotbtn', {
        slots: ['root', 'trigger'],
        base: { root: { display: 'grid' } },
      } as never),
    ).toThrow(/does not support|not supported/i);
  });

  describe('CSS emission', () => {
    it('compiles each option to a &[data-dimension="option"] selector scoped under one base class', () => {
      createComponent(attributeMode, 'css-basic', {
        base: { padding: '8px' },
        variants: {
          variant: {
            primary: { backgroundColor: 'blue' },
            secondary: { backgroundColor: 'gray' },
          },
        },
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('.css-basic-base { padding: 8px; }');
      expect(css).toContain('.css-basic-base[data-variant="primary"] { background-color: blue; }');
      expect(css).toContain(
        '.css-basic-base[data-variant="secondary"] { background-color: gray; }',
      );
      expect(css).not.toContain('.css-basic-variant-primary');
    });

    it('compiles a boolean dimension to presence / :not() selectors', () => {
      createComponent(attributeMode, 'css-bool', {
        variants: {
          disabled: {
            true: { opacity: 0.5 },
            false: { opacity: 1 },
          },
        },
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('.css-bool-base[data-disabled] { opacity: 0.5; }');
      expect(css).toContain('.css-bool-base:not([data-disabled]) { opacity: 1; }');
    });

    it('skips CSS emission entirely for an empty option style block', () => {
      createComponent(attributeMode, 'css-empty-opt', {
        base: { padding: '8px' },
        variants: {
          disabled: {
            true: { opacity: 0.5 },
            false: {},
          },
        },
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).not.toContain(':not([data-disabled])');
    });

    it('compiles a compound variant to a single combined attribute selector, no compound class', () => {
      createComponent(attributeMode, 'css-compound', {
        variants: {
          variant: {
            primary: { color: 'blue' },
            secondary: { color: 'gray' },
          },
          size: {
            small: { fontSize: '14px' },
            large: { fontSize: '18px' },
          },
        },
        compoundVariants: [
          {
            variants: { variant: 'primary', size: 'large' },
            style: { fontWeight: 700 },
          },
        ],
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain(
        '.css-compound-base[data-variant="primary"][data-size="large"] { font-weight: 700; }',
      );
      expect(css).not.toContain('compound-0');
    });

    it('compiles a compound variant with an array value to :is(...)', () => {
      createComponent(attributeMode, 'css-compound-arr', {
        variants: {
          tone: {
            success: { color: 'green' },
            warning: { color: 'orange' },
            danger: { color: 'red' },
          },
          size: {
            lg: { fontSize: '18px' },
          },
        },
        compoundVariants: [
          {
            variants: { tone: ['success', 'warning'], size: 'lg' },
            style: { textTransform: 'uppercase' },
          },
        ],
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain(
        '.css-compound-arr-base:is([data-tone="success"], [data-tone="warning"])[data-size="lg"] { text-transform: uppercase; }',
      );
    });
  });
});

describe('createStyles({ mode: "attribute" })', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('every dimensioned component from the instance compiles in attribute mode', () => {
    const { styles } = createStyles({ mode: 'attribute', scopeId: 'ds-a' });
    const btn = styles.component('gbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    const b = btn({ variant: 'primary' });
    expect(b.attrs).toEqual({ 'data-variant': 'primary' });
  });

  it('a plain (non-attribute-mode) instance compiles class-based variants as before', () => {
    const { styles } = createStyles({ scopeId: 'ds-c' });
    const btn = styles.component('plainbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    expect(btn({ variant: 'primary' })).toBe('ds-c-plainbtn-base ds-c-plainbtn-variant-primary');
  });
});
```

This deletes the old `atomic naming mode: attribute-branch declarations still scope under the base selector` test — `mode: 'atomic'` and `mode: 'attribute'` are now mutually exclusive (both are top-level `ClassNamingMode` values), so that combination can no longer be constructed. This also deletes the `defaultVariantStrategy`-override tests (`variantStrategy: 'class'` override, `defaultVariantStrategy` unset) since there is no longer a per-component override to test — `mode` is instance-wide, matching every other mode.

- [ ] **Step 6: Run the test suite**

Run: `pnpm --filter typestyles test -- component-attribute-variants`
Expected: PASS

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter typestyles typecheck`
Expected: Errors remain only in `styles.ts`/`create-type-styles.ts` (fixed in Tasks 6–7). No errors from `component.ts`, `types.ts`, or `class-naming.ts`.

- [ ] **Step 8: Commit**

```bash
git add packages/typestyles/src/component.ts packages/typestyles/src/component-attribute-variants.test.ts
git commit -m "$(cat <<'EOF'
feat: dispatch attribute-mode variants from classNaming.mode

createComponent() now branches on classNaming.mode === 'attribute'
instead of a per-call/per-instance variantStrategy field, closing the
type/runtime mismatch described in specs/attribute-driven-variants.md.
slots under mode: 'attribute' now throws at runtime as a backstop for
the type-level restriction landing in a later commit.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `component.ts` — `mode: 'bem'` single-component builder

**Files:**

- Modify: `packages/typestyles/src/component.ts` (dispatch branch + new `createBemDimensionedComponent`)
- Test: `packages/typestyles/src/component-bem-variants.test.ts` (new)

**Interfaces:**

- Consumes: `buildBemBlockClassName`, `buildBemModifierClassName` from `class-naming.ts` (Task 1); `serializeStyle` from `css.ts`.
- Produces: `createBemDimensionedComponent<V>(classNaming, namespace, config, layer?): ComponentReturn<V>`, wired into `createComponent`'s dispatch when `classNaming.mode === 'bem'`.

- [ ] **Step 1: Write failing tests**

Create `packages/typestyles/src/component-bem-variants.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createComponent } from './component';
import { mergeClassNaming } from './class-naming';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { registeredNamespaces } from './registry';

const bemMode = mergeClassNaming({ mode: 'bem' });

describe('createComponent — bem-mode dimensioned variants', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('base class has no -base suffix', () => {
    const btn = createComponent(bemMode, 'button', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });
    expect(btn.base).toBe('button');
  });

  it('modifier classes have no dimension name', () => {
    const btn = createComponent(bemMode, 'button2', {
      base: { padding: '8px' },
      variants: {
        variant: { primary: { color: 'blue' }, secondary: { color: 'gray' } },
        size: { small: { fontSize: '14px' }, large: { fontSize: '18px' } },
      },
    });
    expect(btn['variant-primary']).toBe('button2--primary');
    expect(btn['size-large']).toBe('button2--large');
  });

  it('call composes block + selected modifier classes', () => {
    const btn = createComponent(bemMode, 'button3', {
      base: { padding: '8px' },
      variants: {
        variant: { primary: { color: 'blue' }, secondary: { color: 'gray' } },
        size: { small: { fontSize: '14px' }, large: { fontSize: '18px' } },
      },
      defaultVariants: { variant: 'primary', size: 'small' },
    });
    expect(btn({ variant: 'primary', size: 'large' })).toBe(
      'button3 button3--primary button3--large',
    );
    expect(btn()).toBe('button3 button3--primary button3--small');
  });

  it('has no block class at all when base is omitted', () => {
    const btn = createComponent(bemMode, 'nobase', {
      variants: { variant: { primary: { color: 'blue' } } },
    });
    expect(btn.base).toBeUndefined();
    expect(btn({ variant: 'primary' })).toBe('nobase--primary');
  });

  it('logs console.error in dev for unknown variant dimension', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const btn = createComponent(bemMode, 'unknowndim', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });
    btn({ bogus: 'x' } as unknown as Record<string, unknown>);
    expect(err).toHaveBeenCalledWith(expect.stringContaining('Unknown variant dimension "bogus"'));
    err.mockRestore();
  });

  it('warns in dev when two dimensions collide on the same modifier class', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    createComponent(bemMode, 'collide', {
      variants: {
        intent: { primary: { color: 'blue' } },
        theme: { primary: { backgroundColor: 'black' } },
      },
    });
    expect(err).toHaveBeenCalledWith(expect.stringContaining('collide--primary'));
    err.mockRestore();
  });

  describe('CSS emission', () => {
    it('emits block and modifier classes as independent top-level rules', () => {
      createComponent(bemMode, 'css-basic', {
        base: { padding: '8px' },
        variants: {
          variant: { primary: { color: 'blue' }, secondary: { color: 'gray' } },
        },
      });
      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('.css-basic { padding: 8px; }');
      expect(css).toContain('.css-basic--primary { color: blue; }');
      expect(css).toContain('.css-basic--secondary { color: gray; }');
    });

    it('compiles a compound variant to a chained modifier selector, no synthetic class', () => {
      const btn = createComponent(bemMode, 'css-compound', {
        variants: {
          variant: { primary: { color: 'blue' }, secondary: { color: 'gray' } },
          size: { small: { fontSize: '14px' }, large: { fontSize: '18px' } },
        },
        compoundVariants: [
          { variants: { variant: 'primary', size: 'large' }, style: { fontWeight: 700 } },
        ],
      });
      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('.css-compound--primary.css-compound--large { font-weight: 700; }');
      expect(Object.keys(btn)).not.toContain('compound-0');
    });

    it('compiles a compound variant with an array value to :is(...)', () => {
      createComponent(bemMode, 'css-compound-arr', {
        variants: {
          tone: {
            success: { color: 'green' },
            warning: { color: 'orange' },
            danger: { color: 'red' },
          },
          size: { lg: { fontSize: '18px' } },
        },
        compoundVariants: [
          {
            variants: { tone: ['success', 'warning'], size: 'lg' },
            style: { textTransform: 'uppercase' },
          },
        ],
      });
      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain(
        ':is(.css-compound-arr--success, .css-compound-arr--warning).css-compound-arr--lg { text-transform: uppercase; }',
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter typestyles test -- component-bem-variants`
Expected: FAIL — `mode: 'bem'` still dispatches to the default class-based `createDimensionedComponent`, so `btn.base` is `"css-basic-base"` not `"css-basic"`, etc.

- [ ] **Step 3: Add `buildBemModifierClassName`/`buildBemBlockClassName` imports and the collision-warning helper**

In `packages/typestyles/src/component.ts`, add to the `./class-naming` import (currently `import { emittedComponentClassPrefix, type ClassNamingConfig } from './class-naming';`):

```ts
import {
  emittedComponentClassPrefix,
  buildBemBlockClassName,
  buildBemModifierClassName,
  type ClassNamingConfig,
} from './class-naming';
```

Add near `devWarnInvalidDimensionOption` (same style/placement):

```ts
/**
 * `mode: 'bem'` has no dimension namespace in its modifier classes, so two different dimensions
 * producing the same option string collide on the identical class name — warn rather than let one
 * silently override the other. `seenBy` is scoped per component (or per slot, for slot components).
 */
function devWarnBemModifierCollision(
  scopeLabel: string,
  className: string,
  dimension: string,
  seenBy: Map<string, string>,
): void {
  if (process.env.NODE_ENV === 'production') return;
  const owner = seenBy.get(className);
  if (owner && owner !== dimension) {
    console.error(
      `[typestyles] BEM modifier class "${className}" is produced by both dimension "${owner}" ` +
        `and dimension "${dimension}" in "${scopeLabel}" — one will silently override the ` +
        `other's styles in the cascade. Choose non-colliding option names.`,
    );
    return;
  }
  seenBy.set(className, dimension);
}
```

- [ ] **Step 4: Add `createBemDimensionedComponent`**

Add directly after `createDimensionedComponent` (before the "Dimensioned variant component — attribute strategy" comment block):

```ts
// ---------------------------------------------------------------------------
// Dimensioned variant component — bem mode (mode: 'bem'; see specs/bem-variant-mode.md)
// ---------------------------------------------------------------------------

function createBemDimensionedComponent<V extends VariantDefinitions>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: ComponentConfig<V>,
  layer?: string,
): ComponentReturn<V> {
  const { base, variants = {} as V, compoundVariants = [], defaultVariants = {} } = config;

  const rules: Array<{ key: string; css: string }> = [];
  const classMap: Record<string, string> = {};

  const blockClassName = buildBemBlockClassName(classNaming, namespace);
  const hasBase = base != null;
  if (hasBase) {
    classMap['base'] = blockClassName;
    rules.push(
      ...serializeStyle(`.${blockClassName}`, base as CSSProperties, {
        breakpoints: classNaming.breakpoints,
      }),
    );
  }

  const variantClassByKey: Record<string, string> = {};
  const seenModifierClassNames = new Map<string, string>();
  for (const [dimension, options] of Object.entries(variants)) {
    for (const [option, properties] of Object.entries(options as Record<string, CSSProperties>)) {
      const key = `${dimension}-${option}`;
      const modifierClassName = buildBemModifierClassName(
        classNaming,
        namespace,
        blockClassName,
        option,
      );
      devWarnBemModifierCollision(namespace, modifierClassName, dimension, seenModifierClassNames);
      variantClassByKey[key] = modifierClassName;
      classMap[key] = modifierClassName;
      rules.push(
        ...serializeStyle(`.${modifierClassName}`, properties, {
          breakpoints: classNaming.breakpoints,
        }),
      );
    }
  }

  (compoundVariants as Array<{ variants: Record<string, unknown>; style: CSSProperties }>).forEach(
    (cv) => {
      const selectorSuffix = Object.entries(cv.variants)
        .map(([dimension, expected]) => {
          const optionMap = (variants as Record<string, Record<string, CSSProperties>>)[dimension];
          if (!optionMap) return '';
          const values = Array.isArray(expected) ? expected : [expected];
          const classSelectors = values
            .map((value) => normalizeSelection(value, optionMap))
            .filter((selected): selected is string => selected != null)
            .map((selected) => `.${variantClassByKey[`${dimension}-${selected}`]}`);
          if (classSelectors.length === 0) return '';
          return classSelectors.length === 1
            ? classSelectors[0]
            : `:is(${classSelectors.join(', ')})`;
        })
        .join('');

      if (!selectorSuffix) return;
      rules.push(
        ...serializeStyle(selectorSuffix, cv.style, { breakpoints: classNaming.breakpoints }),
      );
    },
  );

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  const selectorFn = (selections: Record<string, unknown> = {}): string => {
    const classes: string[] = [];
    if (hasBase) classes.push(blockClassName);

    devWarnUnknownVariantDimensions(namespace, selections, variants as Record<string, unknown>);

    const resolved: Record<string, unknown> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, CSSProperties>;
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      const effective = explicit ?? fallback;
      const selected = normalizeSelection(effective, optionMap);
      resolved[dimension] = selected;

      devWarnInvalidDimensionOption(
        namespace,
        dimension,
        effective,
        selected,
        optionMap as Record<string, unknown>,
      );
    }

    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, CSSProperties>;
      const selected = normalizeSelection(resolved[dimension], optionMap);
      if (selected != null) {
        const cn = variantClassByKey[`${dimension}-${selected}`];
        if (cn) classes.push(cn);
      }
    }

    return classes.join(' ');
  };

  const result = makeCallableObject(
    (...args: unknown[]) => selectorFn(args[0] as Record<string, unknown> | undefined),
    classMap,
  ) as ComponentReturn<V>;

  attachComposeMeta(result, Object.keys(variants));

  return result;
}
```

- [ ] **Step 5: Wire the dispatch branch**

In `createComponent`'s implementation body (edited in Task 3), change:

```ts
if (isDimensionedConfig(resolved)) {
  const dimensionedConfig = resolved as ComponentConfig<VariantDefinitions>;
  if (classNaming.mode === 'attribute') {
    return createAttributeDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
  }
  return createDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
}
```

to:

```ts
if (isDimensionedConfig(resolved)) {
  const dimensionedConfig = resolved as ComponentConfig<VariantDefinitions>;
  if (classNaming.mode === 'attribute') {
    return createAttributeDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
  }
  if (classNaming.mode === 'bem') {
    return createBemDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
  }
  return createDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter typestyles test -- component-bem-variants`
Expected: PASS

- [ ] **Step 7: Run the full test suite + typecheck**

Run: `pnpm --filter typestyles test && pnpm --filter typestyles typecheck`
Expected: All tests pass; remaining typecheck errors (if any) confined to `styles.ts`/`create-type-styles.ts` (Tasks 6–7).

- [ ] **Step 8: Commit**

```bash
git add packages/typestyles/src/component.ts packages/typestyles/src/component-bem-variants.test.ts
git commit -m "$(cat <<'EOF'
feat: add mode: 'bem' single-component variant builder

Dimensioned styles.component() under createStyles({ mode: 'bem' })
compiles variants to BEM modifier classes (block--modifier) with no
dimension name, and compounds to chained modifier-class selectors with
no synthetic class — mirroring how mode: 'attribute' handles compounds.
Dev-mode warns when two dimensions collide on the same modifier class.
See specs/bem-variant-mode.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `component.ts` — `mode: 'bem'` slot and multi-slot builders

**Files:**

- Modify: `packages/typestyles/src/component.ts` (dispatch branches + new `createBemSlotComponent`/`createBemMultiSlotComponent`)
- Test: `packages/typestyles/src/component-bem-variants.test.ts` (append)

**Interfaces:**

- Consumes: `buildBemBlockClassName`, `buildBemElementClassName`, `buildBemModifierClassName` from `class-naming.ts`; `devWarnBemModifierCollision` from Task 4.
- Produces: `createBemSlotComponent(...)`, `createBemMultiSlotComponent(...)`, wired into `createComponent`'s dispatch.

- [ ] **Step 1: Write failing tests**

Append to `packages/typestyles/src/component-bem-variants.test.ts`:

```ts
describe('createComponent — bem-mode slots', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('root slot maps to the bare block class; other slots map to block__element', () => {
    const dialog = createComponent(bemMode, 'dialog', {
      slots: ['root', 'trigger', 'content'],
      base: { root: { display: 'grid' }, trigger: { cursor: 'pointer' } },
    });
    const classes = dialog();
    expect(classes.root).toBe('dialog');
    expect(classes.trigger).toBe('dialog__trigger');
    expect(classes.content).toBe('dialog__content');
  });

  it('slot variant options compile to block__slot--modifier (or block--modifier for root)', () => {
    const dialog = createComponent(bemMode, 'dialog2', {
      slots: ['root', 'trigger', 'content'],
      base: { root: { display: 'grid' } },
      variants: {
        size: {
          sm: { trigger: { fontSize: '12px' }, content: { padding: '8px' }, root: { gap: '4px' } },
          lg: { trigger: { fontSize: '16px' }, content: { padding: '12px' } },
        },
      },
    });
    const classes = dialog({ size: 'lg' });
    expect(classes.root).toBe('dialog2');
    expect(classes.trigger).toBe('dialog2__trigger dialog2__trigger--lg');
    expect(classes.content).toBe('dialog2__content dialog2__content--lg');
  });

  it('multi-slot config (no variants) maps root/element the same way, no modifier classes', () => {
    const dialog = createComponent(bemMode, 'dialog3', {
      slots: ['root', 'trigger'],
      root: { display: 'grid' },
      trigger: { cursor: 'pointer' },
    });
    const classes = dialog();
    expect(classes.root).toBe('dialog3');
    expect(classes.trigger).toBe('dialog3__trigger');
  });

  it('collision warning is scoped per slot', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const dialog = createComponent(bemMode, 'dialog4', {
      slots: ['root', 'trigger', 'content'],
      variants: {
        intent: { primary: { trigger: { color: 'blue' } } },
        theme: { primary: { trigger: { backgroundColor: 'black' } } },
      },
    });
    dialog();
    expect(err).toHaveBeenCalledWith(expect.stringContaining('dialog4__trigger--primary'));
    err.mockRestore();

    const err2 = vi.spyOn(console, 'error').mockImplementation(() => {});
    createComponent(bemMode, 'dialog5', {
      slots: ['root', 'trigger', 'content'],
      variants: {
        intent: { primary: { trigger: { color: 'blue' }, content: { color: 'red' } } },
      },
    });
    // Same option "primary" on two different slots is NOT a collision.
    expect(err2).not.toHaveBeenCalled();
    err2.mockRestore();
  });

  describe('CSS emission', () => {
    it('compiles a slot compound variant to a chained selector scoped to that slot', () => {
      createComponent(bemMode, 'dialog6', {
        slots: ['root', 'trigger'],
        variants: {
          intent: { primary: { trigger: { color: 'blue' } } },
          size: { lg: { trigger: { fontSize: '18px' } } },
        },
        compoundVariants: [
          {
            variants: { intent: 'primary', size: 'lg' },
            style: { trigger: { fontWeight: 700 } },
          },
        ],
      });
      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain(
        '.dialog6__trigger--primary.dialog6__trigger--lg { font-weight: 700; }',
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter typestyles test -- component-bem-variants`
Expected: FAIL — `slots` under `mode: 'bem'` still dispatches to the default (non-BEM) `createSlotComponent`/`createMultiSlotComponent`.

- [ ] **Step 3: Add `buildBemElementClassName` to the `class-naming` import**

Update the import added in Task 4:

```ts
import {
  emittedComponentClassPrefix,
  buildBemBlockClassName,
  buildBemElementClassName,
  buildBemModifierClassName,
  type ClassNamingConfig,
} from './class-naming';
```

- [ ] **Step 4: Add `createBemMultiSlotComponent`**

Add directly after `createMultiSlotComponent`:

```ts
// ---------------------------------------------------------------------------
// Multi-slot component — bem mode (mode: 'bem'; see specs/bem-variant-mode.md)
// ---------------------------------------------------------------------------

function bemSlotClassName(classNaming: ClassNamingConfig, namespace: string, slot: string): string {
  return slot === 'root'
    ? buildBemBlockClassName(classNaming, namespace)
    : buildBemElementClassName(classNaming, namespace, slot);
}

function createBemMultiSlotComponent<Slots extends readonly string[]>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: MultiSlotConfig<Slots>,
  layer?: string,
): MultiSlotReturn<Slots> {
  const { slots } = config;

  const rules: Array<{ key: string; css: string }> = [];
  const slotClassMap: Record<string, string> = {};

  for (const slot of slots as readonly string[]) {
    const className = bemSlotClassName(classNaming, namespace, slot);
    slotClassMap[slot] = className;
    const properties = (config as Record<string, CSSProperties | undefined>)[slot];
    if (properties) {
      rules.push(
        ...serializeStyle(`.${className}`, properties, { breakpoints: classNaming.breakpoints }),
      );
    }
  }

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  const selectorFn = (): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const slot of slots as readonly string[]) {
      result[slot] = slotClassMap[slot] || '';
    }
    return result;
  };

  return makeMultiSlotObject(selectorFn, slotClassMap) as MultiSlotReturn<Slots>;
}
```

- [ ] **Step 5: Add `createBemSlotComponent`**

Add directly after `createBemMultiSlotComponent`:

```ts
// ---------------------------------------------------------------------------
// Slot component — bem mode (mode: 'bem'; see specs/bem-variant-mode.md)
// ---------------------------------------------------------------------------

function createBemSlotComponent<
  Slots extends readonly string[],
  V extends SlotVariantDefinitions<Slots[number]>,
>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: SlotComponentConfig<Slots, V>,
  layer?: string,
): SlotComponentFunction<Slots, V> {
  const {
    slots,
    base = {},
    variants = {} as V,
    compoundVariants = [],
    defaultVariants = {},
  } = config;

  const rules: Array<{ key: string; css: string }> = [];
  const baseClassBySlot: Record<string, string> = {};
  for (const slot of slots as readonly string[]) {
    const className = bemSlotClassName(classNaming, namespace, slot);
    baseClassBySlot[slot] = className;
    const properties = (base as Record<string, CSSProperties>)[slot];
    if (properties) {
      rules.push(
        ...serializeStyle(`.${className}`, properties, { breakpoints: classNaming.breakpoints }),
      );
    }
  }

  const variantClassByKey: Record<string, string> = {};
  const seenModifierClassNamesBySlot = new Map<string, Map<string, string>>();
  for (const [dimension, options] of Object.entries(variants)) {
    for (const [option, slotStyles] of Object.entries(
      options as Record<string, Record<string, CSSProperties>>,
    )) {
      for (const [slot, properties] of Object.entries(slotStyles)) {
        const slotClassName = baseClassBySlot[slot];
        if (!slotClassName) continue;
        const modifierClassName = buildBemModifierClassName(
          classNaming,
          namespace,
          slotClassName,
          option,
        );
        let seenForSlot = seenModifierClassNamesBySlot.get(slot);
        if (!seenForSlot) {
          seenForSlot = new Map<string, string>();
          seenModifierClassNamesBySlot.set(slot, seenForSlot);
        }
        devWarnBemModifierCollision(
          `${namespace}__${slot}`,
          modifierClassName,
          dimension,
          seenForSlot,
        );
        variantClassByKey[`${slot}-${dimension}-${option}`] = modifierClassName;
        rules.push(
          ...serializeStyle(`.${modifierClassName}`, properties, {
            breakpoints: classNaming.breakpoints,
          }),
        );
      }
    }
  }

  (
    compoundVariants as Array<{
      variants: Record<string, unknown>;
      style: Record<string, CSSProperties>;
    }>
  ).forEach((cv) => {
    for (const [slot, properties] of Object.entries(cv.style)) {
      const selectorSuffix = Object.entries(cv.variants)
        .map(([dimension, expected]) => {
          const options = (variants as Record<string, Record<string, unknown>>)[dimension];
          if (!options) return '';
          const values = Array.isArray(expected) ? expected : [expected];
          const classSelectors = values
            .map((value) => normalizeSelection(value, options))
            .filter((selected): selected is string => selected != null)
            .map((selected) => variantClassByKey[`${slot}-${dimension}-${selected}`])
            .filter((cn): cn is string => cn != null)
            .map((cn) => `.${cn}`);
          if (classSelectors.length === 0) return '';
          return classSelectors.length === 1
            ? classSelectors[0]
            : `:is(${classSelectors.join(', ')})`;
        })
        .join('');

      if (!selectorSuffix) continue;
      rules.push(
        ...serializeStyle(selectorSuffix, properties, { breakpoints: classNaming.breakpoints }),
      );
    }
  });

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  return ((selections: Record<string, unknown> = {}) => {
    const classes = Object.fromEntries(
      (slots as readonly string[]).map((slot) => [slot, [baseClassBySlot[slot]] as string[]]),
    ) as Record<string, string[]>;

    devWarnUnknownVariantDimensions(namespace, selections, variants as Record<string, unknown>);

    const resolvedSelections: Record<string, unknown> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, unknown>;
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      const effective = explicit ?? fallback;
      const selected = normalizeSelection(effective, optionMap);
      resolvedSelections[dimension] = selected;

      devWarnInvalidDimensionOption(namespace, dimension, effective, selected, optionMap);
    }

    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, Record<string, CSSProperties>>;
      const selected = normalizeSelection(resolvedSelections[dimension], optionMap);
      if (selected == null) continue;
      const slotStyles = optionMap[selected];
      if (!slotStyles) continue;

      for (const slot of Object.keys(slotStyles)) {
        const cn = variantClassByKey[`${slot}-${dimension}-${selected}`];
        if (cn && classes[slot]) classes[slot].push(cn);
      }
    }

    return Object.fromEntries(
      (slots as readonly string[]).map((slot) => [slot, classes[slot].join(' ')]),
    ) as Record<Slots[number], string>;
  }) as SlotComponentFunction<Slots, V>;
}
```

- [ ] **Step 6: Wire the dispatch branches**

Update the `isMultiSlotConfig`/`isSlotWithVariantsConfig` branches (edited in Task 3):

```ts
if (isMultiSlotConfig(resolved)) {
  assertSlotsSupportedForMode(classNaming, namespace);
  if (classNaming.mode === 'bem') {
    return createBemMultiSlotComponent(
      classNaming,
      namespace,
      resolved as MultiSlotConfig<readonly string[]>,
      layer,
    );
  }
  return createMultiSlotComponent(
    classNaming,
    namespace,
    resolved as MultiSlotConfig<readonly string[]>,
    layer,
  );
}
if (isSlotWithVariantsConfig(resolved)) {
  assertSlotsSupportedForMode(classNaming, namespace);
  if (classNaming.mode === 'bem') {
    return createBemSlotComponent(
      classNaming,
      namespace,
      resolved as SlotComponentConfig<readonly string[], SlotVariantDefinitions<string>>,
      layer,
    );
  }
  return createSlotComponent(
    classNaming,
    namespace,
    resolved as SlotComponentConfig<readonly string[], SlotVariantDefinitions<string>>,
    layer,
  );
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm --filter typestyles test -- component-bem-variants`
Expected: PASS

- [ ] **Step 8: Run the full test suite + typecheck**

Run: `pnpm --filter typestyles test && pnpm --filter typestyles typecheck`
Expected: All tests pass; remaining typecheck errors (if any) confined to `styles.ts`/`create-type-styles.ts` (Tasks 6–7).

- [ ] **Step 9: Commit**

```bash
git add packages/typestyles/src/component.ts packages/typestyles/src/component-bem-variants.test.ts
git commit -m "$(cat <<'EOF'
feat: add mode: 'bem' multi-part support via slots

root slot maps to the bare block class; other slots map to
block__element. Slot variant options compile to block__slot--modifier
(or block--modifier for root), with the same chained-selector compound
handling as the single-component builder, scoped per slot. Collision
warnings are scoped per slot. See specs/bem-variant-mode.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `styles.ts` — `AttributeStylesApi` types and `createStyles()` overloads

**Files:**

- Modify: `packages/typestyles/src/styles.ts`
- Test: `packages/typestyles/src/component-mode-shapes.typecheck.ts` (new — compile-only, follows the `computed-style-keys.typecheck.ts` convention)

**Interfaces:**

- Consumes: `ComponentAttrsReturn<V>` (already exists in `types.ts`), `LayerOption<L>` (already in `styles.ts`).
- Produces: `AttributeComponentFn`, `LayeredAttributeComponentFn<L>`, `AttributeStylesApi`, `AttributeStylesApiWithLayers<L>`, `AttributeStylesWithUtilsApi<U>`, `AttributeStylesWithUtilsApiLayered<U, L>` (all exported from `styles.ts`); six new `createStyles()` overloads keyed on the literal `mode: 'attribute'`.

- [ ] **Step 1: Remove the dead `ComponentConfigInputAttribute` import**

In `packages/typestyles/src/styles.ts`, remove `ComponentConfigInputAttribute` from the type-only import block at the top (it imports many types from `./types` — just delete that one line from the list).

- [ ] **Step 2: Add the `Attribute*` API types**

Insert directly after the closing brace of `StylesWithUtilsApi<U>` (i.e. right after the `};` that ends the block starting `export type StylesWithUtilsApi<U extends StyleUtils> = {`, before the `/** Create a utility-aware styles API ... */` JSDoc for `createStylesWithUtils`):

```ts
// ---------------------------------------------------------------------------
// mode: 'attribute' — dimensioned styles.component() returns { className, attrs, props }.
// No slots overload exists on any of these — passing `slots` is a compile error under a
// mode: 'attribute' instance. See specs/attribute-driven-variants.md.
// ---------------------------------------------------------------------------

export type AttributeComponentFn = {
  <const V extends VariantDefinitions>(
    namespace: string,
    config: ComponentConfigInput<V>,
  ): ComponentAttrsReturn<V>;
  <const K extends string>(
    namespace: string,
    config: FlatComponentConfigInput<K>,
  ): FlatComponentReturn<K>;
};

export type LayeredAttributeComponentFn<L extends string> = {
  <const V extends VariantDefinitions>(
    namespace: string,
    config: ComponentConfigInput<V>,
    options: LayerOption<L>,
  ): ComponentAttrsReturn<V>;
  <const K extends string>(
    namespace: string,
    config: FlatComponentConfigInput<K>,
    options: LayerOption<L>,
  ): FlatComponentReturn<K>;
};

export type AttributeStylesApi = Omit<StylesApi, 'component' | 'withUtils'> & {
  component: AttributeComponentFn;
  withUtils: <U extends StyleUtils>(utils: U) => AttributeStylesWithUtilsApi<U>;
};

export type AttributeStylesApiWithLayers<L extends string> = Omit<
  StylesApiWithLayers<L>,
  'component' | 'withUtils'
> & {
  component: LayeredAttributeComponentFn<L>;
  withUtils: <U extends StyleUtils>(utils: U) => AttributeStylesWithUtilsApiLayered<U, L>;
};

export type AttributeStylesWithUtilsApi<U extends StyleUtils> = Omit<
  StylesWithUtilsApi<U>,
  'component'
> & {
  component: AttributeComponentFn;
};

export type AttributeStylesWithUtilsApiLayered<U extends StyleUtils, L extends string> = Omit<
  StylesWithUtilsApiLayered<U, L>,
  'component'
> & {
  component: LayeredAttributeComponentFn<L>;
};
```

- [ ] **Step 3: Add the six new `createStyles()` overloads, before the existing generic ones**

The literal `mode: 'attribute'` overloads must come **before** the general overloads in declaration order — TypeScript picks the first structurally-matching overload, and a `{ mode: 'attribute', ... }` options object also structurally satisfies the general `CreateStylesInput`-based overloads.

Insert immediately before `export function createStyles<const L extends readonly string[], U extends StyleUtils>(` (the current first overload):

```ts
export function createStyles<const L extends readonly string[], U extends StyleUtils>(
  options: Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & {
    mode: 'attribute';
    layers: L;
    tokenLayer?: L[number];
    utils: U;
  },
): AttributeStylesWithUtilsApiLayered<U, L[number]>;

export function createStyles<U extends StyleUtils>(
  options: Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & {
    mode: 'attribute';
    layers: CascadeLayersObjectInput;
    tokenLayer?: string;
    utils: U;
  },
): AttributeStylesWithUtilsApiLayered<U, string>;

export function createStyles<U extends StyleUtils>(
  options: Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & { mode: 'attribute'; utils: U },
): AttributeStylesWithUtilsApi<U>;

export function createStyles<const L extends readonly string[]>(
  options: Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & {
    mode: 'attribute';
    layers: L;
    tokenLayer?: L[number];
  },
): AttributeStylesApiWithLayers<L[number]>;

export function createStyles(
  options: Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & {
    mode: 'attribute';
    layers: CascadeLayersObjectInput;
    tokenLayer?: string;
  },
): AttributeStylesApiWithLayers<string>;

export function createStyles(
  options: Partial<Omit<ClassNamingConfig, 'cascadeLayers'>> & { mode: 'attribute' },
): AttributeStylesApi;
```

Leave the six existing overloads and the implementation signature exactly as they are — the implementation signature's return-type union (`StylesApi | StylesApiWithLayers<string> | StylesWithUtilsApi<StyleUtils> | StylesWithUtilsApiLayered<StyleUtils, string>`) does not need the `Attribute*` types added to it, because `AttributeStylesApi` etc. are structurally assignable from the same runtime object `buildStylesRuntimeApi`/`createStylesWithUtils`/`createStylesWithUtilsLayered` already build — the overload declarations are what callers see; the implementation's own internal typing is unaffected. Do not change `buildStylesRuntimeApi`, `createStylesWithUtils`, or `createStylesWithUtilsLayered` — the runtime object shape is identical regardless of `mode`; only `component.ts`'s `createComponent` (already updated in Tasks 3–5) changes behavior based on `classNaming.mode`.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter typestyles typecheck`
Expected: If this fails with an error about `buildStylesRuntimeApi`'s return statement not being assignable to a wider expected type, it means the new overloads' declared return types aren't being satisfied by the shared runtime builder's `as StylesApi`/`as StylesApiWithLayers<string>` casts when called with `mode: 'attribute'`. If so, this is expected and fine — TypeScript only checks that _calls_ to `createStyles` resolve to a matching overload and that the _implementation signature_ (not each individual overload) is compatible with what the function body returns; the implementation signature's existing return type already covers this. If you see an actual error here, re-read this step — do not add `mode`-conditional branching to `buildStylesRuntimeApi` to fix it; the fix is almost always a typo in one of the new overload's option types not matching `Partial<Omit<ClassNamingConfig, 'cascadeLayers'>>` shape.

- [ ] **Step 5: Add the compile-only type-shape fixture**

Create `packages/typestyles/src/component-mode-shapes.typecheck.ts` (included in `tsc --noEmit` via `tsconfig.json`'s `src` include, same convention as `computed-style-keys.typecheck.ts`):

```ts
/**
 * Compile-only fixtures (included in `tsc --noEmit`, not shipped in the bundle entry).
 * Verifies createStyles({ mode: 'attribute' }) narrows styles.component()'s return type and
 * rejects `slots` — see specs/attribute-driven-variants.md.
 */
import { createStyles } from './styles';

const { styles: attributeStyles } = createStyles({ mode: 'attribute' });

export function _attributeComponentReturnsAttrsResult() {
  const button = attributeStyles.component('shape-button', {
    base: { padding: '8px' },
    variants: { variant: { primary: { color: 'blue' } } },
  });
  const b = button({ variant: 'primary' });
  // Only compiles if `b` is ComponentAttrsResult, not a plain string.
  return b.attrs;
}

export function _attributeComponentRejectsSlots() {
  // @ts-expect-error — `slots` has no matching overload under mode: 'attribute'.
  return attributeStyles.component('shape-dialog', {
    slots: ['root', 'trigger'],
    base: { root: { display: 'grid' } },
  });
}

const { styles: bemStyles } = createStyles({ mode: 'bem' });

export function _bemComponentReturnsPlainString() {
  const button = bemStyles.component('shape-bem-button', {
    base: { padding: '8px' },
    variants: { variant: { primary: { color: 'blue' } } },
  });
  // Only compiles if this is a plain string (mode: 'bem' needs no new return type).
  const cls: string = button({ variant: 'primary' });
  return cls;
}

export function _bemComponentAcceptsSlots() {
  return bemStyles.component('shape-bem-dialog', {
    slots: ['root', 'trigger'],
    base: { root: { display: 'grid' } },
  });
}
```

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter typestyles typecheck`
Expected: PASS. If `_attributeComponentRejectsSlots` does NOT produce a type error (the `@ts-expect-error` itself errors as unused), re-check that `AttributeStylesApi['component']`'s type (`AttributeComponentFn`) truly has no `slots`-accepting overload.

- [ ] **Step 7: Run the full test suite**

Run: `pnpm --filter typestyles test`
Expected: PASS (no runtime behavior changed in this task, only types)

- [ ] **Step 8: Commit**

```bash
git add packages/typestyles/src/styles.ts packages/typestyles/src/component-mode-shapes.typecheck.ts
git commit -m "$(cat <<'EOF'
feat: add AttributeStylesApi types and createStyles mode: 'attribute' overloads

createStyles({ mode: 'attribute' }) now returns a styles object whose
component() only accepts the dimensioned config shape (returning
ComponentAttrsReturn) or flat configs — no slots overload exists, so
passing slots is a compile-time error, not just a runtime one. mode:
'bem' needs no new types (plain-string return, same as every other
mode). See specs/attribute-driven-variants.md's "Types" section.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `create-type-styles.ts` — mirror the `mode: 'attribute'` overloads

**Files:**

- Modify: `packages/typestyles/src/create-type-styles.ts`

**Interfaces:**

- Consumes: `AttributeStylesApi`, `AttributeStylesApiWithLayers<L>`, `AttributeStylesWithUtilsApi<U>`, `AttributeStylesWithUtilsApiLayered<U, L>` from `styles.ts` (Task 6).
- Produces: `createTypeStyles({ mode: 'attribute', ... })` returns `{ styles: Attribute*, tokens, global }`.

- [ ] **Step 1: Add the new imports**

In `packages/typestyles/src/create-type-styles.ts`, change:

```ts
import type {
  StylesApi,
  StylesApiWithLayers,
  StylesWithUtilsApi,
  StylesWithUtilsApiLayered,
} from './styles';
```

to:

```ts
import type {
  StylesApi,
  StylesApiWithLayers,
  StylesWithUtilsApi,
  StylesWithUtilsApiLayered,
  AttributeStylesApi,
  AttributeStylesApiWithLayers,
  AttributeStylesWithUtilsApi,
  AttributeStylesWithUtilsApiLayered,
} from './styles';
```

- [ ] **Step 2: Add six new `createTypeStyles` overloads before the six existing ones**

Insert immediately before `export function createTypeStyles<U extends StyleUtils>(\n  options: NamingPartial & { utils: U },\n)` (the current first overload):

```ts
export function createTypeStyles<U extends StyleUtils>(
  options: NamingPartial & { mode: 'attribute'; utils: U },
): { styles: AttributeStylesWithUtilsApi<U>; tokens: TokensApi; global: GlobalApiUnlayered };

export function createTypeStyles<
  const L extends readonly [string, ...string[]],
  U extends StyleUtils,
>(
  options: NamingPartial & {
    mode: 'attribute';
    layers: L;
    tokenLayer: L[number];
    utils: U;
  } & GlobalLayerOption<L[number]>,
): {
  styles: AttributeStylesWithUtilsApiLayered<U, L[number]>;
  tokens: TokensApi;
  global: GlobalApiLayered;
};

export function createTypeStyles<U extends StyleUtils>(
  options: NamingPartial & {
    mode: 'attribute';
    layers: CascadeLayersObjectInput;
    tokenLayer: string;
    utils: U;
  } & GlobalLayerOption,
): {
  styles: AttributeStylesWithUtilsApiLayered<U, string>;
  tokens: TokensApi;
  global: GlobalApiLayered;
};

export function createTypeStyles(options: NamingPartial & { mode: 'attribute' }): {
  styles: AttributeStylesApi;
  tokens: TokensApi;
  global: GlobalApiUnlayered;
};

export function createTypeStyles<const L extends readonly [string, ...string[]]>(
  options: NamingPartial & {
    mode: 'attribute';
    layers: L;
    tokenLayer: L[number];
  } & GlobalLayerOption<L[number]>,
): { styles: AttributeStylesApiWithLayers<L[number]>; tokens: TokensApi; global: GlobalApiLayered };

export function createTypeStyles(
  options: NamingPartial & {
    mode: 'attribute';
    layers: CascadeLayersObjectInput;
    tokenLayer: string;
  } & GlobalLayerOption,
): { styles: AttributeStylesApiWithLayers<string>; tokens: TokensApi; global: GlobalApiLayered };
```

Leave the existing six overloads and the implementation signature/body untouched — same reasoning as Task 6, Step 3: `createTypeStyles`'s body just forwards to `createStyles(...)`, whose runtime shape is unaffected by `mode`.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter typestyles typecheck`
Expected: PASS

- [ ] **Step 4: Add a quick regression test**

Add to `packages/typestyles/src/create-type-styles.test.ts` — first open the file to see its existing test structure and match it, then add:

```ts
it('createTypeStyles({ mode: "attribute" }) returns an attrs-returning styles API', () => {
  const { styles } = createTypeStyles({ mode: 'attribute', scopeId: 'cts-attr' });
  const btn = styles.component('tbtn', {
    base: { padding: '8px' },
    variants: { variant: { primary: { color: 'blue' } } },
  });
  expect(btn({ variant: 'primary' }).attrs).toEqual({ 'data-variant': 'primary' });
});
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter typestyles test -- create-type-styles`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/typestyles/src/create-type-styles.ts packages/typestyles/src/create-type-styles.test.ts
git commit -m "$(cat <<'EOF'
feat: mirror mode: 'attribute' overloads on createTypeStyles

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `index.ts` — export the new public types

**Files:**

- Modify: `packages/typestyles/src/index.ts`

**Interfaces:**

- Consumes: `AttributeStylesApi`, `AttributeStylesApiWithLayers`, `AttributeComponentFn`, `LayeredAttributeComponentFn` from `styles.ts`.

- [ ] **Step 1: Add the new type exports, mirroring the existing ones**

In `packages/typestyles/src/index.ts`, change:

```ts
export type {
  StylesApi,
  StylesApiWithLayers,
  CreateStylesInput,
  LayerOption,
  LayeredComponentFn,
} from './styles';
```

to:

```ts
export type {
  StylesApi,
  StylesApiWithLayers,
  CreateStylesInput,
  LayerOption,
  LayeredComponentFn,
  AttributeStylesApi,
  AttributeStylesApiWithLayers,
  AttributeComponentFn,
  LayeredAttributeComponentFn,
} from './styles';
```

(`ClassNamingMode` is already exported from `./class-naming` at line 37 of `index.ts` — it automatically includes `'attribute'`/`'bem'` now, no change needed there. `StylesWithUtilsApi`/`StylesWithUtilsApiLayered` and their `Attribute*` counterparts are intentionally NOT exported, matching the existing convention that only the non-utils shapes are part of the public surface.)

- [ ] **Step 2: Typecheck and build**

Run: `pnpm --filter typestyles typecheck && pnpm --filter typestyles build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/typestyles/src/index.ts
git commit -m "$(cat <<'EOF'
feat: export AttributeStylesApi types from the package entry

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Docs — update the attribute-driven-variants section, add a BEM section

**Files:**

- Modify: `docs/content/docs/components.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update the existing "Attribute-driven variants" section**

In `docs/content/docs/components.md`, replace the whole section (currently starting `## Attribute-driven variants` and running through the "Trade-offs" bullet list, i.e. everything from `## Attribute-driven variants` up to but not including `## Migration quick-start`) with:

````md
## Attribute-driven variants

Some design systems want variant state expressed as `data-*` attributes on the DOM (Radix/shadcn-style: one stable class, `data-variant`/`data-size` legible in the markup) rather than as discrete classes. Set `mode: 'attribute'` on `createStyles`/`createTypeStyles` and every dimensioned `styles.component()` call from that instance compiles each `variants` option to a `&[data-{dimension}="{option}"]` selector scoped under the single `base` class, instead of its own class:

```ts
const { styles } = createStyles({ mode: 'attribute' });

const button = styles.component('button', {
  base: { padding: '8px 16px', borderRadius: '6px' },
  variants: {
    variant: {
      primary: { backgroundColor: '#0066ff', color: '#fff' },
      secondary: { backgroundColor: '#6b7280', color: '#fff' },
    },
    size: {
      small: { fontSize: '14px' },
      large: { fontSize: '18px' },
    },
  },
  defaultVariants: { variant: 'primary', size: 'small' },
});

const b = button({ variant: 'primary', size: 'small' });
b.className; // "button-base"
b.attrs; // { 'data-variant': 'primary', 'data-size': 'small' }
b.props; // { className: 'button-base', 'data-variant': 'primary', 'data-size': 'small' }

<button {...b.props}>...</button>;
// <button class="button-base" data-variant="primary" data-size="small">
```
````

`String(b)` / template-literal coercion and `cx(b, 'extra')` still return `"button-base"`, same as a plain class string.

Boolean dimensions (option keys exactly `{ true, false }`) are presence-based rather than value-matched: `true` compiles to `&[data-disabled]` and sets `data-disabled` with an empty value; `false` compiles to `&:not([data-disabled])` and omits the attribute entirely.

```ts
variants: {
  disabled: {
    true: { opacity: 0.5, cursor: 'not-allowed' },
    false: {},
  },
},
```

`compoundVariants` still work — each condition compiles to a single combined attribute selector (`.button-base[data-variant="primary"][data-size="large"]`) with no extra compound class and no runtime matching; an array of allowed values for one dimension (`{ tone: ['success', 'warning'], size: 'lg' }`) compiles to a `:is(...)` group ANDed with the rest of the condition.

`mode` is an instance-wide setting on `createStyles`/`createTypeStyles`, like `semantic`/`hashed`/`compact`/`atomic` — there is no per-component override. A design system that wants both attribute-based and class-based (or BEM-based) components creates two instances.

**Trade-offs:**

- No per-option class hooks — `button['variant-primary']` doesn't exist in attribute mode, since there's no discrete class to expose. `button.base` still exposes the single base class.
- Only the plain dimensioned config (`base` / `variants` / `compoundVariants` / `defaultVariants`) supports `mode: 'attribute'` — not `slots` and not the flat (non-dimensioned) config shape. Passing `slots` under a `mode: 'attribute'` instance is a compile-time error. See ["BEM variant naming"](#bem-variant-naming) below for multi-part components.
- Attribute names are the dimension name verbatim (`data-{dimension}`), not kebab-cased. This matters only for multi-word camelCase dimension names (e.g. a dimension named `fontWeight` renders as `data-fontweight` in the DOM, since HTML lowercases attribute names on write) — it won't round-trip through `element.dataset.fontWeight`, which expects the kebab form `data-font-weight`. Single-word dimension names (`variant`, `size`, `tone`, `intent`) are unaffected.

## BEM variant naming

Some design systems author class names as BEM (Block Element Modifier). Set `mode: 'bem'` and dimensioned/slot `styles.component()` variants compile to BEM modifier classes instead of the default `{namespace}-{dimension}-{option}` naming:

```ts
const { styles } = createStyles({ mode: 'bem' });

const button = styles.component('button', {
  base: { padding: '8px 16px', borderRadius: '6px' },
  variants: {
    variant: {
      primary: { backgroundColor: '#0066ff', color: '#fff' },
      secondary: { backgroundColor: '#6b7280', color: '#fff' },
    },
    size: {
      small: { fontSize: '14px' },
      large: { fontSize: '18px' },
    },
  },
  compoundVariants: [
    { variants: { variant: 'primary', size: 'large' }, style: { fontWeight: 700 } },
  ],
  defaultVariants: { variant: 'primary', size: 'small' },
});

button({ variant: 'primary', size: 'large' });
// "button button--primary button--large"

button.base; // "button" — no "-base" suffix; the bare block class IS the base state
button['variant-primary']; // "button--primary" — no dimension name in the modifier
```

Compound variants compile to a chained modifier-class selector (`.button--primary.button--large`) with no synthetic compound class and no runtime matching — the browser resolves it once both modifier classes are present, the same way `mode: 'attribute'` handles compounds via chained attribute selectors.

**Multi-part components** work via `slots`, mapping onto the `root`/`trigger`/`content` convention already used elsewhere in this doc: the `root` slot is the bare block class; every other slot is a BEM element (`block__element`):

```ts
const dialog = styles.component('dialog', {
  slots: ['root', 'trigger', 'content'],
  base: { root: { display: 'grid' }, trigger: { cursor: 'pointer' } },
  variants: {
    size: {
      sm: { trigger: { fontSize: '12px' }, content: { padding: '8px' } },
      lg: { trigger: { fontSize: '16px' }, content: { padding: '12px' } },
    },
  },
});

dialog({ size: 'lg' });
// { root: "dialog", trigger: "dialog__trigger dialog__trigger--lg", content: "dialog__content dialog__content--lg" }
```

**The collision caveat:** BEM has no dimension namespace, so two _different_ dimensions producing the same option string collide on the identical class name (e.g. `intent: 'primary'` and `theme: 'primary'` both want `button--primary`). This is inherent to BEM, not a typestyles limitation — `styles.component()` warns in dev when it happens, rather than silently letting one CSS rule clobber the other in the cascade. Choose non-colliding option names across a component's dimensions.

Like `mode: 'attribute'`, `mode: 'bem'` is an instance-wide setting — no per-component override, and mutually exclusive with the other four `ClassNamingMode` values in one `createStyles()` instance. `styles.class()` and flat (non-dimensioned) `styles.component()` configs are unaffected by `mode: 'bem'` — they name exactly as they would under `semantic` mode.

````

- [ ] **Step 2: Spot-check the doc renders correctly**

Run: `pnpm --filter docs dev` (the docs package, `docs/package.json`, is an Astro site named `docs`) and visually confirm the two sections render without broken code fences at whatever local URL Astro prints (typically `http://localhost:4321`). If running the dev server isn't practical in this environment, at minimum re-read the edited file to confirm every ``` fence is paired and run `pnpm --filter docs lint`.

- [ ] **Step 3: Commit**

```bash
git add docs/content/docs/components.md
git commit -m "$(cat <<'EOF'
docs: update attribute-driven-variants section, add BEM variant naming

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
````

---

### Task 10: Changesets

**Files:**

- Modify: `.changeset/attribute-driven-variants.md`
- Create: `.changeset/bem-variant-mode.md`

**Interfaces:** none.

- [ ] **Step 1: Rewrite the pending attribute-driven-variants changeset**

Replace the entire contents of `.changeset/attribute-driven-variants.md` with:

```md
---
'typestyles': minor
---

`variantStrategy: 'attribute'` (from the unreleased PR #130) is now `createStyles({ mode: 'attribute' })` / `createTypeStyles({ mode: 'attribute' })` — an instance-wide setting instead of a per-component field, matching how `semantic`/`hashed`/`compact`/`atomic` already work. Every dimensioned `styles.component()` call from that instance compiles `variants` to `&[data-{dimension}="{option}"]` selectors and returns `{ className, attrs, props }`; `slots` is rejected at the type level. `variantStrategy`/`defaultVariantStrategy` no longer exist. See `specs/attribute-driven-variants.md`.
```

- [ ] **Step 2: Add the new bem-variant-mode changeset**

Create `.changeset/bem-variant-mode.md`:

```md
---
'typestyles': minor
---

Add `mode: 'bem'` to `createStyles`/`createTypeStyles`: dimensioned and slot `styles.component()` variants compile to BEM modifier classes (`block--modifier`, `block__element--modifier`) instead of the default `{namespace}-{dimension}-{option}` naming. The base/root class drops the `-base` suffix (the bare block class is the base state). Compound variants compile to chained modifier-class selectors with no synthetic class. Dev mode warns when two dimensions would produce the same modifier class name. See `specs/bem-variant-mode.md`.
```

- [ ] **Step 3: Verify changeset format**

Run: `pnpm changeset status` (the root `package.json` has `"changeset": "changeset"`, wrapping `@changesets/cli`)
Expected: Both changesets are recognized, no format errors.

- [ ] **Step 4: Commit**

```bash
git add .changeset/attribute-driven-variants.md .changeset/bem-variant-mode.md
git commit -m "$(cat <<'EOF'
docs: update changesets for the mode relocation and new bem mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Full validation and bundle-size budget

**Files:**

- Modify: `packages/typestyles/scripts/check-bundle-size.mjs` (only the `INDEX_GZIP_BUDGET` constant, if needed)

**Interfaces:** none.

- [ ] **Step 1: Run the full repo validation suite**

Run: `pnpm typecheck && pnpm --filter typestyles test && pnpm --filter typestyles lint`
Expected: All PASS. If `lint` fails, fix the reported issues before proceeding (do not disable rules).

- [ ] **Step 2: Build and check the bundle-size budget**

Run: `pnpm --filter typestyles build`
Expected: Build succeeds; the build script runs `check-bundle-size.mjs` automatically and prints the actual gzip size, e.g. `[typestyles:bundle-size] index.js gzip: NNNNN bytes (budget 20700)`.

- [ ] **Step 3: Bump the budget if the build failed on size, matching the existing comment convention**

If Step 2's build failed with "Main entry exceeds gzip budget by N bytes", open `packages/typestyles/scripts/check-bundle-size.mjs` and update:

```js
const INDEX_GZIP_BUDGET = 20_700; // +~700B for attribute-driven variants (variantStrategy: 'attribute')
```

to a new value comfortably above the reported actual size (round up to the nearest 100 bytes), with an updated comment, e.g.:

```js
const INDEX_GZIP_BUDGET = 21_600; // +~900B for mode: 'attribute' relocation + mode: 'bem'
```

(Use the actual reported size from Step 2's output to pick the real number — do not guess.)

- [ ] **Step 4: Re-run the build to confirm it passes**

Run: `pnpm --filter typestyles build`
Expected: PASS

- [ ] **Step 5: Run the full test suite one more time end-to-end**

Run: `pnpm typecheck && pnpm --filter typestyles test`
Expected: PASS

- [ ] **Step 6: Commit (only if the budget changed)**

```bash
git add packages/typestyles/scripts/check-bundle-size.mjs
git commit -m "$(cat <<'EOF'
chore: bump bundle-size budget for mode: 'bem' + mode: 'attribute' relocation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

If the budget did not need to change, skip this commit — there's nothing to commit.

---

## Post-plan: finishing the branch

Once all 11 tasks are complete and validated, use the `superpowers:finishing-a-development-branch` skill to decide how to integrate this work (merge, PR, or further cleanup) — do not push or open a PR on your own initiative.
