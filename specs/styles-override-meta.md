# `styles.override()` + Component `__tsMeta` Contract

Recipe-shaped, fully typed component restyling for any TypeStyles consumer —
override `base` / `variants` / `compoundVariants` (and per-slot blocks) with
the same style language as recipes (`VariantOptionStyle`), variant names
inferred from the recipe, **no class names in user code**.

This is the engine capability var-ui's typed theming DX
(`createDesignTheme({ components })`, `overrideComponent`) compiles down to.
It also stands alone for apps that call `styles.override` directly.

**Status:** implemented. Prerequisite
[`semantic-and-attribute-mode.md`](./semantic-and-attribute-mode.md) has
landed (PR #141) — semantic class shape + attribute-mode slot/kebab
completeness are in place so `__tsMeta` can record real selector fragments
for every supported mode.

**Supersedes (narrowly):** the "bulk config-object API" out-of-scope line in
[`component-override-contract.md`](./component-override-contract.md). The
two-tier model (Tier 1 component vars, Tier 2 class/`@scope` escape hatch)
remains; this spec adds the **primary typed config surface** on top of that
substrate.

---

## The DX

```ts
const button = styles.component('button', {
  base: { borderRadius: '6px' },
  variants: {
    intent: {
      primary: { backgroundColor: 'blue' },
      ghost: { backgroundColor: 'transparent' },
    },
    size: {
      sm: { fontSize: '12px' },
      lg: { fontSize: '16px' },
    },
  },
  defaultVariants: { intent: 'primary', size: 'sm' },
});

// App-global restyle
styles.override(button, {
  base: { borderRadius: '999px' },
  variants: {
    intent: {
      // ⌨ keys autocomplete from the recipe
      primary: { textTransform: 'uppercase' },
    },
  },
  compoundVariants: [
    {
      variants: { intent: 'primary', size: 'lg' },
      style: { letterSpacing: '0.05em' },
    },
  ],
});

// Theme-scoped (descendant prefix — see options below)
styles.override(
  button,
  { base: { boxShadow: 'none' } },
  { selectorPrefix: '.theme-acme', layer: 'overrides' },
);
```

Slot recipes keep their authoring shape:

```ts
styles.override(alert, {
  base: { root: { borderStyle: 'dashed' } },
  variants: { tone: { danger: { icon: { scale: '1.2' } } } },
});
```

---

## Goals

1. **Infer types from the recipe** — no registry, no codegen; works for any
   `styles.component()` return.
2. **Mode-aware emission** — semantic / bem / template / attribute (and flat /
   slot / multi-slot shapes) all work from one API via `__tsMeta`.
3. **Layers-first precedence** — overrides land in a later cascade layer;
   authors do not fight specificity (especially attribute selectors).
4. **Formalize the public surface** — `__tsMeta` (via `getComponentMeta`) is
   the machine-readable form of the classname / attribute contract that
   snapshots already defend.

## Non-goals

- Adding new variant _options_ to a recipe from an override (future).
- Per-mode style blocks inside overrides (use mode-aware tokens instead).
- Replacing `styles.scope()` — `@scope` remains the nested-theme proximity
  escape hatch; `override` does not invent proximity.
- Typed `c.vars()` access in override configs (phase 2; reserve `vars` key).
- Design-system sugar (`createDesignTheme`, themeable registries) — consumer
  of this API (var-ui), not this repo.
- Cross-instance override binding / runtime instance-id checks — see
  [Design point 5](#design-point-5--same-instance-by-convention).

---

## Part A — `__tsMeta` component metadata contract

### Why metadata (not string parsing)

Dimensioned components expose destructurable keys like
`button['intent-primary']`, but:

- Reconstructing `dimension → option` from emitted class strings is ambiguous
  under some naming modes and unnecessary when we already know the mapping at
  create time.
- Slot / multi-slot returns are class maps (or attrs results), not a flat
  dimensioned key space — there is nothing reliable to parse.
- Attribute mode has **no** per-option classes; variants are selector
  fragments (`[data-intent="primary"]`) under a base class.

So every `styles.component()` return attaches a **non-enumerable** metadata
blob at create time.

### Shape

Private key `__tsMeta` (consistent with compose meta `__tsCm`) — not an
enumerable `'__meta'` string that shows up in `Object.keys` / accidental
spreads. Public TypeScript accessor: `getComponentMeta(component)`.
`styles.override` reads it internally.

Discriminate on `kind` so emission does not guess at the `variants` shape:

```ts
type VariantSelectorMap = {
  /** dimension → option → selector fragment */
  [dimension: string]: { [option: string]: string };
};

type SlotVariantSelectorMap = {
  [slot: string]: VariantSelectorMap;
};

type ComponentMetaBase = {
  namespace: string;
  /**
   * Naming mode of the creating `styles` instance. Emission branches on this
   * (class conjunction vs attribute conjunction).
   */
  namingMode: ClassNamingMode;
};

/** Class modes: full class name without dot. Attribute: attr fragment only. */
type DimensionedComponentMeta = ComponentMetaBase & {
  kind: 'dimensioned';
  base: string;
  variants: VariantSelectorMap;
};

type FlatComponentMeta = ComponentMetaBase & {
  kind: 'flat';
  base: string;
  /** Flat variant key → class name (no dimensions). */
  variants: Record<string, string>;
};

type SlotComponentMeta = ComponentMetaBase & {
  kind: 'slot';
  slots: readonly string[];
  base: Record<string, string>;
  variants: SlotVariantSelectorMap;
};

type MultiSlotComponentMeta = ComponentMetaBase & {
  kind: 'multi-slot';
  slots: readonly string[];
  base: Record<string, string>;
  /** Multi-slot recipes have no variants. */
  variants?: undefined;
};

type ComponentMeta =
  | DimensionedComponentMeta
  | FlatComponentMeta
  | SlotComponentMeta
  | MultiSlotComponentMeta;
```

Notes:

- **Do not store compound recipe class names.** Compound _overrides_ always
  build conjunctions (and `:is()` groups) from the option selectors above.
- Boolean attribute options store the presence / negation fragments
  (`[data-disabled]`, `:not([data-disabled])`) already used by attribute
  emission.
- Kebab-cased attribute names (from
  `semantic-and-attribute-mode.md`) are what `__tsMeta` records — never the
  raw camelCase dimension string as an attribute name.
- Attach via `Object.defineProperty(fn, META_KEY, { value, enumerable: false })`,
  same pattern as `attachComposeMeta`. Works for callable objects **and**
  bare function returns (e.g. attribute-mode `SlotAttrsReturn`).

### Attachment sites

Every successful `styles.component()` creator path attaches meta before
return — including paths that today skip `attachComposeMeta` (attribute
dimensioned + attribute slot):

- dimensioned (semantic / bem / template / hashed / compact — class modes)
- dimensioned attribute
- flat
- slot-with-variants (all naming modes that support slots, including attribute)
- multi-slot
- atomic: still attach meta; base / variant entries may be space-separated
  class lists. Override emission targets the **first** class in each list for
  selector construction, or rejects atomic with a clear dev error in v1 —
  **decision: v1 supports semantic, bem, template, attribute; atomic /
  hashed / compact warn and no-op** (document; prefer warn + skip). Design
  systems (var-ui) will not use those modes for public recipes.

### Public contract

`getComponentMeta` / `__tsMeta` is **public API**. Renaming a namespace,
dimension, option, or slot that appears in meta is a breaking change under
the package's versioning rules — the same promise as the classname snapshot
lint, now with a structured surface. Snapshot tooling may later emit from
meta instead of scraping destructurable keys; not required for v1.

Export `getComponentMeta` (and the `ComponentMeta` / `Override*` types) from the
main `typestyles` entry alongside other public helpers. `createOverride` is
**internal** — not a public export; call `styles.override` on the creating
instance.

---

## Part B — `styles.override()`

### Signature

```ts
function override(
  component: ComponentReturn<V> | ComponentAttrsReturn<V> | /* slot / flat / multi */,
  config: OverrideConfigFor<typeof component>,
  options?: OverrideOptions,
): void;

type OverrideOptions<L extends string = string> = {
  /**
   * Selector prefix inserted before the component selector, e.g. `.theme-acme`.
   * Emits `.theme-acme .button--intent-primary { … }` (descendant combinator).
   * This is **not** CSS `@scope` — see `styles.scope()` for proximity.
   * Named `selectorPrefix` (not `scope`) to avoid colliding with `styles.scope`.
   */
  selectorPrefix?: string;
  /** Cascade layer name; must be on the instance's `layers` stack when set. */
  layer?: L;
};
```

When the styles instance is created with `layers`, type `layer` as
`L` from that stack (same pattern as layered `styles.scope` / `styles.class`).
`OverrideFn<L>` threads that constraint through `styles.override`.

### Override config shapes

Mirror recipe authoring, but style positions are {@link VariantOptionStyle}
(same as recipe option blocks — `CSSProperties | Record<string, unknown>`),
not strict `CSSProperties` alone. That keeps `[v.name]` / `--*` custom-property
keys and mixed nested-selector objects assignable the same way recipes are.
No `defaultVariants`. No new option keys in v1.

Style blocks go through the same `serializeStyle` path as `styles.scope` /
`styles.component` (cast at the boundary, same as `component.ts` today) —
nested selectors (`&:hover`), at-rules, and responsive object values (when the
instance has `breakpoints`) all work.

```ts
type OverrideConfig<V extends VariantDefinitions> = {
  base?: VariantOptionStyle;
  variants?: { [K in keyof V]?: { [O in keyof V[K]]?: VariantOptionStyle } };
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: VariantOptionStyle;
  }>;
  /** Reserved for phase 2 — typed component vars. */
  vars?: never;
};

type SlotOverrideConfig<Slots extends readonly string[], V> = {
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

/** Multi-slot: base styles only (no variants on the recipe). */
type MultiSlotOverrideConfig<Slots extends readonly string[]> = {
  base?: Partial<Record<Slots[number], VariantOptionStyle>>;
};

/** Flat: `{ base?: … } & Partial<Record<FlatKey, VariantOptionStyle>>`. */
type FlatOverrideConfig<K extends string> = {
  base?: VariantOptionStyle;
} & Partial<Record<Exclude<K, 'base'>, VariantOptionStyle>>;
```

### Design point 1 — typing by inference

Overloads recover `V` / slot unions from the component argument the same way
`ComponentVariants<T>` does. Unknown dimensions, options, or slots are type
errors. No registration step.

### Design point 2 — emission from `__tsMeta`

Pseudo-algorithm:

1. Read meta; if missing, dev warn and return.
2. Emit config entries in order: **base → variants → compounds** (source
   order within the overrides layer matches natural precedence).
3. For each entry:
   - Resolve target selector(s) from meta.
   - `serializeStyle(selector, styles, { breakpoints })`.
   - If `selectorPrefix`, wrap each selector as
     `${prefix} ${selector}` (descendant). Do **not** wrap in `@scope`.
   - If `layer`, require `cascadeLayers` on this instance (throw like
     `styles.scope` when missing), then `assertOwnLayer` + `applyLayerToRules`.
   - `insertRules` with stable keys that include prefix + layer + selector +
     property key so dedup / HMR / SSR extraction behave like other traffic.

**Class modes (semantic / bem / template):**

| Config entry                             | Selector                                               |
| ---------------------------------------- | ------------------------------------------------------ |
| `base`                                   | `.${meta.base}`                                        |
| `variants.intent.primary`                | `.${meta.variants.intent.primary}`                     |
| compound `{ intent: primary, size: lg }` | `.${a}.${b}` (conjunction of option classes)           |
| flat `elevated`                          | `.${meta.variants.elevated}`                           |
| multi-slot `base.root`                   | `.${meta.base.root}`                                   |
| slot `base.root`                         | `.${meta.base.root}`                                   |
| slot variant                             | `.${meta.variants.root.intent.primary}` (per-slot map) |

**Attribute mode:**

| Config entry              | Selector                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `base`                    | `.${meta.base}`                                                                    |
| `variants.intent.primary` | `.${meta.base}${meta.variants.intent.primary}` → `.button[data-intent="primary"]`  |
| compound                  | `.${meta.base}${fragA}${fragB}` → `.button[data-intent="primary"][data-size="lg"]` |
| slot variant on `icon`    | `.${meta.base.icon}${meta.variants.icon.tone.danger}`                              |

#### Compound array selections (`:is(...)`)

Recipe `compoundVariants` already allow OR lists per dimension
(`{ intent: ['primary', 'ghost'], size: 'lg' }`). Override compounds use the
**same emission algorithm** as recipe compounds:

- Single expected value → one selector fragment.
- Array of values → `:is(frag1, frag2, …)` for that dimension, ANDed with the
  other dimensions' fragments.

Examples:

| Mode      | Config                                         | Emitted selector                                                             |
| --------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| semantic  | `{ intent: ['primary', 'ghost'], size: 'lg' }` | `:is(.button--intent-primary, .button--intent-ghost).button--size-lg`        |
| attribute | same                                           | `.button:is([data-intent="primary"], [data-intent="ghost"])[data-size="lg"]` |

(Exact `:is()` placement should match the existing recipe compound helpers in
`component.ts` — do not invent a parallel expansion.)

Compound overrides **never** require the recipe's internal compound class
(attribute mode already has none; class modes may have compound classes for
the original recipe but overrides ignore them).

### Design point 3 — layers beat specificity

Attribute selectors are higher specificity than a bare class. That is fine
when overrides sit in a later `@layer`:

```
['tokens', 'components', 'overrides', 'utilities']
```

Document: pass `{ layer: 'overrides' }` (or the consumer's chosen name) for
theme/app overrides. Within the overrides layer, emission order (base →
variants → compounds) + conjunction specificity give the natural ordering.

`utilities` still beats overrides when that is the instance's intent.

**Dev guidance when layers are configured:**

- If `options.layer` is omitted and the stack includes `"overrides"`,
  `styles.override` **defaults to that layer** so callers cannot accidentally
  emit unlayered CSS that beats the entire `@layer` stack (including
  `utilities`).
- If the stack has layers but no `"overrides"` name, **`layer` is required** —
  omit it and `styles.override` throws (same class of footgun as emitting
  unlayered).
- If `layer` is set but the instance has no `layers`, **throw** (same error
  shape as `styles.scope`).

### Design point 4 — nested themes

`selectorPrefix: '.theme-acme'` is a descendant combinator. Nested
`.theme-beta` inside `.theme-acme` with both overriding the same recipe has
the same proximity footgun as Tier 2 plain CSS (`component-override-contract.md`).
**Do not** pretend `override` solves that — document:

1. Prefer Tier 1 component vars for nested-theme-sensitive properties.
2. Use `styles.scope({ root: '.theme-acme' }, …)` when proximity matters.
3. Optional later: `override(..., { scopeRoot: '.theme-acme' })` that emits
   `@scope` instead of a prefix — **out of scope for v1**.

### Design point 5 — same-instance by convention

`styles.override` always uses **this** styles instance's sheet, breakpoints,
and layer stack. Call it on the same `styles` that created the component.

No runtime instance-id check and no styles ref on `__tsMeta`. Design systems
enforce the binding by architecture: var-ui's single shared
`createTypeStyles` in `runtime.ts`, with `overrideComponent` /
`createDesignTheme({ components })` compiling to that instance's
`styles.override` (see var-ui `typed-component-theming.md`). Apps that call
`styles.override` directly are already on the creating instance.

Cross-instance misuse (component from `stylesA`, `stylesB.override(…)`) is
unsupported — document prominently in theming docs and the `styles.override`
JSDoc. Design systems must wrap the creating instance (var-ui pattern).

### Runtime validation (JS / typos)

In development, warn (do not throw) on:

- unknown dimension / option / slot / flat key vs `__tsMeta`
- missing `__tsMeta`
- unsupported `namingMode` (atomic / hashed / compact in v1)
- layered instance with no `options.layer` and no `"overrides"` layer in the
  stack (throws; when `"overrides"` exists it is the default)

Emit only the valid entries.

### Interaction with `styles.scope()`

| API                    | Use when                                                        |
| ---------------------- | --------------------------------------------------------------- |
| `styles.override`      | Typed, recipe-shaped bulk restyle; theme prefix + layer         |
| `styles.scope`         | Single class + `@scope` proximity; escape hatch / nested themes |
| Hand CSS / Tier 1 vars | Cheapest single-property or inheritance-correct nested themes   |

`override` may internally share serialization helpers with `scope`, but it
does not call `scope` for the default `selectorPrefix` path.

---

## Phase 2 (reserved, not v1)

Typed component vars in the override config:

```ts
styles.override(button, {
  vars: { background: tokens.color.accent.subtle },
});
```

Requires `c.vars()` declarations to surface on `ComponentReturn`'s type
parameters and in `__tsMeta`. Reserve the `vars` key in `OverrideConfig` as
`never` (or omit + document) so the name stays free.

---

## Testing

- **Meta attachment:** every creator path sets non-enumerable meta (including
  attribute dimensioned + attribute slot); shape snapshots per kind × naming
  mode (semantic, bem, template, attribute).
- **Type tests:** inference for dimensioned, attribute return, slot, flat,
  multi-slot; unknown keys fail to typecheck — enforced via
  `src/override.type-tests.ts` in `pnpm typecheck` (not only `@ts-expect-error`
  inside excluded `*.test.ts` files). Compound option values use
  `CompoundSelectionValue<VariantOptionKey<V, K>>` like recipe compounds.
- **Emission snapshots:** base / variant / compound / slot; with and without
  `selectorPrefix`; with and without `layer`.
- **Compound arrays:** `:is(...)` emission matches recipe compounds
  (semantic + attribute).
- **Attribute compounds:** `.button[data-intent="primary"][data-size="lg"]`.
- **Semantic compounds:** `.button--intent-primary.button--size-lg`.
- **Dev warnings:** unknown keys; missing meta; unsupported mode; layered
  instance without `layer`.
- **Extraction:** override rules appear in zero-runtime build extraction
  like other `insertRules` traffic (one integration smoke test).

## Docs

- New page or section under Components / Theming: "Typed component overrides".
- Cross-link from `component-override-contract.md` (bulk config now in-scope
  here; Tier 1/2 still primary for nested proximity).
- Cross-link from `semantic-and-attribute-mode.md` (this is the sibling).
- Update `IMPROVEMENTS.md` with a tracked item (under P6 follow-ons, or a new
  P5.x if scheduled).

## Implementation tasks

1. **`__tsMeta` + `getComponentMeta`** — types (kind-discriminated), attach
   helper, wire into all supported `styles.component` return paths.
2. **`styles.override`** — overloads, `OverrideConfig` types, emission
   (including compound `:is()`), options (`selectorPrefix`, `layer`),
   same-instance docs, layered-without-layer dev warn.
3. **Tests** — type-level + CSS snapshots + warning tests.
4. **Docs + IMPROVEMENTS + changelog**.
5. **var-ui follow-up** (other repo) — bump typestyles, add `overrides`
   layer, `overrideComponent` / `createDesignTheme({ components })`.

---

## Explicit decisions (locked)

| Topic                     | Decision                                                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Metadata key              | Non-enumerable `__tsMeta` (+ `getComponentMeta`); not enumerable `__meta`                                                                                                                                                                         |
| Meta shape                | Discriminated union on `kind` (dimensioned / flat / slot / multi-slot)                                                                                                                                                                            |
| Options naming            | `selectorPrefix` + `layer` — not `scope` (avoids `@scope` confusion)                                                                                                                                                                              |
| Compound overrides        | Conjunction of option selectors; arrays → `:is(...)` like recipe compounds; no new public classes                                                                                                                                                 |
| Attribute / slots         | Selectors local to the slot element; no invented descendant trees                                                                                                                                                                                 |
| Nested theme proximity    | Document footgun; use vars or `styles.scope`; no `@scope` in override v1                                                                                                                                                                          |
| Same-instance binding     | Document-only; design systems wrap the creating instance (var-ui pattern); no runtime check                                                                                                                                                       |
| Override HMR              | Vite injects `createOverrideHmrSlot` for `styles.override` / `createDesignTheme` / `overrideComponent` (including renamed + `import * as` bindings); dispose drops tracked `override:` keys; conflicting override CSS is always replaced (upsert) |
| Layer optional            | Optional like `scope`; default to `"overrides"` when that layer exists; throw if layered without `"overrides"` and no `{ layer }`; throw if `layer` set without `layers`                                                                          |
| Emission order            | base → variants → compounds                                                                                                                                                                                                                       |
| Style block type          | `VariantOptionStyle` (same as recipes), not strict `CSSProperties`                                                                                                                                                                                |
| `selectorPrefix` format   | Unconstrained string; callers own validity (no dev validation in v1)                                                                                                                                                                              |
| Atomic / hashed / compact | Unsupported in override v1 (dev warn + skip)                                                                                                                                                                                                      |
| New variant options       | Out of scope                                                                                                                                                                                                                                      |
| Typed `vars` in override  | Phase 2; reserve the name                                                                                                                                                                                                                         |

---

## Open questions

None — ready to implement.

---

## Relationship to other specs

| Spec                                | Relationship                                                               |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `semantic-and-attribute-mode.md`    | Prerequisite naming + attribute completeness (landed)                      |
| `component-override-contract.md`    | Tier 1/2 + `styles.scope` remain; bulk config deferred item closed by this |
| `classname-template-mode.md`        | Semantic/bem/template meta records template output class names             |
| var-ui `typed-component-theming.md` | Consumer sugar over this API; establishes same-instance by shared runtime  |
