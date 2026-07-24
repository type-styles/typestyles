---
title: Token forward references (`tokens.declare`) and typed `@property` for dependent tokens
status: approved
date: 2026-07-22
---

# Token forward references and typed `@property` for dependent tokens

## Problem

Design tokens frequently need to reference sibling tokens: a semantic `accent.subtle`
built from `color-mix()` of `accent.default`, a `stroke.default` built from a border
width plus a semantic color, etc. `tokens.create(namespace, values)` takes a single
plain JS object, so nothing inside `values` can reference the object being built —
JS object literals cannot self-reference. Two concrete cases hit this:

1. **Same-namespace self-reference.** A value in `tokens.create('color', {...})`
   needs to reference another key in that same call (e.g. `accent.subtle` built from
   `accent.default`).
2. **Cross-namespace / circular reference.** Two namespaces, possibly in different
   modules, need to reference each other's tokens without a real JS import cycle.

`packages/core/src/tokens/index.ts` in Var UI (the reference design system for
TypeStyles) already hit case 1 and worked around it by hand:

```ts
const colorCssNs = scopedTokenNamespace(tokens.scopeId?.trim() || undefined, 'color');
const cref = (path: string) => `var(--${colorCssNs}-${path})`;
```

This reimplements `tokens.create()`'s internal `--{ns}-{path}` naming by hand. It is
correct only because that namespace happens to use the default naming scheme — the
moment a `nameTemplate` override is added to `color`, `cref()` silently produces the
wrong variable name, with no compiler or runtime signal that anything broke.

Separately, `registerAtPropertyRule` (in `packages/typestyles/src/registered-property.ts`)
currently skips `@property` registration entirely whenever a token's value contains
`var()`/`env()` (commit `b8d219d`), because `@property`'s `initial-value` descriptor
must be _computationally independent_ per the CSS Properties & Values Level 1 spec.
That means every self-referencing or cross-referencing token — exactly the tokens this
spec is about — permanently loses typed/animatable `@property` registration today, even
though its actual `:root` value is set correctly.

## Goals

- Let a token value reference another token in the **same** `tokens.create()` call,
  without hand-computing CSS variable names outside `tokens.create()`'s own logic.
- Let a token value reference a namespace declared in **another module**, without
  requiring that module's `tokens.create()` to have already run (avoids import cycles).
- Restore typed, animatable `@property` registration for tokens whose value is
  `var()`-dependent, wherever it's safe to do so — without emitting spec-invalid CSS.
- Priority: same-namespace self-reference matters more than the cross-namespace case,
  but a single mechanism should cover both rather than two unrelated APIs.
- Every generated ref must be a real `var(--…)` string and every registered property
  must be real, valid CSS — nothing here is compiler magic layered over invented
  semantics. The typed layer only makes real CSS concepts easier to reach from
  JS/TypeScript.

## Non-goals

- Solving forward-reference across **cascade layers** beyond what `layers`/`tokenLayer`
  already handle — out of scope.
- Automatically detecting "you called `declare()` but never called the matching
  `create()`" — see [Declared-but-never-created namespaces](#declared-but-never-created-namespaces).
- Changing `tokens.use()`'s documented contract ("the namespace must already be
  registered via `tokens.create`"). `declare()` is a new, separate entry point;
  `use()`'s existing dev-mode typo-warning behavior for already-created namespaces is
  unaffected.

## Design: `tokens.declare(namespace, options?)`

A new method on `TokensApi`, alongside `create`/`use`, that reserves a namespace's
naming configuration and returns a lazy reference proxy **before** any values exist
for that namespace.

```ts
const color = tokens.declare<DesignColorValues>('color');

export const colorTokens = tokens.create('color', {
  accent: {
    default: '#0066ff',
    subtle: `color-mix(in oklch, ${color.accent.default} 24%, ${color.background.app})`,
  },
  danger: {
    default: '#ef4444',
    subtle: `color-mix(in oklch, ${color.danger.default} 12%, transparent)`,
  },
});
```

Cross-namespace/circular reference uses the same call, just from a different module,
without needing to import the other namespace's `create()` output:

```ts
// module-a.ts
import { tokens } from './runtime';
const colorFromB = tokens.declare<ColorBValues>('colorB');
export const colorA = tokens.create('colorA', {
  accent: `color-mix(in oklch, ${colorFromB.accent} 50%, black)`,
});

// module-b.ts (no import of module-a.ts needed)
import { tokens } from './runtime';
const colorFromA = tokens.declare<ColorAValues>('colorA');
export const colorB = tokens.create('colorB', {
  accent: `color-mix(in oklch, ${colorFromA.accent} 50%, black)`,
});
```

### Signature

```ts
declare(namespace: string, options?: { nameTemplate?: TokenNameTemplate }): LooseTokenRef;
declare<T extends TokenValues>(
  namespace: string,
  options?: { nameTemplate?: TokenNameTemplate },
): TokenRef<T>;
```

Two overloads, matching the existing pattern already used by `use()` in this file:

- **No type argument** (`tokens.declare('color')`) resolves to the untyped overload —
  returns `LooseTokenRef`, a proxy where any property path, at any depth, resolves to
  a `var(--…)` string on coercion (template literal, `String()`, `assignVars`). There is
  no compile-time or dev-time validation that a given path will actually be created —
  by definition `declare()` cannot know the eventual shape. This mirrors the honesty
  goal above: it doesn't pretend to validate something it structurally cannot know yet.
- **Explicit type argument** (`tokens.declare<DesignColorValues>('color')`) resolves to
  the generic overload — returns `TokenRef<T>`, reusing the _existing_ `TokenRef<T>`
  mapped type from `types.ts` verbatim. This gives full autocomplete and shape-checking
  on the returned proxy, and replaces what Var UI already hand-writes today as a
  parallel `DesignColorRefs` type — now the library enforces the shape instead of the
  app maintaining it by convention.

`LooseTokenRef` is a new type: a recursive, self-indexing type built the same way the
existing branded proxy types are (`CSSVarRef`-style intersection, populated via an `as`
cast over the runtime `Proxy`, consistent with `createTokenProxy(...) as CreatedTokenRef<T, N>`
elsewhere in this file):

```ts
export type LooseTokenRef = CSSVarRef & {
  readonly [key: string]: LooseTokenRef;
};
```

### Runtime proxy behavior

`declare()` builds its proxy with a **new, separate** proxy constructor
(`createLooseTokenProxy`), not by reusing `createTokenProxy`'s existing
`allKeys.size === 0` branch. That branch is currently reachable only when `use()` is
called on a namespace that either was never created or was created with zero keys —
both explicitly unsupported by `use()`'s documented contract — and it has a real bug for
this purpose: it collapses to a raw leaf string on the **first** property access
(`color.border` already returns a string), so a second-level access like
`color.border.default` fails silently (`.default` on a string primitive is `undefined`).
Keeping `declare()`'s proxy separate avoids quietly changing `use()`'s semantics and
avoids inheriting that bug.

`createLooseTokenProxy(resolvePathName)` behavior:

- Any property access, at any depth, returns another `createLooseTokenProxy` continuing
  the accumulated path — it never collapses to a leaf string on its own.
- `toString()` / `valueOf()` (the same trap-cased prop names already special-cased in
  `createTokenProxy`) return `makeToken(accumulatedPath)` — i.e. the actual
  `var(--resolved-name)` string. This is what fires when the proxy is interpolated into
  a template literal, passed to `String()`, or used as a computed object key.
- `resolvePathName` is the **same** `buildResolvePathName(namespace, template, nameByPath)`
  function `create()`/`use()` already use — not a reimplementation. Name resolution
  (`resolveTokenName` / `buildTokenNameContext`) is a pure function of
  `{ scopeId, scope, namespace, path, segments }`, so it produces identical output
  whether called from `declare()` before creation or `create()` at creation time,
  **provided both are given the same `nameTemplate`** (see below).

### Keeping `declare()` and `create()` in agreement on naming

Because name resolution is a pure function, `declare()` does not need to pre-populate
shared per-path state for names to come out correct — it only needs to guarantee both
calls use the same `nameTemplate`. To make a mismatch a loud error instead of a silent
wrong name (the exact failure mode `cref()` has today):

- `declare(namespace, { nameTemplate })` records `namespace → nameTemplate` in the
  existing `createdTokenTemplates` map (already `Map<string, TokenNameTemplate | undefined>`,
  already read by `use()` and now also by `create()`).
- `create(namespace, values, options)` changes its template resolution from
  `options?.nameTemplate ?? instanceDefaultTemplate` to
  `options?.nameTemplate ?? createdTokenTemplates.get(namespace) ?? instanceDefaultTemplate`.
- In development mode, if `createdTokenTemplates.has(namespace)` (i.e. `declare()` ran
  first) **and** `options?.nameTemplate` is also passed to `create()` **and** the two
  function references differ, throw:
  `[typestyles] tokens.create('${namespace}', ...) was called with a different nameTemplate than tokens.declare('${namespace}', ...) used — pass the same nameTemplate to both, or omit it on create() to reuse the declared one.`
  This matches the existing style of dev-mode `throw` guards already in `createTokens`
  (e.g. the `layers`/`tokenLayer` pairing check).

### Declared-but-never-created namespaces

If `declare('x')` is called but `create('x', ...)` never runs, no CSS is ever emitted
for that namespace — same as never calling `create()` at all. Any `var(--…)` string
built from `x`'s declared proxy references a custom property that was never defined at
`:root`, which resolves the same way an ordinary undefined/typo'd custom property does
today (falls back to the property's CSS-wide initial behavior, or is invalid at
computed-value time, depending on where it's used). There's no reliable runtime hook to
detect "an app-lifetime declare() with no matching create()" in a browser session, so
this spec does not add detection for it — it's the same class of bug as a typo'd
namespace string is today, and equally visible (nothing shows up in the emitted CSS for
that namespace).

## Design: typed `@property` for dependent token values

`registered-property.ts`'s `isComputationallyIndependent` check stays — it's correct
per spec that `@property`'s `initial-value` cannot contain `var()`/`env()`. What changes
is what happens when it's `false`: instead of always skipping `@property` registration,
look up a syntax-appropriate **placeholder** to use as `initial-value`. This is legal
because `tokens.create()` already unconditionally emits the token's real (possibly
dependent) value as a separate `:root { --name: <value> }` declaration regardless of
whether `@property` registration succeeds — the cascade always prefers that explicit
declaration over `@property`'s `initial-value`, which only acts as a true fallback in
edge cases (`unset`, `revert-layer`, or before the stylesheet is parsed).

### Placeholder table

A small built-in table, keyed by syntax string (after stripping one optional trailing
`+` or `#` multiplier — a single item always satisfies "one or more", so the same
placeholder works for list syntaxes):

| Syntax                | Placeholder   |
| --------------------- | ------------- |
| `<color>`             | `transparent` |
| `<number>`            | `0`           |
| `<integer>`           | `0`           |
| `<length>`            | `0px`         |
| `<percentage>`        | `0%`          |
| `<length-percentage>` | `0px`         |
| `<angle>`             | `0deg`        |
| `<time>`              | `0s`          |
| `<resolution>`        | `0dpi`        |

Lookup only matches an **exact** trimmed syntax string (post multiplier-stripping)
against this table. Anything else — `<url>`, `<custom-ident>`, `<string>`,
`<transform-list>`, `|`-alternations, multi-component syntaxes like `<length> <length>`
— has no safe generic placeholder and is not guessed.

### Explicit override

`TokenDescriptor` gains an optional `initial` field:

```ts
export type TokenDescriptor = {
  value: string | number;
  syntax?: string;
  inherits?: boolean;
  initial?: string | number;
};
```

`registerAtPropertyRule`'s resolution order when `options.value` is not computationally
independent:

1. If an explicit `initial` was provided on the descriptor, use it.
2. Else, look up `options.syntax` in the placeholder table.
3. Else, fall back to today's behavior: skip `@property` registration, dev-mode
   `console.warn` (message updated to mention the `initial` escape hatch).

When a placeholder is found (1 or 2), emit the `@property` rule with that placeholder as
`initial-value` and the real `syntax`/`inherits` as given — the token is fully typed and
animatable. The unconditional `:root { --name: <real value> }` declaration is unchanged
and continues to carry the actual resolved value.

This applies uniformly regardless of how the dependent value was produced — via
`tokens.declare()`, cross-namespace `tokens.use()`, or a hand-written `var()` string —
since it only inspects the final `value`/`syntax` pair.

## Interaction between the two pieces

They're independent and land as separable pieces of work, but compose naturally: a
`declare()`-built reference used inside a `TokenDescriptor.value` is just a `var(--…)`
string like any other, so the `@property` placeholder logic applies to it exactly as it
would to a hand-written reference.

```ts
const color = tokens.declare<DesignColorValues>('color');

export const colorTokens = tokens.create('color', {
  accent: { default: '#0066ff' },
  danger: {
    default: {
      value: '#ef4444',
      syntax: '<color>',
      inherits: false,
    },
  },
  // Dependent + typed: registers @property with `initial-value: transparent`,
  // and :root gets the real color-mix() result.
  dangerSubtle: {
    value: `color-mix(in oklch, ${color.danger.default} 12%, transparent)`,
    syntax: '<color>',
    inherits: false,
  },
});
```

## Open implementation questions for the plan phase

- Exact file/function split: `declare()` and `createLooseTokenProxy` likely live in
  `tokens.ts` next to `createTokenProxy`; the placeholder table likely lives in
  `registered-property.ts` next to `isComputationallyIndependent`.
- Whether the dev-mode `nameTemplate` mismatch check needs a `WeakMap`/function-identity
  comparison caveat documented (arrow functions defined inline at each call site are
  never `===` equal even if behaviorally identical) — likely resolved by documenting
  "define your `nameTemplate` once and pass the same reference to both calls."
- Test coverage split between `tokens.test.ts` (declare/create naming agreement,
  self-reference end-to-end CSS output) and `registered-property.test.ts` (placeholder
  table, explicit `initial` override, fallback skip path).
