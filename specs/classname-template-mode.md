# Generic Classname Template (`mode: 'template'`) — Design Spec

## The actual problem

`typestyles` ships several fixed class-naming conventions as `ClassNamingMode`
values: `semantic`, `hashed`, `compact`, `atomic`, `attribute`, and — as of
PR #132 — `bem` (`block__element--modifier`). Each new convention someone
wants (SUIT CSS, a prefixed/ITCSS scheme like `c-button--primary`, a house
style with different separators or casing) currently means a new named mode:
a new `ClassNamingMode` union member, new branches in
`emittedComponentClassPrefix`/`emittedClassName`/`buildSingleClassName`/
`buildComponentClassName`, and — for anything with real block/element/
modifier structure — a parallel trio of `create*DimensionedComponent`/
`create*SlotComponent`/`create*MultiSlotComponent` functions in
`component.ts`. BEM alone added ~250 lines of dedicated block/element/
modifier composition logic that only BEM uses.

This mirrors a problem `specs/token-name-template.md` already solved for CSS
custom property names: `tokens.create`'s `nameTemplate` option replaced what
would otherwise be an ever-growing set of naming flags with a single
`(ctx) => string` hook, closing the gap for migration/interop conventions
without a new code path per convention. `mode: 'template'` closes the same
gap for `styles.component()` class names — a design system that authors
SUIT CSS, a prefixed BEM variant, or any house convention should not have to
wait for `typestyles` to ship a named mode for it, or hand-roll `'&.foo'`
nested-selector keys the way `specs/attribute-driven-variants.md` and
`specs/bem-variant-mode.md` both identified as the pre-existing gap for their
conventions.

## Guiding principles

| Principle                                                                   | Rationale                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Function, not string tokens**                                             | A `'{block}__{element}--{modifier}'` token string can't express conditional logic (omit `__element` when absent), custom casing, or anything the token vocabulary didn't anticipate — the same reasoning `token-name-template.md` used to reject config flags for `nameTemplate`. One function covers every convention with one code path.                            |
| **BEM becomes a preset, not a parallel implementation**                     | `mode: 'bem'` is reimplemented internally as `mode: 'template'` plus a built-in `BEM_TEMPLATE` constant. This removes the duplicated block/element/modifier logic in `component.ts` and proves the template mechanism is expressive enough to cover a real convention before shipping it as the extensibility point. `mode: 'bem'`'s public behavior does not change. |
| **Scoped to structured naming, not every class**                            | Only dimensioned and slot/multi-slot `styles.component()` configs — the cases with real block/element/modifier structure — call `classNameTemplate`. `styles.class()` and flat (non-dimensioned) configs behave like `semantic`, unaffected — same as `bem`/`attribute` already do.                                                                                   |
| **Instance-level only**                                                     | `classNameTemplate` is set once via `createStyles`/`createTypeStyles`, like every other `mode`. No per-`styles.component()` override — a departure from `nameTemplate`'s per-namespace override, deliberately, since `mode` has never been a per-component knob for any existing naming mode.                                                                         |
| **Dev-mode collision detection generalizes, doesn't duplicate**             | BEM's existing `devWarnBemModifierCollision` becomes the general-purpose collision check for any template's output, not a BEM-only helper.                                                                                                                                                                                                                            |
| **HMR invalidation degrades the same way hashed/compact/atomic already do** | An arbitrary function's output prefix isn't predictable without calling it, so dev-mode HMR invalidation for `mode: 'template'` is best-effort — an existing, documented limitation shared with `hashed`/`compact`/`atomic`, not a new one.                                                                                                                           |

## Public API

```ts
export type ClassNamingMode =
  | 'semantic'
  | 'hashed'
  | 'compact'
  | 'atomic'
  | 'attribute'
  | 'bem'
  | 'template';

const styles = createStyles({
  mode: 'template',
  classNameTemplate: (ctx) => string, // required when mode: 'template'
});
```

`createStyles`/`createTypeStyles` throws immediately if `mode: 'template'` is
set without `classNameTemplate` — the same fail-fast pattern
`component.ts` already uses for `layer` being required under
`cascadeLayers` (`component.ts:297-305`).

### `ClassNameContext`

```ts
export type ClassNameContext = {
  /** Sanitized scope segment from `scopeId`, `''` when unscoped. */
  scope: string;
  /** `styles.component()` namespace, e.g. `'button'`. */
  namespace: string;
  /** Slot name for slot/multi-slot components (`'root'` is passed as `undefined`, matching BEM's root→block rule); `undefined` for non-slot components. */
  element: string | undefined;
  /** Variant dimension name, e.g. `'intent'`; `undefined` when naming the base/block/element class itself. */
  dimension: string | undefined;
  /** Variant option value, e.g. `'primary'`; `undefined` when naming the base/block/element class itself. */
  modifier: string | undefined;
};

export type ClassNameTemplate = (ctx: ClassNameContext) => string;
```

One call per emitted class, always with the full picture — no separate
block-builder/element-builder/modifier-builder function triplet like the
`bem`-only `buildBemBlockClassName`/`buildBemElementClassName`/
`buildBemModifierClassName` this replaces. `dimension` is included
specifically so a template can namespace modifiers by dimension
(`` `${base}--${ctx.dimension}-${ctx.modifier}` ``) to sidestep the
class-collision problem hand-written BEM has when two dimensions share an
option name (`variant: { primary }` and `size: { primary }` both wanting
`--primary`) — something the fixed `bem` mode cannot do, since real BEM
output never includes the dimension name.

Compound variants do **not** get their own template call. Like `mode: 'bem'`
today, they compile to a chained selector over the already-named modifier
classes (`:is(.a, .b)`) — a compound variant is an intersection of existing
named states, not a new named thing.

### Built-in BEM preset

```ts
const BEM_TEMPLATE: ClassNameTemplate = (ctx) => {
  const base = ctx.element
    ? `${ctx.scope}${ctx.namespace}__${ctx.element}`
    : `${ctx.scope}${ctx.namespace}`;
  return ctx.modifier ? `${base}--${ctx.modifier}` : base;
};
```

`mode: 'bem'` resolves to `BEM_TEMPLATE` internally; this is the reference
implementation, not user-facing API surface.

## Examples

### BEM, expressed as a user template (equivalent to `mode: 'bem'`)

```ts
const styles = createStyles({
  mode: 'template',
  classNameTemplate: (ctx) => {
    const base = ctx.element
      ? `${ctx.scope}${ctx.namespace}__${ctx.element}`
      : `${ctx.scope}${ctx.namespace}`;
    return ctx.modifier ? `${base}--${ctx.modifier}` : base;
  },
});
```

### SUIT CSS

```ts
const styles = createStyles({
  mode: 'template',
  classNameTemplate: ({ scope, namespace, element, modifier }) => {
    const Block = `${scope}${namespace[0].toUpperCase()}${namespace.slice(1)}`;
    if (element) return modifier ? `${Block}-${element}--${modifier}` : `${Block}-${element}`;
    return modifier ? `${Block}--${modifier}` : Block;
  },
});
// button() -> "Button"
// button({ intent: 'primary' }) -> "Button--primary"
```

### Prefixed / ITCSS convention

```ts
const styles = createStyles({
  mode: 'template',
  classNameTemplate: ({ scope, namespace, element, modifier }) => {
    const base = element ? `c-${scope}${namespace}-${element}` : `c-${scope}${namespace}`;
    return modifier ? `${base}--${modifier}` : base;
  },
});
// button() -> "c-button"
// button({ intent: 'primary' }) -> "c-button--primary"
```

### Dimension-namespaced modifiers (avoids BEM's collision problem)

```ts
const styles = createStyles({
  mode: 'template',
  classNameTemplate: ({ scope, namespace, element, dimension, modifier }) => {
    const base = element ? `${scope}${namespace}__${element}` : `${scope}${namespace}`;
    return modifier ? `${base}--${dimension}-${modifier}` : base;
  },
});
// variant: { primary } and size: { primary } no longer collide:
// "button--variant-primary" vs "button--size-primary"
```

## Validation & dev warnings

- Template output is validated in dev against a CSS-identifier pattern
  (`/^-?[a-zA-Z_][a-zA-Z0-9_-]*$/`); invalid output throws with the
  offending `ClassNameContext` in the error message.
- `devWarnBemModifierCollision` (`component.ts:77-94`) generalizes to
  `devWarnTemplateClassCollision`, usable by both `bem` and `template`
  modes: if two different `(dimension, modifier)` pairs under the same
  `element` scope produce the same string, dev mode errors — same
  mechanism as today, shared instead of BEM-only.
- Production behavior is unchanged from every other mode: no validation
  overhead, template output used as-is.

## Core implementation

### 1. `packages/typestyles/src/class-naming.ts`

- Add `ClassNameContext`, `ClassNameTemplate` types.
- Add `classNameTemplate?: ClassNameTemplate` to `ClassNamingConfig`.
- Add `BEM_TEMPLATE` (private, the current `bem` builder logic ported to
  the new function shape).
- Add `resolveClassNameTemplate(cfg: ClassNamingConfig): ClassNameTemplate`
  — returns `BEM_TEMPLATE` for `mode: 'bem'`, `cfg.classNameTemplate!` for
  `mode: 'template'`.
- Replace `buildBemBlockClassName`/`buildBemElementClassName`/
  `buildBemModifierClassName` with one `buildTemplateClassName(cfg, ctx)`:
  resolves the template, calls it, validates/sanitizes in dev, tracks via
  the existing `trackEmittedClassName(className, ownerKey(cfg, namespace))`
  call every other builder already makes.
- `emittedComponentClassPrefix`: `bem` keeps returning
  `` `${semanticScopePrefix(cfg)}${namespace}` `` unchanged (existing HMR
  behavior preserved exactly); add `template` returning `null` (same
  best-effort bucket as `hashed`'s sibling `compact`/`atomic`, which
  already return `null` today).
- `emittedClassName`/`buildSingleClassName`/`buildComponentClassName`: add
  `cfg.mode === 'template'` to the existing
  `semantic || attribute || bem` branches, since flat/`styles.class()`
  output under `template` mode is unaffected by the template (semantic
  fallback, per the scope decision above).

### 2. `packages/typestyles/src/component.ts`

- Rename `createBemDimensionedComponent` → `createTemplateDimensionedComponent`,
  `createBemSlotComponent` → `createTemplateSlotComponent`,
  `createBemMultiSlotComponent` → `createTemplateMultiSlotComponent`. Each
  takes `resolveClassNameTemplate(classNaming)` and calls
  `buildTemplateClassName(classNaming, ctx)` instead of the removed
  `buildBem*ClassName` functions.
- Dispatch in `createComponent`: every `if (classNaming.mode === 'bem')`
  branch (lines 311, 329, 350) becomes
  `if (classNaming.mode === 'bem' || classNaming.mode === 'template')`.
- `devWarnBemModifierCollision` → `devWarnTemplateClassCollision`, same
  signature, called from both code paths (it already is — the rename is
  the only change).
- `bemSlotClassName` helper (line 954) → `templateSlotClassName`, calls
  `buildTemplateClassName` for both `root` and non-`root` slots instead of
  branching between `buildBemBlockClassName`/`buildBemElementClassName`.

### 3. `packages/typestyles/src/index.ts`

Export `ClassNameContext`, `ClassNameTemplate` alongside the existing
`ClassNamingConfig`, `ClassNamingMode` export.

### 4. Type-level surface

`ComponentConfigInput`/overloads in `component.ts`'s public function
signatures are unaffected — `classNameTemplate` lives on `ClassNamingConfig`
(the `createStyles`/`createTypeStyles` argument), not on
`styles.component()`'s per-call config, consistent with every other mode.

## Interaction with existing modes

| Concern                                                   | Behavior                                                                                                                                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode: 'bem'` public behavior                             | Unchanged. `component-bem-variants.test.ts` runs unmodified as the regression check for the refactor.                                                                                             |
| `mode: 'attribute'`                                       | Untouched — attribute mode emits `&[data-x="y"]` selectors under one base class, not discrete classes; structurally different from block/element/modifier composition, out of scope here.         |
| `styles.class()` under `mode: 'template'`                 | Semantic-style output (`{scopePrefix}{name}`), `classNameTemplate` never called.                                                                                                                  |
| Flat `styles.component()` config under `mode: 'template'` | Semantic-style output (`{scopePrefix}{namespace}-{key}`), `classNameTemplate` never called.                                                                                                       |
| `scopeId`                                                 | Passed into `ctx.scope` pre-sanitized (same `semanticScopePrefix` sanitization every other mode uses) — templates don't need to sanitize it themselves, only compose it.                          |
| `cascadeLayers`                                           | Orthogonal — `layer` requirement and `@layer` wrapping apply identically regardless of naming mode.                                                                                               |
| Dev-mode HMR invalidation                                 | Best-effort for `template` mode (returns `null` from `emittedComponentClassPrefix`), same documented limitation `hashed`/`compact`/`atomic` already have — not a new gap introduced by this spec. |

## Testing

Add `packages/typestyles/src/component-template-variants.test.ts`, mirroring
the structure of `component-bem-variants.test.ts` and
`component-attribute-variants.test.ts`:

| Case                                                 | Expected                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Base class, dimensioned variants                     | Template called once per base/element and once per modifier; output matches template's return value exactly. |
| Compound variants                                    | Chained selector over existing modifier classes, no extra template call.                                     |
| Slots / multi-slot                                   | `element` set to slot name (`undefined` for `root`), same as BEM.                                            |
| `defaultVariants`                                    | Resolved the same way as every other mode before building the class list.                                    |
| Missing `classNameTemplate` under `mode: 'template'` | `createStyles` throws at call time.                                                                          |
| Two dimensions producing the same template output    | Dev-mode collision warning fires (via `devWarnTemplateClassCollision`).                                      |
| Template returns an invalid CSS identifier           | Dev-mode throws with `ClassNameContext` in the message.                                                      |
| SUIT CSS example (fixture)                           | Demonstrates a second real convention beyond BEM — proves "generic" isn't just BEM in disguise.              |

Extend `class-naming.test.ts` with `buildTemplateClassName` cases (BEM
preset + arbitrary template), sanitization/validation, and
`resolveClassNameTemplate` for both `bem` and `template` modes.

`component-bem-variants.test.ts` itself is **not modified** — passing
unchanged is the correctness proof that the refactor preserved `mode: 'bem'`
byte-for-byte.

## Implementation tasks

### Task 1 — `ClassNameContext`/`ClassNameTemplate` + `buildTemplateClassName`

Add types, `BEM_TEMPLATE`, `resolveClassNameTemplate`, `buildTemplateClassName`
to `class-naming.ts`. Port `devWarnBemModifierCollision` to the generalized
`devWarnTemplateClassCollision`.

**Done when:** `class-naming.test.ts` covers the BEM preset producing
identical output to today's `buildBemBlockClassName`/`buildBemElementClassName`/
`buildBemModifierClassName` for the same inputs.

### Task 2 — Refactor `component.ts` onto the generic engine

Rename/generalize the three `createBem*Component` functions and their
dispatch branches; remove the now-unused `buildBem*ClassName` imports.

**Done when:** `component-bem-variants.test.ts` passes unmodified.

### Task 3 — Wire `mode: 'template'` end-to-end

`classNameTemplate` required-check in `createStyles`/`createTypeStyles`;
`emittedComponentClassPrefix`/`emittedClassName`/`buildComponentClassName`
branches for `template`.

**Done when:** `component-template-variants.test.ts` passes, including the
SUIT CSS fixture.

### Task 4 — TypeScript surface + docs

Export `ClassNameContext`/`ClassNameTemplate` from `index.ts`; document
`mode: 'template'` alongside `mode: 'bem'`/`mode: 'attribute'` with the BEM,
SUIT CSS, and prefixed/ITCSS worked examples from this spec.

**Done when:** docs build; API reference matches implementation.

### Task 5 — Changeset + `IMPROVEMENTS.md`

Changeset in the style of `.changeset/bem-variant-mode.md` (minor bump).
Add a shipped P6 entry to `IMPROVEMENTS.md` in the style of the `nameTemplate`
entry, once merged.

**Done when:** changeset present; `IMPROVEMENTS.md` updated post-merge.

## Explicitly out of scope

- **String-literal token templates** (`'{block}__{element}--{modifier}'`) —
  a function template covers every case a token vocabulary can't (see
  Guiding Principles); sugar could wrap the function later without API
  churn, exactly the framing `token-name-template.md` used for the same
  question on `nameTemplate`.
- **Per-`styles.component()` override of `classNameTemplate`** —
  instance-level only, unlike `nameTemplate`'s per-namespace override on
  `tokens.create`. `mode` has never been a per-component knob for any
  existing naming mode; this doesn't start now.
- **Making `mode: 'attribute'` template-driven** — attribute mode emits
  selectors under one base class, not discrete classes per state; not the
  same problem shape.
- **Precise dev-mode HMR invalidation for arbitrary templates** — inherits
  the existing `hashed`/`compact`/`atomic` best-effort limitation; not
  solved here.
- **Retroactively removing this spec file after merge** (the way
  `specs/bem-variant-mode.md`/`specs/attribute-driven-variants.md` were
  stripped from the PR in `cb47d39`) — a merge-time decision, not part of
  the design.

## Why a function template (not string tokens or config flags)

Flags or a token-substitution string (`'{block}__{element}--{modifier}'`)
cover BEM and maybe SUIT, but fail the moment a convention needs conditional
structure (omit the element segment differently than the modifier segment),
non-`-`/`_` casing transforms (SUIT's `PascalCase` block), or dimension-aware
disambiguation (the collision-avoidance example above). A single
`(ctx) => string` hook — the same shape `nameTemplate` already proved out for
CSS custom property names — covers all of these with one code path, and
keeps `component.ts`'s dispatch logic from growing a new branch every time
someone wants a naming convention `typestyles` doesn't ship by default.
