# Semantic Default + Attribute Mode (Design-System Ready)

Make TypeStyles' default class naming collision-safe and BEM-readable, and
make `mode: 'attribute'` a first-class design-system mode (slots, kebab-case
attrs, layers-first override story) so systems like **var-ui** can ship
debuggable HTML/CSS with a typed override DX — without fighting specificity.

**Status:** not started. Ships as a TypeStyles minor (`0.10` proposed) —
pre-1.0 breaking change for `mode: 'semantic'` class strings and attribute
base-class naming. Tracked as a new P6 / follow-on P5 item in
`IMPROVEMENTS.md` once this spec is accepted.

**Motivation:** var-ui is the reference design system for TypeStyles. Its
typed theming work (`styles.override()` + theme `components` config) wants:

1. Readable, unambiguous public class names when a system stays on discrete
   classes.
2. Attribute-driven variants (one stable class + `data-*` state) when a system
   wants shadcn/Radix-style markup — with cascade layers handling override
   precedence so authors never hand-tune selector specificity.

This spec is the engine half of that. var-ui consumption (switching runtime
to `mode: 'attribute'`, `overrides` layer, recipe wrappers) is a separate
var-ui roadmap item after this ships.

---

## Goals

1. **New `semantic` default** — implement as a built-in `classNameTemplate`
   preset (same mechanism as `mode: 'bem'`), producing dimension-namespaced
   modifiers so two dimensions never share a class string and applying the
   same block/modifier grammar to flat components.
2. **Attribute mode completeness** — support slot + multi-slot recipes;
   kebab-case `data-*` names; align base/slot class names with the new
   semantic template; document layers as the override precedence model.
3. **Footgun removal** — no silent BEM-style collisions on the default path;
   no `data-fontweight` vs `dataset.fontWeight` traps; no "attribute mode
   can't do dialogs" gap that forces a second `createStyles` instance.

## Non-goals

- `styles.override()` / `__meta` (separate spec; this work is prerequisite
  substrate — see [Relationship to typed overrides](#relationship-to-typed-overrides)).
- Changing `mode: 'bem'` public output (strict BEM without dimension names
  remains available for consumers who want it and accept the collision
  caveat).
- Hashed / compact / atomic modes.
- Auto-migrating consumer snapshots (changelog + codemod guidance only).

---

## Part A — New `semantic` default naming

### Problem

Today `mode: 'semantic'` emits:

| Shape          | Example                  |
| -------------- | ------------------------ |
| Base           | `button-base`            |
| Variant        | `button-intent-primary`  |
| Slot           | `dialog-content`         |
| Slot + variant | `dialog-content-size-lg` |

That is readable, but:

- The `-base` suffix is noise in DevTools and in hand-written CSS.
- Slot naming (`dialog-content`) does not match the BEM element convention
  many CSS authors already know (`dialog__content`).
- The format is a one-off string builder, not the shared template path that
  `bem` / `template` already use — more code to keep in sync.

Plain `mode: 'bem'` is worse as a **default**: modifiers drop the dimension
(`button--primary`), so `intent: 'primary'` and `tone: 'primary'` collide.

### Design

Reimplement `mode: 'semantic'` as a built-in template preset
(`SEMANTIC_TEMPLATE`), routed through the same
`resolveClassNameTemplate` / `buildTemplateClassName` path as `bem`.

```ts
const SEMANTIC_TEMPLATE: ClassNameTemplate = (ctx) => {
  const block = ctx.element
    ? `${ctx.scope}${ctx.namespace}__${ctx.element}`
    : `${ctx.scope}${ctx.namespace}`;
  if (!ctx.modifier) return block;
  return ctx.dimension ? `${block}--${ctx.dimension}-${ctx.modifier}` : `${block}--${ctx.modifier}`;
};
```

Emitted examples (`scopeId: ''`):

| Shape                    | Before                                | After                                                 |
| ------------------------ | ------------------------------------- | ----------------------------------------------------- |
| Base                     | `button-base`                         | `button`                                              |
| Variant                  | `button-intent-primary`               | `button--intent-primary`                              |
| Compound                 | `button-compound-0` (synthetic class) | chained `.button--intent-primary.button--size-lg`     |
| Slot root                | `dialog-root`                         | `dialog` (`root` → `element: undefined`, same as BEM) |
| Slot element             | `dialog-content`                      | `dialog__content`                                     |
| Slot + variant           | `dialog-content-size-lg`              | `dialog__content--size-lg`                            |
| Flat base                | `card-base`                           | `card`                                                |
| Flat variant             | `card-elevated`                       | `card--elevated`                                      |
| With `scopeId: 'var-ui'` | `var-ui-button-base`                  | `var-ui-button`, `var-ui-button--intent-primary`      |

Rules:

- **No `-base` suffix** — the bare block class _is_ the base state (same as
  BEM).
- **`root` slot** maps to `element: undefined` (block class), matching BEM /
  template today.
- **Dimension always appears in modifiers** — collisions across dimensions
  are structurally impossible; the BEM collision warning does not apply to
  semantic.
- **Flat (non-dimensioned) components** use the same template with
  `dimension: undefined`: the `base` key is the block and each other key is a
  modifier (`card`, `card--elevated`).
- **`styles.class()`** keeps today's behavior: `${scope}${name}` with no
  template call. Note this means `styles.class('button')` and a dimensioned
  `styles.component('button')` base now resolve to the same string `button`;
  the existing unscoped-collision registry warning applies, and the migration
  guide calls this out.
- **Compound variants change strategy.** Today's default semantic emits a
  synthetic `namespace-compound-N` class per compound entry and appends it at
  runtime (`component.ts`, `classNamesAndRulesForProperties(..., 'compound-N')`;
  `component.test.ts` asserts `…-compound-0` in the class list). The template
  path instead emits a **chained modifier selector**
  (`.button--intent-primary.button--size-lg`) with no synthetic class and no
  runtime append — the browser resolves it once both modifier classes are
  present, matching `mode: 'bem'`. This is a behavior change (runtime class
  lists and public CSS), not a rename; snapshots and any CSS/tests referencing
  `*-compound-N` must migrate.

### Internal routing

```ts
export function resolveClassNameTemplate(cfg: ClassNamingConfig): ClassNameTemplate {
  if (cfg.mode === 'semantic') return SEMANTIC_TEMPLATE;
  if (cfg.mode === 'bem') return bemTemplate;
  if (cfg.mode === 'template' && cfg.classNameTemplate) return cfg.classNameTemplate;
  throw new Error(/* … */);
}
```

Dimensioned + flat + slot + multi-slot `styles.component()` under
`mode: 'semantic'`
use `createTemplateDimensionedComponent` /
`createSemanticFlatComponent` /
`createTemplateSlotComponent` /
`createTemplateMultiSlotComponent` (today's bem/template path), instead of
the hyphen `buildComponentClassName` path.

`mode: 'attribute'` uses the same `SEMANTIC_TEMPLATE` for its base, flat, and
slot class names, via a shared helper rather than through
`resolveClassNameTemplate` alone (attribute mode is not one of the two template
modes that function resolves). The attribute path always emits the block class
even when `base` is empty or omitted, so the returned `className` /
`ComponentAttrsResult` is never blank. `mode: 'bem'` and `mode: 'template'`
flat-component output stays unchanged; this avoids expanding those opt-in modes
beyond their current public contract.

`buildComponentClassName` remains for hashed/compact/atomic and for the
unchanged BEM/template flat paths.

`emittedComponentClassPrefix` moves both `semantic` and `attribute` from the
trailing-`-` prefix (`${scope}${namespace}-`) to the bare block form
(`${scope}${namespace}`, like BEM) so HMR invalidation targets the right rule
family.

`ClassNameContext` must allow `modifier` to be present while `dimension` is
undefined for a flat semantic modifier. Existing BEM/template calls continue
to pass both or neither.

### HMR invalidation

The new bare block prefix makes substring invalidation unsafe:
invalidating `button` must not remove `buttongroup`. Component HMR
invalidation must match the semantic/BEM class family at class boundaries:
the exact block plus `--` modifier and `__` element descendants. Preserve
the existing behavior for hashed/compact/atomic modes where no predictable
family exists.

### Breaking change policy

- Pre-1.0 minor bump (`0.9` → `0.10`).
- Changelog: table of before/after; note **three** breaks — changed class
  strings, changed compound strategy (no more `*-compound-N`), and kebab-cased
  `data-*` names — plus the newly supported attribute slots. Public classname
  snapshots and any hand-written CSS targeting old names must update.
- No long-lived `legacy-semantic` mode — var-ui and in-repo examples migrate
  in the same release train. External consumers on 0.x update or pin.
- CLI `snapshot-classnames` needs a **formula rewrite, not just fixture
  regen**: `semanticClassName` / `collectSuffixesFromConfig`
  (`packages/cli/src/snapshot-classnames.ts`) build `${ns}-${suffix}` names
  (including `base` and `compound-N`) and hyphen slot suffixes; they must emit
  the template's block/`__element`/`--modifier` grammar and drop compound
  entries from the public snapshot. `StylesBindingConfig.mode` also only knows
  `semantic|hashed|compact|atomic`, silently treating `bem`/`attribute`/
  `template` as semantic — align it while here. Regenerate the
  `@typestyles/eslint-plugin` fixtures (`button-base`,
  `button-intent-primary`, …) after the formula change.
- Add a `minor` Changesets entry for `typestyles`. Do not edit package
  versions or publish from the feature PR; release automation produces 0.10.

### Why not make semantic literally `mode: 'bem'`?

Strict BEM without dimension names remains a footgun for large design
systems. Semantic is the **safe default**; `bem` stays the opt-in for
authors who want conventional `--primary` modifiers and will police option
names themselves. `template` remains the escape hatch for SUIT / ITCSS /
house styles.

---

## Part B — Attribute mode: design-system complete

### Problems today

Documented and/or implemented gaps that block var-ui:

1. **No slots / multi-slot** — compile-time + runtime rejection. Most
   non-trivial design-system recipes are slotted (`alert`, `dialog`,
   `select`, …).
2. **Verbatim attribute names** — `data-${dimension}` with no kebab-case.
   `fontWeight` → `data-fontweight` in the DOM, which does not round-trip
   through `element.dataset.fontWeight` (expects `data-font-weight`).
3. **Base class still uses old semantic** — `button-base`. After Part A it
   should be `button` (and slot classes via `SEMANTIC_TEMPLATE`).
4. **Override story underspecified** — attribute selectors raise specificity
   (`0,2,0` for `.button[data-intent=primary]` vs `0,1,0` for `.button`).
   Without cascade layers, theme overrides fight recipe CSS. TypeStyles
   already has layers; this spec makes **layers the endorsed pairing**, not
   specificity hacks.

### Design principles

- Lean into CSS: one stable class per element; variant state is `data-*`
  on the element that owns the styles.
- TypeStyles does **not** know DOM nesting between slots, so it must not
  emit descendant selectors like `.dialog[data-size=lg] .dialog__content`
  (that would invent a tree). Instead, **every declared slot receives the
  active variant attrs**, while selectors are emitted only for slots with
  styles. This keeps the runtime result uniform without inventing a tree.
- Cascade layers decide override wins; authors do not bump specificity.

### B.1 — Kebab-case attribute names

```ts
function toDataAttributeName(dimension: string): string {
  // fontWeight → data-font-weight; intent → data-intent; already-kebab stays
  const kebab = dimension
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
  return `data-${kebab}`;
}
```

- CSS selectors and runtime `attrs` / `props` keys use the same string.
- Boolean dimensions unchanged in _shape_: presence
  (`[data-disabled]` / `:not([data-disabled])`), but the attribute name is
  kebab-cased from the dimension key.
- Dev warning if two different dimensions kebab to the same attribute name
  (pathological: `fontWeight` vs `font-weight` as separate keys).

Breaking for any consumer who relied on `data-fontWeight` / verbatim casing
(unlikely; currently broken for `dataset` anyway).

### B.2 — Slot + multi-slot support

**Multi-slot (no variants):** each slot is a class via `SEMANTIC_TEMPLATE`
(or scope-prefixed equivalent). Call returns the same
`Record<slot, string>` shape as other modes (attrs unnecessary).

**Slot-with-variants:**

1. Emit one base/element class per slot via `SEMANTIC_TEMPLATE` (no
   modifiers — variants are attributes).
2. Fold each variant option's **per-slot** style object into that slot's
   base as nested `&[data-…]` selectors (same merge technique as today's
   dimensioned attribute path).
3. Compound variants: AND the kebab attribute selectors on each slot that
   has compound styles (chained attrs on that slot's class), same as
   today's non-slot compound attribute compilation.
4. Runtime call returns `Record<Slots[number], ComponentAttrsResult>` —
   each slot gets `{ className, attrs, props, toString, … }` where `attrs`
   is the full active variant map (shared across slots for a given call).

```ts
const dialog = styles.component('dialog', {
  slots: ['root', 'trigger', 'content'],
  base: {
    root: { display: 'grid' },
    trigger: { cursor: 'pointer' },
    content: { padding: '8px' },
  },
  variants: {
    size: {
      sm: { content: { padding: '4px' } },
      lg: { content: { padding: '16px' }, trigger: { fontSize: '16px' } },
    },
  },
  defaultVariants: { size: 'sm' },
});

const d = dialog({ size: 'lg' });
// d.root.className    → "dialog"
// d.root.attrs        → { 'data-size': 'lg' }
// d.trigger.className → "dialog__trigger"
// d.trigger.attrs     → { 'data-size': 'lg' }
// d.content.className → "dialog__content"
// d.content.props     → { className: 'dialog__content', 'data-size': 'lg' }
```

Emitted CSS (illustrative):

```css
.dialog {
  display: grid;
}
.dialog__trigger {
  cursor: pointer;
}
.dialog__content {
  padding: 8px;
}
.dialog__content[data-size='sm'] {
  padding: 4px;
}
.dialog__content[data-size='lg'] {
  padding: 16px;
}
.dialog__trigger[data-size='lg'] {
  font-size: 16px;
}
```

**Why attrs on every slot (not root-only):** TypeStyles cannot know whether
`content` is a descendant of `root` in the host app's DOM. Putting attrs on
each declared slot keeps selectors local to that element — correct regardless
of markup tree, and matches class-mode's "modifier classes ride on the
element they style."

**Type-level:** lift the slots exclusion from the attribute-mode
`styles.component` overloads. Add slot overloads to `AttributeComponentFn`
(and the layered variant) returning `Record<Slots[number],
ComponentAttrsResult>` for slot-with-variants and `Record<Slots[number],
string>` for multi-slot-without-variants; name a `SlotAttrsReturn` type for
the former. Mirror the new overloads on the `createTypeStyles({ mode:
'attribute' })` surface (`create-type-styles.ts`). Flip
`component-mode-shapes.typecheck.ts` from `@ts-expect-error` (slots rejected)
to accepting slots. Remove the `assertSlotsSupportedForMode` attribute
rejection. Flat configs remain semantic-like (no attrs API), but adopt the new
semantic flat class strings.

**Utilities:** update the `withUtils` component-config transform to recurse
through slot base, variant, and compound style maps. Attribute slot overloads
must not type-check while nested utilities are interpreted as CSS properties.

**`cx` / string coercion:** each `ComponentAttrsResult` still stringifies to
its `className` only (attrs are not in the class string). Slot maps used
with `cx` should pass `d.trigger` (the result object) or
`d.trigger.className` explicitly — document both; prefer spreading
`d.trigger.props` in JSX.

### B.3 — Align attribute base classes with Part A

Attribute mode uses `SEMANTIC_TEMPLATE` for the single base class and for
every slot class (never the old `namespace-base` / `namespace-slot`
hyphen form).

| Mode                         | Base class      |
| ---------------------------- | --------------- |
| attribute (before)           | `button-base`   |
| attribute (after)            | `button`        |
| attribute + scopeId `var-ui` | `var-ui-button` |

Flat attribute components follow Part A's semantic flat naming (`card`,
`card--elevated`) while retaining their existing plain-string return API.

### B.4 — Cascade layers as the override model

Document (components + theming docs) the endorsed pairing:

```ts
const { styles, tokens } = createTypeStyles({
  mode: 'attribute',
  layers: ['tokens', 'components', 'overrides', 'utilities'] as const,
  tokenLayer: 'tokens',
});

styles.component('button', config, { layer: 'components' });

// Theme / consumer restyle — later layer wins regardless of
// `.button[data-intent=primary]` vs `.button` specificity.
styles.scope(
  { root: '.theme-acme', layer: 'overrides' },
  button.base, // stable public class; future: styles.override(button, …)
  { borderRadius: '999px' },
);
```

Rules of thumb for authors:

1. **Recipe CSS** → `components` layer.
2. **Theme / consumer overrides** → `overrides` layer (always after
   `components`).
3. **Per-instance utilities** → `utilities` (most explicit intent; still
   beats overrides).
4. Do **not** escalate specificity to win overrides when layers are on.

`styles.scope(…, button.base, …)` restyles only the base class, not a
`[data-…]` variant state. Variant-level overrides need hand-written attribute
selectors or the future `styles.override()` / `__meta` API — B.4's layer
guidance covers base-class overrides only.

Nested conflicting theme regions remain the existing `@scope` /
`styles.scope()` proximity story (see `specs/component-override-contract.md`)
— this spec does not re-solve that.

Attribute mode does not require layers to _function_, but design-system
docs should treat layers as required for theming, not optional polish.

---

## Relationship to typed overrides

Full design: [`styles-override-meta.md`](./styles-override-meta.md). This
spec is a prerequisite and constrains that API:

- `__meta` must record **selector fragments**, not only class names —
  attribute mode stores base class + per-dimension attribute selector
  builders; semantic/bem/template store class strings.
- Compound overrides remain conjunctions:
  - semantic: `.button--intent-primary.button--size-lg`
  - attribute: `.button[data-intent="primary"][data-size="lg"]`
- Slot overrides target the slot's own class (+ attrs in attribute mode),
  never invented descendant chains.

Ship Part A + B first (or in the same release train before override
emission tests); then implement `styles.override()` / `__tsMeta`.

---

## Migration guide (engine consumers)

### Semantic class renames

Update hand-written CSS, classname snapshots, and any string assertions:

```diff
- .button-base { … }
- .button-intent-primary { … }
- .dialog-content { … }
- .card-elevated { … }
+ .button { … }
+ .button--intent-primary { … }
+ .dialog__content { … }
+ .card--elevated { … }
```

Destructuring keys on `ComponentReturn` (`button['intent-primary']`) are
**unchanged** — those are logical keys, not emitted class strings. Only the
_values_ of those properties change.

Flat component keys are also unchanged (`card.base`, `card.elevated`); their
values migrate from `card-base` / `card-elevated` to `card` /
`card--elevated`.

Compound variants no longer produce a `*-compound-N` class in the runtime
class list — the CSS is a chained modifier selector. Remove any snapshot or
assertion that expects a synthetic compound class string.

### In-repo call sites to migrate (same PR)

- `packages/build-runner` extraction/tree-shaking fixtures asserting
  `…-button-base`.
- Docs demos and homepage hard-coding old strings
  (`docs/src/demos/getting-started-button.ts`, `docs/src/pages/index.astro`).
- `docs/netlify/functions/mcp-content.json` (regenerated from docs).
- JSDoc links to the deleted `attribute-driven-variants.md` /
  `bem-variant-mode.md` specs in `class-naming.ts`, `component.ts`,
  `types.ts`, `styles.ts`, and `specs/classname-template-mode.md`.
- `IMPROVEMENTS.md` — add a P6 (or follow-on P5) checklist item for this work.

### Attribute mode

- Spread `result.props` (or merge `attrs`) as today.
- Rename any reliance on `button-base` → `button`.
- CamelCase dimensions now emit kebab `data-*` names — update CSS and tests.
- Slot recipes: switch from "attribute mode unsupported" to the new
  `Record<slot, ComponentAttrsResult>` return; React wrappers should spread
  per-slot `.props`.

### var-ui (follow-up, not this PR)

After publishing the engine release:

1. `createTypeStyles({ mode: 'attribute', layers: […, 'overrides', …] })`.
2. Update React wrappers for `ComponentAttrsResult` / per-slot props.
3. Regenerate classname snapshots / public contract.
4. Proceed with typed `components` / `styles.override()` against attribute
   `__meta`.

---

## Testing

### Part A — semantic template

- Unit: `SEMANTIC_TEMPLATE` / `buildTemplateClassName` cases for base,
  dimensioned variant, flat modifier, root slot, non-root slot, scoped
  `scopeId`.
- Component snapshots: dimensioned + slot + multi-slot + compound under
  `mode: 'semantic'` (replace hyphen expectations).
- Compound behavior change: `component.test.ts` no longer expects a
  `*-compound-N` class in the runtime class list; CSS asserts a chained
  modifier selector.
- Bundle budget: confirm `scripts/check-bundle-size.mjs` still passes after
  template routing + attribute slot paths.
- Flat component snapshots: `card` + `card--elevated` under semantic and
  attribute; BEM/template flat snapshots unchanged.
- Collision: `intent: { primary }` + `tone: { primary }` emit _distinct_
  classes (no BEM collision warning).
- Regression: `mode: 'bem'` snapshots unchanged.
- HMR: invalidating `button` drops block/modifier/element rules without
  dropping `buttongroup`.
- ESLint plugin + CLI snapshot fixtures regenerated.

### Part B — attribute

- Kebab: `fontWeight` → `data-font-weight` in CSS, `attrs`, and `props`.
- Boolean + kebab still presence-based.
- Dev warning on kebab collisions.
- Slot-with-variants: CSS snapshot + runtime attrs on each slot.
- Multi-slot without variants: class map only.
- Compound variants with arrays (`:is(...)`) on slots.
- Type tests: slots overloads accepted under attribute mode; flat still
  excluded from attrs API as today.
- Utilities: slot base, variant, and compound styles expand correctly through
  both `utils` factory options and `withUtils`.
- Layers doc example (or integration test): override in `overrides` layer
  wins over higher-specificity recipe attribute selector in `components`.

### Docs

- `docs/content/docs/class-naming.md` — new semantic table; attribute
  slot section; kebab rule.
- `docs/content/docs/components.md` — rewrite attribute + semantic
  examples; remove "slots not supported".
- `docs/content/docs/theming-patterns.md` — layers + attribute override
  pairing.
- Restore / replace missing referenced specs
  (`attribute-driven-variants.md`, `bem-variant-mode.md`) with pointers to
  this doc + `classname-template-mode.md`, or fold their surviving content
  here so links stop 404.

---

## Implementation tasks

1. **Part A — `SEMANTIC_TEMPLATE`**
   - Add template; route `mode: 'semantic'`
     dimensioned/flat/slot/multi-slot through template-aware component
     creators.
   - Route attribute base/flat/slot naming through the same semantic preset.
   - Update `emittedComponentClassPrefix` and HMR matching for exact
     block/modifier/element families.
   - Fix all in-repo semantic expectations (unit, examples, docs).

2. **Part B — kebab attrs**
   - Shared `toDataAttributeName`; wire into selector + attrs emission;
     collision warning; tests.

3. **Part B — attribute slots**
   - Implement attribute slot + multi-slot creators; type overloads;
     remove assertSlotsSupportedForMode rejection for attribute.
   - Per-slot `ComponentAttrsResult` return; tests + docs.
   - Make utility expansion recurse through slot config shapes.

4. **Align attribute base naming** with `SEMANTIC_TEMPLATE`.

5. **Docs + IMPROVEMENTS.md**
   - Document layers pairing; changelog breaking notes; check off roadmap
     item.

6. **Add a minor Changesets entry** for `typestyles`; the release workflow
   publishes `0.10.0` (or the next minor) after merge.

---

## Explicit decisions (locked)

| Topic                  | Decision                                                         |
| ---------------------- | ---------------------------------------------------------------- |
| Default mode name      | Stay `'semantic'`; change _output_, not the mode id              |
| Strict BEM             | Remains `mode: 'bem'` (no dimension in modifier)                 |
| Legacy hyphen semantic | Not kept as a mode; migrate on 0.10                              |
| Flat semantic naming   | `card` base + `card--elevated` modifiers                         |
| Attribute slot attrs   | On every slot (not root-only / descendants)                      |
| Attribute naming       | Always kebab-case from dimension key                             |
| Override precedence    | Cascade layers (`overrides` after `components`), not specificity |
| `styles.override()`    | Out of scope here; metadata must be selector-aware               |

---

## Open follow-ups (explicitly deferred)

- Codemod for old semantic class strings in consumer CSS.
- `styles.override()` + `__meta` engine API (var-ui V7 dependency).
- Optional root-only attrs mode if a future recipe metadata format
  describes slot DOM ancestry (not planned).
