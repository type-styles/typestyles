---
title: CSS primitives ladder (`css.*`, split property registration, progressive disclosure)
status: approved
date: 2026-07-24
related: tokens-declare-schema-design.md
supersedes: tokens-declare-schema-design.md (non-goals: ctx.vars / styles.property alignment)
---

# CSS primitives ladder (`css.*`, split property registration, progressive disclosure)

## Problem

TypeStyles now splits design-token **structure** from **values** via
`tokens.declare()` / `tokens.create()` (see `tokens-declare-schema-design.md`).
`@property` registration happens at declare time; values are plain
`string | number` at create time.

Three other APIs still bundle registration and values into one object shape
(`{ value, syntax, inherits, initial }`), and none expose a CSS-faithful
layer with exact `--name` control:

| API                          | Prefixing                      | `@property`          | Value emission               | Split declare/set? |
| ---------------------------- | ------------------------------ | -------------------- | ---------------------------- | ------------------ |
| `tokens.declare` / `create`  | namespace + `nameTemplate`     | declare-time         | `:root` batch per namespace  | Yes                |
| `styles.property(id, opts?)` | `--{scope}-property-{id}`      | bundled with `value` | `:root` per property         | No                 |
| `ctx.var` / `ctx.vars`       | `--{scope}-{component}-{path}` | bundled with `value` | merged into component `base` | No                 |

Power users migrating from hand-written CSS, Style Dictionary output, or
third-party stylesheets need **exact `--name` control** without scope prefixing.
Component authors need **declare-only** `@property` registration when values
live in variant overrides. Design-system authors on `tokens.*` should rarely
need to drop down — but when they do, the lower layers should compose rather
than reimplement.

Internally, `registerAtPropertySchema` (declare-only) and
`registerAtPropertyRule` (value-aware placeholder logic) already exist in
`registered-property.ts`. `tokens.declare` uses the schema path. `styles.property`
and `ctx.vars` still route through `registerRegisteredProperty`, which **requires**
`value` when `syntax` is set — blocking declare-only registration at those tiers.

## Goals

- Introduce a **documented progressive-disclosure ladder** so each audience
  (design-system, component, migration/power user) has a natural API without
  climbing past their comfort level.
- Add a **`typestyles/css` subpath** with CSS-faithful emitters: exact `--name`
  control, no scope prefixing, declare and set are separate operations.
- Split **`styles.property`** into `declare` / `set` (keep shorthand).
- Split **`ctx.vars`** into `declare` / values-in-styles (keep shorthand).
- **Converge types**: one `PropertyRegistration` shape; value is never part of
  registration.
- **Single implementation path**: all tiers call the same primitives in
  `registered-property.ts` (or a thin `css/` module wrapping them).
- Preserve existing behavior where shorthand APIs are used unchanged.
- No backwards-compatibility constraints beyond keeping shorthand entry points —
  breaking changes to descriptor shapes are acceptable.

## Non-goals

- Replacing style-object `@media` / `container()` / `has()` keys with emitters —
  those are nested selectors, not top-level at-rules.
- A generic `css.atRule(type, cssString)` builder in v1 — use `insertRule` for
  unanticipated at-rules.
- Changing `tokens.declare` / `tokens.create` semantics (approved spec) — this
  spec makes them explicit consumers of shared primitives.
- `@starting-style`, `@counter-style`, or other new at-rule emitters in v1 —
  follow-up once the property ladder lands.
- Automatic tier detection or lint rules steering users to the "right" API.

## Progressive-disclosure ladder

```
tokens.declare / tokens.create        ← design systems, themes, forward refs
        ↓ component-scoped or non-token properties
ctx.vars.declare / ctx.var            ← component internal custom properties
styles.property.declare / .set        ← global, scoped to a styles instance
        ↓ exact --names, no prefixing
css.atProperty / css.customProperty   ← mirrors the cascade spec
        ↓ unanticipated at-rules
insertRule(key, cssString)            ← escape hatch (already exists)
```

Each rung is a thin wrapper over the one below. Docs include a decision tree
(see [Documentation](#documentation)).

---

## Shared types

### `PropertyRegistration`

Registration metadata only — **never** includes a runtime value:

```ts
type PropertyRegistration = {
  syntax: string;
  inherits?: boolean; // default false
  initial?: string | number;
};
```

### `PropertyRef`

Reference for use in style values and variant overrides. Same shape as today's
`RegisteredPropertyRef`:

```ts
type PropertyRef = {
  readonly name: `--${string}`;
  readonly var: CSSVarRef;
  toString(): string;
  valueOf(): string;
};
```

`PropertyRef` is the public name; `RegisteredPropertyRef` becomes a deprecated
alias (or identical type alias) exported from `typestyles`.

### `PropertyOptions` (shorthand only)

```ts
type PropertyOptions = PropertyRegistration & {
  value?: string | number;
};
```

### Schema leaf for `ctx.vars.declare`

Mirrors token schema leaves:

```ts
type ComponentVarSchemaLeaf = true | PropertyRegistration;

type ComponentVarSchema =
  | ComponentVarSchemaLeaf
  | {
      [key: string]: ComponentVarSchema;
    };
```

| Leaf                                     | `@property`? | Value set via                        |
| ---------------------------------------- | ------------ | ------------------------------------ |
| `{ syntax: '<color>', inherits: false }` | Yes          | `[ref.name]: …` in `base` / variants |
| `true`                                   | No           | `[ref.name]: …` in `base` / variants |

### Deprecations

- **`TokenDescriptor`** — remove from public docs; no longer used by
  `tokens.create()`. Keep as deprecated type alias mapping to `PropertyOptions`
  until a minor release after migration.
- **`ComponentVarDescriptor`** — replace with `PropertyOptions` for shorthand;
  `declare` uses `ComponentVarSchema`.
- **`RegisteredPropertyOptions`** — alias of `PropertyOptions`.

---

## Tier 0 — `typestyles/css`

New package subpath. No `scopeId`, no namespace prefixing, no instance binding.
Intended for migration, third-party CSS interop, and library internals.

### Export surface

```ts
import { css } from 'typestyles/css';

// @property only — no value declaration
css.atProperty(name: `--${string}`, registration: PropertyRegistration): PropertyRef;

// Single custom property on a selector (default :root)
css.customProperty(
  name: `--${string}`,
  value: string | number,
  options?: { selector?: string }, // default ':root'
): void;

// Batch custom properties — one rule per selector per call
css.customProperties(
  selector: string,
  properties: Record<`--${string}`, string | number>,
): void;

// Ref without emitting anything
css.var(name: `--${string}`): PropertyRef;
```

Future v2 aliases (out of scope for initial implementation, noted for discoverability):

- `css.keyframes` → existing `keyframes.create`
- `css.fontFace` → existing `global.fontFace`

### `css.atProperty` runtime behavior

Delegates to `registerAtPropertySchema(name, registration)`:

1. Resolve `inherits` (default `false`).
2. Resolve `initial-value`:
   - explicit `initial` if provided (must be computationally independent —
     no `var()` / `env()`; dev warn + skip if invalid);
   - else placeholder from the built-in syntax table in `registered-property.ts`;
   - else dev warn + skip `@property` (plain custom property still works if
     value is set separately).
3. Emit `@property ${name} { syntax: "…"; inherits: …; initial-value: …; }` via
   `insertRule('@property:${name}', …)`.
4. Return `createRegisteredPropertyRef(name)`.
5. Re-registration with **identical** registration is a no-op (same
   `insertRule` key). Conflicting re-registration throws in dev mode.

`syntax` without `value` is always valid — this is the primary reason this tier
exists.

### `css.customProperty` / `css.customProperties` runtime behavior

**Single property** (`css.customProperty`):

- Emits `selector { name: value; }` via `insertRule` with key
  `custom-prop:${selector}:${name}` (same per-property strategy as today's
  `registerRootCustomProperty` when `selector` is `:root`).
- Does **not** emit `@property` — call `css.atProperty` separately when typed
  registration is needed.

**Batch** (`css.customProperties`):

- Emits one rule: `selector { --a: …; --b: …; }` via `insertRule` with key
  `custom-props:${hashOrCanonicalSelector}`.
- Later calls with the **same selector** merge properties (same deep-merge
  strategy as `tokens.create` value maps): later paths override, atomic
  replace of the previous rule for that selector key.
- Used internally by `tokens.create` for `:root` batch emission (refactor, not
  behavior change).

### Validation (dev mode)

| Check                                                       | Result                                    |
| ----------------------------------------------------------- | ----------------------------------------- |
| `name` does not start with `--`                             | throw                                     |
| `atProperty` re-declared with conflicting registration      | throw                                     |
| `atProperty` with `initial` containing `var()` / `env()`    | warn + skip `@property`                   |
| `atProperty` syntax with no placeholder and no `initial`    | warn + skip `@property`                   |
| `customProperty` on undeclared name (no prior `atProperty`) | silent — plain custom props are valid CSS |

### Examples

```ts
import { css } from 'typestyles/css';

// Match existing global stylesheet names exactly
css.atProperty('--ds-color-accent', {
  syntax: '<color>',
  inherits: false,
  initial: 'transparent',
});
css.customProperty('--ds-color-accent', '#0066ff');

const accent = css.var('--ds-color-accent');
// styles.class('hero', { color: accent.var })

// Dependent value: declare with placeholder, set real value separately
css.atProperty('--ds-color-accent-subtle', { syntax: '<color>', inherits: false });
css.customProperty(
  '--ds-color-accent-subtle',
  `color-mix(in oklch, ${accent.var} 24%, transparent)`,
);
```

---

## Tier 1 — `styles.property`

Scoped to a `createStyles` / `createTypeStyles` instance. Names follow
`--{scopedNs}-property-{id}` (unchanged from today).

### API

```ts
// Split (new)
styles.property.declare(
  id: string,
  registration: PropertyRegistration,
): PropertyRef;

styles.property.set(ref: PropertyRef, value: string | number): void;

// Shorthand (unchanged entry point)
styles.property(id: string, options?: PropertyOptions): PropertyRef;

// Bare ref (unchanged)
styles.property(id: string): PropertyRef;
```

`styles.property` is a **namespace object** with callable shorthand:
`styles.property(id, opts?)` remains the default call signature; `declare` and
`set` are properties on the same function object (similar to `tokens` exposing
multiple methods).

### Runtime behavior

**`declare(id, registration)`**

1. Sanitize `id` → `safeId` (existing `sanitizeClassSegment`).
2. Dev warn on duplicate `safeId` (same as today).
3. Compute `name = '--${scopedTokenNamespace(scopeId, 'property')}-${safeId}'`.
4. Call `registerAtPropertySchema(name, registration)`.
5. Return `createRegisteredPropertyRef(name)`.

**`set(ref, value)`**

1. Dev throw if `ref.name` does not match this instance's property namespace
   prefix (prevents cross-instance misuse).
2. Call `css.customProperty(ref.name, value)` (or `registerRootCustomProperty`
   directly — same implementation).

**Shorthand `property(id, options?)`**

- `options` with `syntax` only → `declare` then optional `set` if `value` present.
- `options` with `value` only → `set` via new ref (create ref, emit value, no `@property`).
- `options` with both → `declare` + `set` (replaces `registerRegisteredProperty` bundle).
- No `options` → bare ref, no emission (unchanged).

### Migration

Existing `styles.property(id, { value, syntax, inherits })` call sites continue
to work via shorthand — no source changes required. Descriptor-only shape
remains `PropertyOptions`.

---

## Tier 2 — `ctx.var` / `ctx.vars`

Scoped to a component namespace: `--{scopedNs}-{component}-{path}` (unchanged).

### API

```ts
type ComponentConfigContext = {
  var: {
    (id: string, options?: PropertyOptions): PropertyRef;
    declare(id: string, registration: PropertyRegistration): PropertyRef;
  };
  vars: {
    <const T extends ComponentVarDefinitions>(definitions: T): ComponentVarRefTree<T>;
    declare<const T extends ComponentVarSchema>(
      schema: T,
    ): ComponentVarRefTree<InferComponentVarsFromSchema<T>>;
  };
};
```

There is no `ctx.vars.set()` — component **values** are set where they always
were: `[ref.name]: value` in `base`, variants, and compound variants. The split
removes the false coupling of "default value must be known at declare time" for
typed properties.

### `ctx.vars.declare(schema)` runtime behavior

1. Flatten schema to paths (same rules as `flattenComponentVars` / token schema
   flattening).
2. For each leaf:
   - `{ syntax, … }` → `registerAtPropertySchema(name, registration)`; **no**
     entry in `varBaseDefaults`.
   - `true` → no `@property`; ref only.
3. Return proxy tree (same `createVarRefsProxy` as today).

### `ctx.vars(definitions)` shorthand (unchanged behavior)

Plain `string | number` leaves → register value in `varBaseDefaults`.
`PropertyOptions` leaves with `value` → `@property` (if `syntax`) + default in
`base`. Equivalent to `declare` + implicit set for leaves that include `value`.

### `ctx.var.declare` / `ctx.var` shorthand

Same pattern as `styles.property` for single-property cases.

### Example — declare structure, set in variants

```ts
const badge = styles.component('badge', (c) => {
  const v = c.vars.declare({
    textColor: { syntax: '<color>', inherits: false },
    borderWidth: true,
  });
  return {
    base: {
      [v.borderWidth.name]: '1px',
      color: v.textColor.var,
      borderStyle: 'solid',
      borderWidth: v.borderWidth.var,
    },
    variants: {
      tone: {
        neutral: { [v.textColor.name]: '#333' },
        danger: { [v.textColor.name]: '#900' },
      },
    },
    defaultVariants: { tone: 'neutral' },
  };
});
```

---

## Tier 3 — `tokens.declare` / `tokens.create`

No API changes. Implementation refactor only:

- `tokens.declare` → already calls `registerAtPropertySchema` per syntax leaf.
- `tokens.create` → refactor `:root` emission to call `css.customProperties(':root', …)`
  (or shared batch helper) while preserving namespace batching, `nameTemplate`,
  layer wrapping, and merge semantics.

---

## Implementation architecture

```
┌─────────────────────────────────────────────────────────────┐
│  tokens.declare / tokens.create                             │
│  ctx.vars.declare / ctx.var.declare                         │
│  styles.property.declare / .set                             │
├─────────────────────────────────────────────────────────────┤
│  css.atProperty / css.customProperty / css.customProperties │
│  (typestyles/css — thin public wrapper)                     │
├─────────────────────────────────────────────────────────────┤
│  registerAtPropertySchema                                   │
│  registerAtPropertyRule (value-aware placeholder path)      │
│  registerRootCustomProperty / batch custom-prop emitter     │
├─────────────────────────────────────────────────────────────┤
│  insertRule / insertRules (sheet.ts)                        │
└─────────────────────────────────────────────────────────────┘
```

### Files (expected)

| File                                                  | Change                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `packages/typestyles/src/css.ts`                      | New — `css` export object                                                      |
| `packages/typestyles/src/registered-property.ts`      | Extract batch emitter; optional dev-mode conflict check on schema re-register  |
| `packages/typestyles/src/styles.ts`                   | `property` as callable + `.declare` / `.set`                                   |
| `packages/typestyles/src/component-config-context.ts` | `vars.declare`, `var.declare`; use `registerAtPropertySchema` for declare-only |
| `packages/typestyles/src/tokens.ts`                   | Route `:root` batch through shared custom-properties helper                    |
| `packages/typestyles/src/types.ts`                    | `PropertyRegistration`, `PropertyRef`, schema types; deprecate aliases         |
| `packages/typestyles/package.json`                    | Add `"./css"` export                                                           |
| `packages/typestyles/src/index.ts`                    | Re-export `PropertyRegistration`, `PropertyRef`; deprecated aliases            |

### `styles.property` callable + namespace

```ts
type StylesPropertyFn = {
  (id: string, options?: PropertyOptions): PropertyRef;
  declare(id: string, registration: PropertyRegistration): PropertyRef;
  set(ref: PropertyRef, value: string | number): void;
};
```

TypeScript: intersect call signature with method properties (same pattern as
optional future `tokens` branding).

### Build extraction and SSR

All `css.*` calls use `insertRule` — same extraction path as `tokens.create` and
`styles.property`. No bundler plugin changes expected. `getRegisteredCss()` includes
emitted rules identically.

### HMR

Existing `insertRule` key scheme applies. Batch custom-property keys must be
stable across hot reloads (canonical selector string + namespace id for
token batches).

---

## Documentation

New doc page: **`docs/content/docs/css-primitives.md`** (title: "CSS primitives").

Sections:

1. **When to use which tier** — decision tree from the ladder diagram.
2. **`css.*` reference** — migration / exact-name use cases.
3. **`styles.property` declare/set** — link from [API reference](/docs/api-reference).
4. **`ctx.vars.declare`** — link from [Components](/docs/components).
5. **Relationship to tokens** — `tokens.declare` is the design-system tier; link
   to [Tokens](/docs/tokens).

Update existing docs:

- `docs/content/docs/api-reference.md` — `styles.property.declare` / `.set`, `css` subpath.
- `docs/content/docs/tokens.md` — cross-link to css-primitives ladder.
- `docs/content/docs/components.md` — `ctx.vars.declare` example.
- `tokens-declare-schema-design.md` non-goals note — superseded by this spec for
  `ctx.vars()` / `styles.property()` alignment.

Add to `docs/src/navigation.ts` under an appropriate group (e.g. "Core concepts"
or nested under Tokens).

---

## Validation matrix (dev mode)

| Check                                                         | Tier        | Result                   |
| ------------------------------------------------------------- | ----------- | ------------------------ |
| `styles.property.set(ref)` ref from different styles instance | styles      | throw                    |
| `declare` duplicate id/path on same instance                  | styles, ctx | warn (existing behavior) |
| `atProperty` / `declare` conflicting re-registration          | all         | throw                    |
| `syntax` without placeholder and without `initial`            | all         | warn + skip `@property`  |
| `initial` contains `var()` / `env()`                          | all         | warn + skip `@property`  |
| `customProperty` without prior `atProperty`                   | css         | silent                   |
| `name` missing `--` prefix                                    | css         | throw                    |

---

## Testing

| Area                               | File                     | Cases                                                                      |
| ---------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| `css.atProperty` declare-only      | `css.test.ts` (new)      | emits `@property`, no `:root`; placeholder; explicit `initial`; skip paths |
| `css.customProperties` merge       | `css.test.ts`            | batch emit; merge same selector; override                                  |
| `styles.property.declare` / `.set` | `styles.test.ts`         | split emit; shorthand equivalence; cross-instance set throw                |
| `ctx.vars.declare`                 | `component.test.ts`      | `@property` without base default; variant overrides                        |
| Shorthand backward compat          | existing tests           | all current `styles.property` / `ctx.vars` tests pass unchanged            |
| Token integration                  | `tokens.test.ts`         | refactor-only — no output change                                           |
| Extraction                         | `webpack` / `vite` smoke | `css.*` import extracted like tokens                                       |

---

## Migration guide

### `styles.property` consumers

No change required when using shorthand. Optional migration to split form:

```ts
// Before (still valid)
const hue = styles.property('accent-hue', { value: '220', syntax: '<number>' });

// After (explicit)
const hue = styles.property.declare('accent-hue', { syntax: '<number>' });
styles.property.set(hue, '220');
```

### `ctx.vars` consumers

No change when passing inline values. Optional migration when defaults live only
in variants:

```ts
// Before — had to supply a dummy value in descriptor to get @property
borderColor: { value: '#ccc', syntax: '<color>', inherits: false },

// After
const v = c.vars.declare({ borderColor: { syntax: '<color>', inherits: false } });
// set [v.borderColor.name] only in variants, or in base when ready
```

### Style Dictionary / global CSS interop

```ts
import { css } from 'typestyles/css';

for (const [name, meta] of Object.entries(sdPropertyMetadata)) {
  if (meta.syntax) css.atProperty(name as `--${string}`, meta);
}
css.customProperties(':root', sdValues);
```

---

## Open implementation questions (for plan phase)

- Exact `insertRule` key for `css.customProperties` batch merge — hash sorted
  property names vs selector-only (latter requires in-memory accumulator per
  selector, matching `tokens.create` namespace maps).
- Whether `PropertyRef` should carry a branded tag so `set()` is type-safe across
  tiers without runtime prefix checks.
- `css` as named export vs default export (`import { css }` preferred for tree-shaking).
- Export `registerAtPropertySchema` from `typestyles/css` for advanced callers or
  keep strictly internal.
- Timeline for removing deprecated `TokenDescriptor` / `ComponentVarDescriptor` exports.
