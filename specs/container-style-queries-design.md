---
title: Container style queries (`container.style()`)
status: draft
date: 2026-07-29
related: container.ts, css-primitives-design.md (PropertyRef precedent)
---

# Container style queries

## Problem

`@container style(--custom-prop: value)` reached Baseline Newly Available in May
2026 (Firefox 151 completed cross-browser coverage; Chrome/Edge since 111, Safari
since 18). It queries a container's computed **custom property** value — not yet
regular properties like `font-weight` in any engine — to conditionally style
descendants, e.g. reacting to a `--theme` or `--density` custom property set
higher up the tree.

TypeStyles already has real investment here: `container()` (`container.ts`) is a
typed helper for size-feature `@container` queries, and its own JSDoc already shows
the raw-string escape hatch being used for style queries today:

```ts
container('style(--theme: dark)'); // "@container style(--theme: dark)"
```

So style queries technically "work" already — untyped. The gap is **type safety**
tied to TypeStyles' own custom-property system: `styles.property.declare()`,
`ctx.vars.declare()`, and `tokens.declare()` all return `PropertyRef`s with known
names. Since browser support for style queries is custom-properties-only anyway,
this is a near-exact match for what TypeStyles already owns.

## Goals

- `container.style(ref, value?)` — a typed overload accepting a `PropertyRef` (from
  any of the three tiers above) instead of a hand-typed raw string.
- Zero new subsystem — this composes into the existing `container()` export.

## Non-goals

- No typed support for regular-property style queries — not implemented in any
  browser; stay silent and let the raw-string `container()` escape hatch cover it if
  browsers ship this later.
- No change to `container()`'s existing size-feature overloads.

## API

### `container.style(ref, value?)`

`container` becomes a callable-plus-namespace object (same `Object.assign` shape as
`styles.property` — see `css-primitives-design.md`'s `StylesPropertyFn`), adding
`.style` alongside the existing call signatures.

```ts
export function containerStyle(
  ref: PropertyRef | `--${string}`,
  value?: string | number,
): `@container style(${string})`;
```

```ts
containerStyle(themeVar, 'dark'); // "@container style(--scoped-theme: dark)"
containerStyle(darkModeFlag); // "@container style(--scoped-darkMode)" (boolean-style truthy query)
```

Accepts a raw `` `--${string}` `` too, for interop with hand-authored or
third-party custom properties not declared through TypeStyles — consistent with how
`container(rawCondition: string)` already accepts arbitrary strings today. Does not
require registration discipline (no throw if the name wasn't declared via
`styles.property`/`ctx.vars`/`tokens.declare`) — same "silent, plain custom props are
valid CSS" stance `css-primitives-design.md`'s validation matrix already takes for
`css.customProperty` on an undeclared name.

### Example

```ts
import { styles, tokens } from 'typestyles';

const theme = tokens.declare('theme', { mode: { syntax: '<custom-ident>' } });

styles.class('card', {
  base: { padding: '16px' },
  ...atRuleBlock(container.style(theme.mode, 'dark'), { background: '#1a1a2e' }),
});
```

## Implementation

| File                                        | Change                                                                                                                |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `packages/typestyles/src/container.ts`      | Add `containerStyle` function; `Object.assign` onto the exported `container` as `.style`                              |
| `packages/typestyles/src/container.test.ts` | Add cases                                                                                                             |
| `packages/typestyles/src/types.ts`          | Type intersection for `container`: `typeof container & { style: typeof containerStyle }` (mirrors `StylesPropertyFn`) |

No `insertRule`/serialization changes — style queries flow through the exact same
`atRuleBlock` + `serializeStyleExpanded`'s generic `@`-prefix handling that size
queries already use.

## Documentation

Add a "Style queries" subsection to the existing container-queries doc page,
cross-linking `tokens.declare` / `styles.property.declare` / `ctx.vars.declare` as
the `PropertyRef` sources. No new page needed — this is additive to existing docs.

## Testing

| Area                | Cases                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `container.style()` | `PropertyRef` input, raw `--name` string input, with/without value, boolean-style query              |
| Type test           | `container.style` callable alongside existing `container(...)` overloads without narrowing conflicts |

## Open design questions

- Timing: style queries only reached cross-browser Baseline in May 2026 — ship now,
  or wait for Widely Available? Recommend shipping now since the untyped escape hatch
  already works today and this is purely a typing improvement with no new runtime
  risk.
- Should passing a `PropertyRef` whose declared `syntax` obviously can't match the
  `value` given (e.g. `<number>` syntax, string value `'dark'`) warn in dev mode, or
  is that over-engineering for what's fundamentally a string-building helper?
