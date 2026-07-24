---
title: Schema-driven `tokens.declare` and split `@property` / value registration
status: approved
date: 2026-07-23
supersedes: token-forward-references-design.md (declare API portions)
---

# Schema-driven `tokens.declare` and split `@property` / value registration

## Problem

The shipped `tokens.declare(namespace)` API feels too magical: the TypeScript generic
(`declare<DesignColorValues>('color')`) invents structure that the runtime function does
not know about. At runtime `declare()` only returns a lazy `var(--…)` proxy and records
`nameTemplate` — it emits no CSS and performs no validation.

Var UI (the reference design system) already maintains parallel types
(`DesignColorValues`, hand-rolled `cref()` helpers) to work around this. Meanwhile
`@property` registration lives on `TokenDescriptor` values inside `tokens.create()`,
mixing schema concerns (syntax, inherits, initial) with runtime values in one object.

## Goals

- Make `declare()` do real work: accept a schema, emit `@property` rules, infer return
  types from the input shape — no phantom generic required.
- Split concerns: `declare()` owns structure + `@property`; `create()` owns values.
- Keep `declare()` **optional** — simple namespaces can use `create()` alone.
- Support partial, mergeable `create()` calls (later calls add/override paths).
- Optional `decl` handle on `create()` for stronger typing and namespace alignment.
- Preserve forward-reference behavior (same-namespace self-ref and cross-module refs).
- No backwards-compatibility constraints — breaking changes are acceptable.

## Non-goals

- Changing `ctx.vars()` / `styles.property()` in this spec (may align later).
- Automatic detection of declared-but-never-created namespaces beyond ordinary CSS
  undefined-custom-property behavior.
- Solving cascade-layer concerns beyond what `layers` / `tokenLayer` already handle.

## API overview

### `tokens.declare(namespace, schema, options?)`

Reserves a namespace, emits `@property` for schema leaves with `syntax`, and returns a
typed reference proxy usable before and during `create()`.

```ts
const color = tokens.declare('color', {
  background: { app: { syntax: '<color>', inherits: false } },
  accent: {
    default: { syntax: '<color>', inherits: false },
    subtle: { syntax: '<color>', inherits: false },
  },
  meta: { version: true }, // plain leaf — no @property
});
```

### `tokens.create(namespace, values, options?)`

Sets `:root` custom property values. Values are plain `string | number` only.

```ts
tokens.create(
  'color',
  {
    background: { app: '#0a0a0a' },
    accent: { default: '#0066ff' },
  },
  { decl: color },
);

tokens.create(
  'color',
  {
    accent: {
      subtle: `color-mix(in oklch, ${color.accent.default} 24%, ${color.background.app})`,
    },
  },
  { decl: color },
);
```

### Simple namespace — no `declare()` required

```ts
export const spacing = tokens.create('spacing', {
  sm: '8px',
  md: '16px',
});
```

No schema, no `@property`, no forward refs, no path validation.

## Schema types

```ts
type TokenSchemaLeaf = true | { syntax: string; inherits?: boolean; initial?: string | number };

type TokenSchema = TokenSchemaLeaf | { [key: string]: TokenSchema };
```

| Schema leaf                              | `@property` emitted? | Ref type                | `create()` value type |
| ---------------------------------------- | -------------------- | ----------------------- | --------------------- |
| `{ syntax: '<color>', inherits: false }` | Yes                  | `RegisteredPropertyRef` | `string \| number`    |
| `true`                                   | No                   | `var(--…)` string       | `string \| number`    |

Nested objects are structural — they define paths only.

### Type inference

`declare()` return type is inferred from the `schema` argument:

```ts
type InferFromSchema<S> = S extends { syntax: string }
  ? RegisteredPropertyRef
  : S extends true
    ? string
    : S extends Record<string, infer V>
      ? { readonly [K in keyof S]: InferFromSchema<S[K]> }
      : never;
```

No `declare<T>()` generic overload. Export `as const` schema objects when consumers need
the schema type elsewhere.

## `declare()` runtime behavior

On `declare(namespace, schema, options?)`:

1. **Deep-merge** `schema` into the namespace's accumulated schema (same merge strategy
   as `create()` values). Later calls add new paths and override leaves at the same path.
2. Record `namespace → nameTemplate` in `declaredNamespaceTemplates` (existing map).
3. Flatten the **incoming** `schema` chunk to paths (same path-segment rules as
   `flattenTokenPaths`).
4. Resolve CSS custom property names via `buildResolvePathName` / `resolveTokenName`
   (identical logic to `create()` — not a reimplementation).
5. For each **new or updated** leaf with `syntax` in this chunk:
   - In dev mode, throw if the path already exists in the accumulated schema with an
     incompatible leaf (`true` vs `{ syntax: … }`, or different `syntax` / `inherits`).
   - Call `registerAtPropertyRule(propName, { syntax, inherits, initial })`.
   - Always use a placeholder `initial-value` (from explicit `initial`, or the built-in
     syntax table in `registered-property.ts`). No value exists yet at declare time.
   - Skip `@property` re-registration when the path's schema leaf is unchanged (identical
     re-declare is a no-op for that path).
6. Store declared paths and per-path schema metadata for later `create()` validation.
7. Return `DeclaredTokenRef<TSchema, N>` — a typed proxy over the **merged** schema
   (see [Forward references](#forward-references)).

`@property` emission uses the same placeholder table and `initial` override semantics
documented in `token-forward-references-design.md`. The key change: registration moves
from `create()` to `declare()` for declared namespaces.

### `declare()` merge semantics

Multiple `declare()` calls on the same namespace deep-merge schemas, mirroring
`create()`:

```ts
const color = tokens.declare('color', {
  accent: { default: { syntax: '<color>', inherits: false } },
});

tokens.declare('color', {
  accent: { subtle: { syntax: '<color>', inherits: false } },
  meta: { version: true },
});

// Merged schema: accent.default, accent.subtle, meta.version
// @property emitted for accent.default (first call) and accent.subtle (second call)
```

Re-declaring the same path with an **identical** leaf is a no-op. Re-declaring with a
**conflicting** leaf throws in dev mode (e.g. `true` at a path that already has
`{ syntax: '<color>' }`, or `<color>` changed to `<length>`).

**TypeScript note:** each `declare()` call only infers types from **that call's**
`schema` argument. For full-shape typing on `create(…, { decl })`, either pass a single
combined schema in one `declare()`, or use the return value from the call that includes
all paths you need typed.

## `create()` runtime behavior

On `create(namespace, values, options?)`:

1. **Merge** provided values into the namespace's accumulated value map
   (`Map<namespace, Map<path, string>>`). Later calls override the same path.
2. Re-emit the full `:root { … }` rule for the namespace (same `insertRule` key —
   atomic replace of the previous rule).
3. If the namespace was previously `declare()`'d (dev mode):
   - Throw if any path in `values` is not in the declared schema.
   - Do **not** throw for declared paths missing from this or all prior `create()`
     calls — partial fill is intentional.
4. If `options.decl` is passed (dev mode):
   - Throw if `getDeclaredNamespace(options.decl) !== namespace`.
   - Throw if `options.nameTemplate` is passed and differs from the declared template
     (same message style as today's declare/create mismatch guard).
5. Return `CreatedTokenRef` with proxy over all keys from declared schema (if declared)
   or from accumulated create values (if undeclared).

`create()` does **not** register `@property` for declared namespaces — that happened at
`declare()`. Undeclared namespaces get no `@property` (plain custom properties only).

## Options: `decl` handle

```ts
create(
  namespace: N,
  values: V,
  options?: {
    decl?: DeclaredTokenRef<TSchema, N>;
    layer?: string;
    nameTemplate?: TokenNameTemplate;
  },
): CreatedTokenRef<…, N>;
```

The object returned by `declare()` is both the forward-ref proxy and the `decl` handle.

### Typing

When `options.decl` is passed, `values` is constrained to
`DeepPartial<InferValuesFromSchema<TSchema>>` (plain `string | number` at leaves).

When `options.decl` is omitted:

- If `createTokens<Registry>()` is used, infer `values` from the registry entry for
  `namespace` (existing pattern).
- Otherwise, `values` is loosely typed; dev-mode runtime validation still applies when a
  declare schema exists for the namespace.

### Namespace alignment

`DeclaredTokenRef` carries a brand:

```ts
declare const DeclaredBrand: unique symbol;

type DeclaredTokenRef<TSchema, N extends string> = TokenRef<InferFromSchema<TSchema>> & {
  readonly [DeclaredBrand]: { namespace: N; schema: TSchema };
};
```

- **Compile time:** `decl` typed as `DeclaredTokenRef<TSchema, 'color'>` requires
  `create('color', …)` — `create('spacing', …, { decl: color })` is a type error.
- **Runtime (dev):** same check via `getDeclaredNamespace(decl) !== namespace`.

## Merge semantics

Multiple `create()` calls on the same namespace deep-merge values:

```ts
tokens.create('color', { accent: { default: '#0066ff' } }, { decl: color });
tokens.create('color', { accent: { subtle: '…' } }, { decl: color });
// :root contains both --color-accent-default and --color-accent-subtle
```

Implementation keeps `namespaceValues: Map<string, Map<string, string>>`. Each `create()`
merges new leaf values, then re-flattens and re-emits the `:root` block.

## Forward references

Unchanged mechanism from `token-forward-references-design.md`, with a separate proxy
constructor (`createLooseTokenProxy` / schema-aware variant) that never collapses to a
leaf string on first property access.

**Same-namespace self-reference:**

```ts
const color = tokens.declare('color', {
  background: { app: { syntax: '<color>', inherits: false } },
  accent: {
    default: { syntax: '<color>', inherits: false },
    subtle: { syntax: '<color>', inherits: false },
  },
});

tokens.create(
  'color',
  {
    accent: {
      default: '#0066ff',
      subtle: `color-mix(in oklch, ${color.accent.default} 24%, ${color.background.app})`,
    },
  },
  { decl: color },
);
```

**Cross-namespace / circular:**

```ts
// module-a.ts
const colorB = tokens.declare('colorB', {
  accent: { syntax: '<color>', inherits: false },
});
export const colorA = tokens.create('colorA', {
  accent: `color-mix(in oklch, ${colorB.accent} 50%, black)`,
});

// module-b.ts — no import of module-a
const colorA = tokens.declare('colorA', {
  accent: { syntax: '<color>', inherits: false },
});
export const colorB = tokens.create('colorB', {
  accent: `color-mix(in oklch, ${colorA.accent} 50%, white)`,
});
```

Cross-namespace refs require `declare()` for the referenced namespace (at minimum the
referenced paths). `declare()` can list only the paths needed for refs + `@property`.

## `nameTemplate` agreement

Same rules as the current implementation:

- `declare(namespace, schema, { nameTemplate })` records the template.
- `create(namespace, values, { nameTemplate })` must pass the **same function reference**
  or omit `nameTemplate` to reuse the declared one.
- Dev-mode throw on mismatch (message unchanged in spirit).

## Validation matrix (dev mode)

| Check                                              | When                                     | Result                                            |
| -------------------------------------------------- | ---------------------------------------- | ------------------------------------------------- |
| Path in `create()` not in declared schema          | namespace was `declare()`'d              | throw                                             |
| Declared path never given a value                  | always                                   | silent (partial OK)                               |
| `decl.namespace !== create` namespace              | `decl` passed                            | throw                                             |
| `nameTemplate` mismatch                            | declared + explicit template on `create` | throw                                             |
| `create()` without prior `declare()`               | undeclared namespace                     | OK — freeform plain values                        |
| `declare()` without matching `create()`            | declare only                             | OK — `@property` emitted, no `:root` until create |
| Same path re-declared with identical schema leaf   | second `declare()`                       | no-op for that path                               |
| Same path re-declared with conflicting schema leaf | second `declare()`                       | throw                                             |

## What gets removed

- `declare(namespace)` with no schema / `LooseTokenRef` / `declare<T>()` generic overload.
- `TokenDescriptor` on `tokens.create()` values (`syntax` / `inherits` / `initial` move to
  declare schema only).
- `@property` registration inside `create()` for declared namespaces.
- Var UI `cref()` workaround and hand-maintained parallel ref types.

`TokenDescriptor` may remain for `ctx.vars()` and `styles.property()` until a follow-up
spec aligns those APIs.

## Var UI migration (before → after)

**Before:**

```ts
type DesignColorValues = { accent: { default: string; subtle: string }; … };
const color = tokens.declare<DesignColorValues>('color');
export const colorTokens = tokens.create('color', {
  accent: {
    default: '#0066ff',
    subtle: {
      value: `color-mix(in oklch, ${color.accent.default} 24%, …)`,
      syntax: '<color>',
      inherits: false,
    },
  },
});
```

**After:**

```ts
export const colorSchema = {
  accent: {
    default: { syntax: '<color>', inherits: false },
    subtle: { syntax: '<color>', inherits: false },
  },
} as const;

const color = tokens.declare('color', colorSchema);
export const colorTokens = tokens.create(
  'color',
  {
    accent: {
      default: '#0066ff',
      subtle: `color-mix(in oklch, ${color.accent.default} 24%, ${color.background.app})`,
    },
  },
  { decl: color },
);
```

## Implementation notes

- **Files:** `declare()` schema flattening and `@property` emission in `tokens.ts`;
  placeholder table stays in `registered-property.ts`. New types
  (`TokenSchema`, `DeclaredTokenRef`, `InferFromSchema`, `InferValuesFromSchema`) in
  `types.ts`.
- **Proxy:** Reuse or extend `createLooseTokenProxy` for declared refs; attach
  `DeclaredBrand` metadata for namespace/schema retrieval.
- **Accumulated state:** New per-instance maps for merge semantics —
  `namespaceSchemas` (deep-merged declare chunks) and `namespaceValues` (deep-merged
  create values).
- **Tests:** `tokens.test.ts` — schema declare + partial merge create, `decl` namespace
  mismatch, path validation, forward-ref CSS output, `nameTemplate` agreement;
  `registered-property.test.ts` — declare-time placeholder emission.
- **Docs:** Update `docs/content/docs/tokens.md` and API reference; remove
  `declare<T>()` / `LooseTokenRef` / `TokenDescriptor`-on-create examples.

## Open implementation questions for the plan phase

- Exact `DeepPartial` utility for nested token value objects (may already exist or need
  a small `DeepPartialTokenValues<T>` type).
- Shared deep-merge helper for declare schemas and create values (same algorithm,
  different leaf shapes).
- Exporting `colorSchema` as a public package API vs keeping schemas module-private.
