---
title: Typed `::`-pseudo-elements (`pseudoElement()`, `backdrop()`, `highlight()`) + popover pseudo-classes
status: draft
date: 2026-07-29
related: relational-pseudo.ts
---

# Typed `::`-pseudo-elements + popover pseudo-classes

## Problem

TypeStyles has typed builders for pseudo-**classes** used in relative-selector
position (`has()`, `is()`, `where()` in `relational-pseudo.ts`) but nothing for
`::`-pseudo-**elements**. Three newer features all need this same gap filled:

- **`::backdrop`** — styles the backdrop behind a **top-layer element**
  (`<dialog>`, or any element with `popover`). No typed helper exists for any
  `::`-pseudo-element in the codebase today.
- **Popover API** (`:popover-open`, `:open`) — Baseline Widely Available since April 2025. These are pseudo-**classes**, so they extend the existing `is()` machinery
  rather than needing new selector-builder code — but `relational-pseudo.ts`'s
  `IsPseudoArg` union doesn't include them yet.
- **CSS Custom Highlight API** (`::highlight(name)`) — Baseline widely available as
  of March 2026. The CSS half is exactly a pseudo-element with an argument; the
  registration half (`CSS.highlights.set(name, new Highlight(...))`) is imperative
  DOM/Range code, out of scope for a styling library.

Bundled into one spec because all three are small, mechanical additions to selector
typing, not new subsystems — and `pseudoElement()` becomes a reusable general
primitive rather than three bespoke one-offs (also future-proofs for
`::picker(select)` once Customizable Select matures past Baseline).

## Goals

- A general typed `::`-pseudo-element key builder, mirroring `has()`/`is()`/`where()`'s
  shape exactly.
- Named convenience wrappers for the two concrete cases in scope now: `backdrop()`
  and `highlight(name)`.
- Extend `IsPseudoArg` with `:popover-open` and `:open`.

## Non-goals

- **No markup/attribute helpers.** `popover`, `popovertarget`, `popovertargetaction`,
  `command`, `commandfor` are HTML attributes — out of scope, same boundary drawn
  around `attrs`/`data-*` elsewhere in the project (TypeStyles emits selectors and
  values; the host app sets attributes on DOM nodes). This boundary should be stated
  explicitly here so it isn't re-litigated in a future popover-focused request.
- **No `CSS.highlights` / `Range` API wrapper.** That's imperative JS/DOM state
  management, not style definition — genuinely out of scope for a CSS-in-TS styling
  library.
- **No Customizable Select (`::picker(select)`) helper in v1** — not Baseline as of
  2026 (Chrome 135 stable, Safari TP only, Firefox flagged). `pseudoElement()`
  generalizes cleanly to cover it later without a second bespoke API; tracked as a
  follow-up, not a v1 deliverable.

## API

### `pseudoElement(name, arg?)` — general builder

```ts
export type PseudoElementKey = `&::${string}`;

export function pseudoElement<const N extends string>(name: N): `&::${N}`;
export function pseudoElement<const N extends string, const A extends string>(
  name: N,
  arg: A,
): `&::${N}(${A})`;
```

```ts
pseudoElement('backdrop'); // "&::backdrop"
pseudoElement('highlight', 'search'); // "&::highlight(search)"
pseudoElement('marker'); // "&::marker"
```

Same file/module shape as `relational-pseudo.ts`'s existing builders: throws on an
empty `name`, no runtime validation of arbitrary pseudo-element names (consistent
with `has()`/`is()`/`where()` accepting any selector string — CSS-faithful output,
not a curated allowlist).

### `backdrop()` and `highlight(name)` — named convenience wrappers

```ts
export function backdrop(): '&::backdrop';
export function highlight<const N extends string>(name: N): `&::highlight(${N})`;
```

Thin wrappers over `pseudoElement` for the two cases with immediate use cases —
matches the project's pattern of small named helpers over a generic escape hatch
(`container()`'s object-form vs. raw-string-form is the same relationship).

### `IsPseudoArg` extension

```ts
export type IsPseudoArg =
  | ':hover' | ':active' | /* … existing entries … */
  | ':popover-open'
  | ':open';
```

Extending the existing union rather than a parallel `PopoverPseudoArg` — YAGNI, it's
one union and both selectors compose the same way through `is()`.

## Examples

```ts
import { styles, is, backdrop, highlight } from 'typestyles';

styles.class('menu', {
  base: { padding: '8px' },
  [is(':popover-open', ':open')]: { opacity: 1, transform: 'scale(1)' },
  [backdrop()]: { backdropFilter: 'blur(4px)', background: 'rgb(0 0 0 / 0.4)' },
});

// Custom Highlight API — CSS half only; registration is app code
styles.class('doc', {
  base: { fontFamily: 'serif' },
  [highlight('search-match')]: { background: 'yellow', color: 'black' },
});

// App code (out of scope, shown for context):
// CSS.highlights.set('search-match', new Highlight(...ranges));
```

Anchor + popover pairing example belongs in `anchor-positioning-design.md`'s docs,
not duplicated here — this spec covers the pure-CSS styling surface only.

## Implementation

| File                                                | Change                                             |
| --------------------------------------------------- | -------------------------------------------------- |
| `packages/typestyles/src/pseudo-element.ts`         | New — `pseudoElement`, `backdrop`, `highlight`     |
| `packages/typestyles/src/pseudo-element.test.ts`    | New                                                |
| `packages/typestyles/src/relational-pseudo.ts`      | Extend `IsPseudoArg` with `:popover-open`, `:open` |
| `packages/typestyles/src/relational-pseudo.test.ts` | Add cases for the two new pseudo-class arguments   |
| `packages/typestyles/src/index.ts`                  | Re-export `pseudoElement`, `backdrop`, `highlight` |

No `serialize-style.ts` changes — `&::name` keys already resolve correctly today
through `resolveNestedSelector`'s `key.includes('&')` branch (verify with a quick
test; the `&`-replace logic is selector-shape-agnostic).

## Documentation

Add a "Pseudo-elements" subsection to the existing selectors doc page (next to
`has()`/`is()`/`where()`), covering `backdrop()`, `highlight()`, the general
`pseudoElement()` escape hatch, the `IsPseudoArg` popover additions, and an explicit
callout of the markup-attribute boundary (no `popover`/`popovertarget` helpers, ever).

## Testing

| Area                         | Cases                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `pseudoElement()`            | with/without arg, empty-name throw                                                                 |
| `backdrop()` / `highlight()` | correct output strings                                                                             |
| `is()` with popover args     | `:popover-open`, `:open` compose correctly with other `is()` arguments                             |
| Serialization                | `&::backdrop` / `&::highlight(name)` keys resolve to correct selectors via `resolveNestedSelector` |

## Open design questions

- Should `pseudoElement()`'s generic form be publicly documented as the primary API
  with `backdrop()`/`highlight()` as sugar, or should docs lead with the named
  wrappers and treat `pseudoElement()` as the escape hatch (mirrors `container()`'s
  docs structure, which leads with the typed object form)?
- Does `highlight()` need a scoped-ref variant (`styles.highlightRef(label)`) given
  highlight names must be coordinated between the CSS selector and the
  `CSS.highlights.set(name, ...)` call site — or is a plain string sufficient since
  the registration call is already out of scope?
