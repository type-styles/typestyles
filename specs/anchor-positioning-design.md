---
title: CSS anchor positioning (`createAnchorRef`, `anchor()`, `anchorSize()`, `positionArea`, `positionTry()`)
status: draft
date: 2026-07-29
related: css-primitives-design.md, container.ts (createContainerRef precedent), scroll-animations-design.md (CreateAnchorRefOptions)
---

# CSS anchor positioning

## Problem

CSS Anchor Positioning (`anchor-name`, `position-anchor`, `position-area`, `anchor()`,
`anchor-size()`, `position-try-fallbacks`, `@position-try`) reached Baseline 2026
(Safari needed 18.4+ for full `@position-try` fallback behavior; core
`anchor()`/`position-anchor` since Safari 18.2, Chrome 125, Firefox 132). It lets
tooltips, popovers, dropdowns, and menus be positioned relative to an anchor element in
pure CSS — no JS positioning engine (Floating UI, Popper) required.

TypeStyles has no DX for it today. Left uncovered, users write raw strings:

```ts
styles.class('trigger', { anchorName: '--ts-tooltip-trigger' as any });
styles.class('tooltip', {
  positionAnchor: '--ts-tooltip-trigger' as any,
  top: 'anchor(--ts-tooltip-trigger bottom, 8px)',
});
```

No typo protection on the anchor name, no typed side/dimension keywords, no
`position-area` keyword coverage, no `@position-try` fallback authoring story.

This is a good showcase feature: it's pure CSS (works unchanged in the zero-runtime
extraction path), requires no runtime JS, and directly displaces a real dependency
many TypeStyles users currently reach for.

**Spec drift note:** anchor positioning syntax evolved after Chrome 125 (`inset-area` →
`position-area`, `position-try-options` → `position-try-fallbacks`). `position-area`
was added as an additional, more concise way to write `@position-try` bodies — it did
**not** replace or narrow the inset/margin/sizing/self-alignment descriptors, which
remain valid. This spec targets the **2025–2026 grammar**, including both forms.

## Goals

- Typed, scoped `anchor-name` references — same scoping/sanitization as
  `createContainerRef()`, with a `--`-prefixed dashed-ident return shape (not a bare
  custom-ident).
- Typed `anchor()` / `anchor-size()` value builders with keyword-checked sides/dimensions.
- Typed `position-area` values on `CSSProperties` (grid-based positioning — the common
  case since Chrome 129).
- A `positionTry()` helper for declaring `@position-try` fallback blocks (insets,
  margins, sizing, self-alignment, `position-anchor`, and `position-area`), returning a
  typed ref for `position-try-fallbacks`.
- Works identically in runtime and build-extraction paths (all emission via `insertRule`).

## Non-goals

- No JS-based collision detection or repositioning — this is a pure-CSS wrapper.
- No opinion on tooltip/popover component behavior — pairs with, but doesn't require,
  the Popover API DX (see `typed-pseudo-elements-design.md`); markup attributes
  (`popover`, `popovertarget`) stay firmly out of scope, same boundary as elsewhere.
- No typed builder for the full `position-area` grammar in v1 (all `span-*` combinations,
  coordinate aliases, etc.) — export a partial keyword union plus `string` escape hatch.
- No typed builder for combined try-tactics (`flip-block flip-inline`) in v1 — pass a
  raw `string` entry to `positionTryFallbacks()`.

## Important spec nuance: dashed-ident, not custom-ident

Unlike `container-name` (a plain `<custom-ident>`, e.g. `sidebar`), `anchor-name` and
`position-try-fallbacks` custom names are `<dashed-ident>` — they **must** start with
`--`, the same category as custom property names. `createAnchorRef()` therefore returns
a `--`-prefixed string, not a bare identifier like `createContainerRef()` does. This
distinction should be called out in docs so it isn't "fixed" to match `container-name`
later. `CreateAnchorRefOptions` is shared with `createScrollTimelineRef()` /
`createViewTimelineRef()` in `scroll-animations-design.md`.

## API

### `createAnchorRef(label, options?)`

```ts
export type AnchorNameRef = `--${string}` & { readonly __anchorNameRef?: true };

export type CreateAnchorRefOptions = {
  /** `{scopeId}-{label}` when set (sanitized), same shape as `createContainerRef`. */
  scopeId?: string;
  /** Used only if `scopeId` is empty: `{prefix}-{label}`. Default `ts`. */
  prefix?: string;
};

export function createAnchorRef(label: string, options?: CreateAnchorRefOptions): AnchorNameRef;
```

Implementation mirrors `createContainerRef` exactly (`sanitizeClassSegment`, throw on
empty label) with one difference: the returned string is prefixed with `--`.

```ts
createAnchorRef('tooltip-trigger'); // "--ts-tooltip-trigger"
createAnchorRef('tooltip-trigger', { scopeId: 'my-app' }); // "--my-app-tooltip-trigger"
```

Both module-level `createAnchorRef()` and `styles.anchorRef(label)` coexist — same
pattern as `createContainerRef` / `styles.containerRef`.

### Property value typing — already covered by csstype, no `types.ts` changes

The installed `csstype` version (3.2.3+) already fully types these properties via its
public `Property` and `DataType` namespaces (`export namespace Property` /
`export namespace DataType` in `csstype`'s `index.d.ts`), and `types.ts` already does
`import type * as CSS from 'csstype'`:

- `CSS.Property.AnchorName = Globals | "none" | (string & {})`
- `CSS.Property.PositionAnchor = Globals | "auto" | (string & {})`
- `CSS.Property.PositionArea = Globals | CSS.DataType.PositionArea | "none"` —
  `DataType.PositionArea` is a ~35-keyword union covering every axis and `span-*`
  keyword (more complete than a hand-rolled union would be, and maintained upstream).
- `CSS.Property.PositionVisibility = Globals | "always" | "anchors-valid" | "anchors-visible" | "no-overflow" | (string & {})`
- `CSS.Property.PositionTryFallbacks = Globals | CSS.DataType.TryTactic | CSS.DataType.PositionArea | "none" | (string & {})`

Every one of these unions includes `(string & {})` — TypeScript's "branded string"
widening idiom — so `AnchorNameRef` (a `` `--${string}` `` subtype of `string`) is
already assignable without `as any`. **No new types are defined for these property
values; no `types.ts` changes are needed.** This also means `PositionTryTactic` (used
only by `positionTryFallbacks()`'s parameter type below, not as a `CSSProperties`
value) is the only hand-authored keyword union in this spec — kept because it
documents `flip-x`/`flip-y` per the current CSS spec text even though the installed
csstype's `DataType.TryTactic` doesn't list them yet (its own `(string & {})` member
means this is a documentation/autocomplete gap in the upstream package, not a
type-check failure).

For authoring `position-area` values with autocomplete, reference `CSS.DataType.PositionArea`
directly rather than duplicating its members:

```ts
import type * as CSS from 'csstype';
export type PositionAreaKeyword = CSS.DataType.PositionArea;
```

### `anchor(ref?, side, fallback?)`

```ts
export type AnchorSideKeyword =
  | 'inside'
  | 'outside'
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'start'
  | 'end'
  | 'self-start'
  | 'self-end'
  | 'center';

export type AnchorSide = AnchorSideKeyword | `${number}%`;

export function anchor(side: AnchorSide, fallback?: CssMathValue): string;
export function anchor(ref: AnchorNameRef, side: AnchorSide, fallback?: CssMathValue): string;
```

```ts
anchor(tooltipAnchor, 'bottom'); // "anchor(--ts-tooltip-trigger bottom)"
anchor(tooltipAnchor, 'bottom', '8px'); // "anchor(--ts-tooltip-trigger bottom, 8px)"
anchor('bottom', '8px'); // "anchor(bottom, 8px)" — omits name; uses position-anchor on the element
```

The ref-less overload omits `<anchor-name>` in the CSS function when `position-anchor` is
already set on the same element (common inside `@position-try` blocks that set
`positionAnchor`).

Both `anchor()` and `anchorSize()` live in `css-math.ts` alongside `calc`/`clamp` — they
share the "wrap the interpolated expression in a named CSS function" shape and the
`CssMathValue` fallback type.

**Export naming:** top-level `anchor` matches the CSS function name. It's unambiguous in
the `typestyles` import namespace (distinct from internal override "anchor" selector
terminology).

### `anchorSize(ref, dimension, fallback?)`

```ts
export type AnchorSizeDimension =
  | 'width'
  | 'height'
  | 'block'
  | 'inline'
  | 'self-block'
  | 'self-inline';

export function anchorSize(
  ref: AnchorNameRef,
  dimension: AnchorSizeDimension,
  fallback?: CssMathValue,
): string;
```

```ts
anchorSize(tooltipAnchor, 'width'); // "anchor-size(--ts-tooltip-trigger width)"
anchorSize(tooltipAnchor, 'width', '200px'); // "anchor-size(--ts-tooltip-trigger width, 200px)"
```

`anchor-size()` is valid on the positioned element's sizing properties. It is **not**
an accepted `@position-try` descriptor in the current spec — do not emit it inside
`positionTry()` blocks.

### `positionTry(name, properties, options?)`

Declares an `@position-try` block via `insertRule` and returns a typed ref for
`position-try-fallbacks`.

**Current spec grammar:** `@position-try` accepts `position-anchor`, `position-area`,
inset properties (`top`/`left`/`right`/`bottom`, `inset-block-*`, `inset-inline-*`,
`inset`), margin properties, sizing properties (`width`/`height`/`min-*`/`max-*`), and
self-alignment properties (`align-self`/`justify-self`, typically with
`anchor-center`). `position-area` is additive, not a replacement for the inset-based
form — both remain valid inside the at-rule (verified against MDN's `@position-try`
descriptor list; an earlier draft of this spec incorrectly narrowed this to two
properties).

```ts
export type PositionTryRef = `--${string}` & { readonly __positionTryRef?: true };

export type PositionTryProperties = Pick<
  CSSProperties,
  | 'positionAnchor'
  | 'positionArea'
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'insetBlockStart'
  | 'insetBlockEnd'
  | 'insetInlineStart'
  | 'insetInlineEnd'
  | 'inset'
  | 'width'
  | 'height'
  | 'minWidth'
  | 'minHeight'
  | 'maxWidth'
  | 'maxHeight'
  | 'margin'
  | 'marginTop'
  | 'marginRight'
  | 'marginBottom'
  | 'marginLeft'
  | 'justifySelf'
  | 'alignSelf'
>;

export function positionTry(
  name: string,
  properties: PositionTryProperties,
  options?: CreateAnchorRefOptions,
): PositionTryRef;
```

`styles.positionTry(name, properties)` on a `createStyles()` instance passes `scopeId` /
`prefix` from the instance naming config (mirrors scoped ref shorthands).

```ts
const scrollableEnd = positionTry('bottom-scrollable', {
  positionArea: 'block-end span-all',
});
// Emits: @position-try --ts-bottom-scrollable { position-area: block-end span-all; }
// Returns: "--ts-bottom-scrollable"
```

Serialization reuses `formatDeclaration` from `serialize-style.ts` — no nested selectors
or at-rules inside `PositionTryProperties`.

**Consistency rule (document, don't enforce):** base styles and `@position-try` fallbacks
must use the **same positioning method** — if the base position uses `position-area`,
fallbacks must too (not `top`/`anchor()` insets). Mixing methods produces fallbacks that
don't apply as expected.

`positionTry()` uses type-only property restriction via `PositionTryProperties` — no
runtime throw for extra keys (same passthrough stance as `@keyframes` dropping non-plain
keys if callers spread wider objects).

Dedup/HMR: keyed as `@position-try:${fullName}` in `insertRule`, same
conflict-detection semantics as `@property` (identical re-registration is a no-op).

### `positionTryFallbacks(...entries)`

```ts
export type PositionTryTactic =
  | 'flip-block'
  | 'flip-inline'
  | 'flip-start'
  | 'flip-x'
  | 'flip-y'
  | 'none';

export type PositionTryFallbackEntry =
  | PositionTryRef
  | PositionTryTactic
  | PositionAreaKeyword
  | string;

export function positionTryFallbacks(...entries: PositionTryFallbackEntry[]): string;
```

List entries are **bare tokens** (dashed-idents, try-tactics, `position-area` keywords) —
not `var()`-wrapped:

```ts
positionTryFallbacks(scrollableEnd, 'flip-block', 'block-start');
// "--ts-bottom-scrollable, flip-block, block-start"

positionTryFallbacks('flip-block flip-inline'); // combined tactic — raw string entry
```

Most flip positioning needs only try-tactics or `position-area` keywords in
`position-try-fallbacks` — `@position-try` is for custom named options (e.g.
scrollable spanning areas).

## Examples

### Tooltip with `position-area` (recommended)

```ts
import { styles, createAnchorRef, positionTry, positionTryFallbacks } from 'typestyles';

const tooltipAnchor = createAnchorRef('tooltip-trigger');

styles.class('trigger', { anchorName: tooltipAnchor });

styles.class('tooltip', {
  position: 'fixed',
  positionAnchor: tooltipAnchor,
  positionArea: 'block-end',
  margin: 0, // reset popover UA defaults that fight position-area
  positionTryFallbacks: positionTryFallbacks('block-start', 'flip-block'),
});
```

### Tooltip with inset + `anchor()` (fine-grained control)

```ts
import { styles, createAnchorRef, anchor, anchorSize } from 'typestyles';

const tooltipAnchor = createAnchorRef('tooltip-trigger');

styles.class('trigger', { anchorName: tooltipAnchor });

styles.class('tooltip', {
  position: 'fixed',
  positionAnchor: tooltipAnchor,
  top: anchor(tooltipAnchor, 'bottom', '8px'),
  left: anchor(tooltipAnchor, 'center'),
  minWidth: anchorSize(tooltipAnchor, 'width'),
  positionTryFallbacks: positionTryFallbacks('flip-block'),
});
```

### Named `@position-try` fallback

```ts
const scrollableEnd = positionTry('bottom-scrollable', {
  positionArea: 'block-end span-all',
});

styles.class('menu', {
  position: 'fixed',
  positionAnchor: menuAnchor,
  positionArea: 'block-end',
  positionTryFallbacks: positionTryFallbacks('flip-block', scrollableEnd),
});
```

## Implementation

| File                                       | Change                                                                                                                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/typestyles/src/anchor.ts`        | New — refs, `positionTry`, `positionTryFallbacks`, `PositionAreaKeyword` (alias of `CSS.DataType.PositionArea`)                                                                          |
| `packages/typestyles/src/anchor.test.ts`   | New                                                                                                                                                                                      |
| `packages/typestyles/src/css-math.ts`      | Add `anchor()`, `anchorSize()` (shares `CssMathValue`)                                                                                                                                   |
| `packages/typestyles/src/css-math.test.ts` | Add cases                                                                                                                                                                                |
| `packages/typestyles/src/styles.ts`        | `styles.anchorRef(label)` / `styles.positionTry(name, properties)`                                                                                                                       |
| `packages/typestyles/src/types.ts`         | No changes — `anchorName`, `positionAnchor`, `positionArea`, `positionVisibility`, `positionTryFallbacks` are already fully typed via `csstype` 3.2.3's `Property`/`DataType` namespaces |
| `packages/typestyles/src/index.ts`         | Re-export refs, builders, `positionTry`, `positionTryFallbacks`, `PositionTryTactic`, `PositionAreaKeyword`                                                                              |

No changes needed to `serialize-style.ts` or `global.ts`.

## Documentation

New doc page: `docs/content/docs/anchor-positioning.md`. Sections:

- Anchor refs and the dashed-ident distinction from `container-name`
- **`position-area`** (grid positioning — start here) vs inset + `anchor()` (fine control)
- **Consistency rule:** same positioning method in base styles and `@position-try`
- `@position-try` + `positionTryFallbacks` (tactics, area keywords, named tries)
- `anchor()` ref-less overload when `position-anchor` is set
- Full tooltip examples (above)
- Popover pairing cross-link from `typed-pseudo-elements-design.md`
- Cross-link **`scroll-animations.md`** (`CreateAnchorRefOptions` shared with timeline refs)

Cross-link from `api-reference.md`.

## Testing

| Area                               | Cases                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `createAnchorRef`                  | `--` prefix, scopeId vs prefix, empty label throws, sanitization                     |
| `styles.anchorRef` / `positionTry` | scoping matches `containerRef`                                                       |
| `anchor()` / `anchorSize()`        | with/without ref, with/without fallback, all side/dimension keywords                 |
| `positionTry()`                    | emits `position-area` / `position-anchor` only; dedup; key scheme                    |
| `positionTryFallbacks()`           | ref + tactic + area keyword mixing; combined tactic raw string; join order           |
| Property keywords                  | `anchorName: 'none'`, `positionAnchor: 'auto' \| 'none'`                             |
| Examples / docs                    | `position-area` base + `flip-block` fallback; no mixed inset/area in `@position-try` |
| Extraction                         | anchor/position-try calls extracted like `tokens.create` (build smoke test)          |

## Pre-implementation checklist

Before locking types, re-verify against the current [CSS Anchor Positioning](https://drafts.csswg.org/css-anchor-position/) text:

- `AnchorSideKeyword` / `AnchorSizeDimension` unions (hand-authored — `anchor()`/`anchor-size()`
  are value builders, not `CSSProperties` fields, so csstype doesn't cover them)
- `PositionAreaKeyword` — aliased to `CSS.DataType.PositionArea` from the installed
  `csstype` version; re-check that alias still matches the spec if `csstype` is
  upgraded, rather than re-verifying a hand-rolled list
- `PositionTryTactic` (`flip-x` / `flip-y` were added after initial Chromium ship; not
  yet in installed `csstype`'s `DataType.TryTactic` — still valid via `(string & {})`)
- `@position-try` accepted descriptors (`position-anchor`, `position-area`, insets,
  margins, sizing, self-alignment — confirm no further changes since this spec)
