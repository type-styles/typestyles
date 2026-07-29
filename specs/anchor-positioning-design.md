---
title: CSS anchor positioning (`createAnchorRef`, `anchor()`, `anchorSize()`, `positionTry()`)
status: draft
date: 2026-07-29
related: css-primitives-design.md, container.ts (createContainerRef precedent)
---

# CSS anchor positioning

## Problem

CSS Anchor Positioning (`anchor-name`, `position-anchor`, `anchor()`, `anchor-size()`,
`position-try-fallbacks`, `@position-try`) reached Baseline 2026 (Safari needed 18.4+
for full `@position-try` fallback behavior; core `anchor()`/`position-anchor` since
Safari 18.2, Chrome 125, Firefox 132). It lets tooltips, popovers, dropdowns, and menus
be positioned relative to an anchor element in pure CSS — no JS positioning engine
(Floating UI, Popper) required.

TypeStyles has no DX for it today. Left uncovered, users write raw strings:

```ts
styles.class('trigger', { anchorName: '--ts-tooltip-trigger' as any });
styles.class('tooltip', {
  positionAnchor: '--ts-tooltip-trigger' as any,
  top: 'anchor(--ts-tooltip-trigger bottom, 8px)',
});
```

No typo protection on the anchor name, no typed side/dimension keywords, no
`@position-try` fallback authoring story.

This is a good showcase feature: it's pure CSS (works unchanged in the zero-runtime
extraction path), requires no runtime JS, and directly displaces a real dependency
many TypeStyles users currently reach for.

## Goals

- Typed, scoped anchor-name references, consistent with `createContainerRef()`.
- Typed `anchor()` / `anchor-size()` value builders with keyword-checked sides/dimensions.
- A `positionTry()` helper for declaring `@position-try` fallback blocks, returning a
  typed ref usable in `position-try-fallbacks`.
- Works identically in runtime and build-extraction paths (all emission via `insertRule`).

## Non-goals

- No JS-based collision detection or repositioning — this is a pure-CSS wrapper.
- No opinion on tooltip/popover component behavior — pairs with, but doesn't require,
  the Popover API DX (see `typed-pseudo-elements-design.md`); markup attributes
  (`popover`, `popovertarget`) stay firmly out of scope, same boundary as elsewhere.
- No typed builder for the full CSS anchor-positioning grammar (e.g. combined
  `flip-block flip-inline` try-tactics) in v1 — raw strings remain a valid escape
  hatch for `positionTryFallbacks`.

## Important spec nuance: dashed-ident, not custom-ident

Unlike `container-name` (a plain `<custom-ident>`, e.g. `sidebar`), `anchor-name` and
`position-try-fallbacks` custom names are `<dashed-ident>` — they **must** start with
`--`, the same category as custom property names. `createAnchorRef()` therefore returns
a `--`-prefixed string, not a bare identifier like `createContainerRef()` does. This
distinction should be called out in docs so it isn't "fixed" to match `container-name`
later.

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

`styles.anchorRef(label)` on a `createStyles()` instance is the scoped shorthand,
mirroring `styles.containerRef(label)`.

### `anchor(ref, side, fallback?)`

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

export function anchor(ref: AnchorNameRef, side: AnchorSide, fallback?: CssMathValue): string;
```

```ts
anchor(tooltipAnchor, 'bottom'); // "anchor(--ts-tooltip-trigger bottom)"
anchor(tooltipAnchor, 'bottom', '8px'); // "anchor(--ts-tooltip-trigger bottom, 8px)"
```

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

Both `anchor()` and `anchorSize()` live in `css-math.ts` alongside `calc`/`clamp` — they
share the "wrap the interpolated expression in a named CSS function" shape and the
`CssMathValue` fallback type.

### `positionTry(name, properties, options?)`

Declares an `@position-try` block via `insertRule` and returns a typed ref for
`position-try-fallbacks`.

```ts
export type PositionTryRef = `--${string}` & { readonly __positionTryRef?: true };

export type PositionTryProperties = Pick<
  CSSProperties,
  | 'positionAnchor'
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'insetBlockStart'
  | 'insetBlockEnd'
  | 'insetInlineStart'
  | 'insetInlineEnd'
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

```ts
const flipUp = positionTry('flip-up', {
  top: 'auto',
  bottom: anchor(tooltipAnchor, 'top', '8px'),
});
// Emits: @position-try --ts-flip-up { top: auto; bottom: anchor(--ts-tooltip-trigger top, 8px); }
// Returns: "--ts-flip-up"
```

Serialization reuses the existing declaration formatter (`formatDeclaration` from
`serialize-style.ts`) — no nested selectors or at-rules permitted inside a
`PositionTryProperties` object (matches `@position-try`'s restricted grammar).

Dedup/HMR: keyed as `@position-try:${fullName}` in `insertRule`, same
conflict-detection semantics as `@property` (identical re-registration is a no-op).

### `positionTryFallbacks(...entries)`

```ts
export type PositionTryTactic = 'flip-block' | 'flip-inline' | 'flip-start' | 'none';

export function positionTryFallbacks(...entries: (PositionTryRef | PositionTryTactic)[]): string;
```

List entries are **bare dashed-idents** (like `will-change` accepting property
names), not `var()`-wrapped references:

```ts
positionTryFallbacks(flipUp, 'flip-block');
// "--ts-flip-up, flip-block"

styles.class('tooltip', {
  positionAnchor: tooltipAnchor,
  top: anchor(tooltipAnchor, 'bottom', '8px'),
  positionTryFallbacks: positionTryFallbacks(flipUp, 'flip-block'),
});
```

Combined tactics (`flip-block flip-inline` space-separated on one entry) aren't
type-modeled in v1 — pass a raw string as one of the array entries; the function joins
with `, ` and does not validate entry internals.

### `position-visibility`

Plain keyword property (`always` | `anchors-visible` | `no-overflow`) — no typed helper
needed beyond correct `CSSProperties` typing (verify base type coverage at
implementation time; add if missing from the underlying `csstype`-derived types).

## Full example

```ts
import {
  styles,
  createAnchorRef,
  anchor,
  anchorSize,
  positionTry,
  positionTryFallbacks,
} from 'typestyles';

const tooltipAnchor = createAnchorRef('tooltip-trigger');

styles.class('trigger', { anchorName: tooltipAnchor });

const flipUp = positionTry('flip-up', {
  top: 'auto',
  bottom: anchor(tooltipAnchor, 'top', '8px'),
});

styles.class('tooltip', {
  position: 'fixed',
  positionAnchor: tooltipAnchor,
  top: anchor(tooltipAnchor, 'bottom', '8px'),
  left: anchor(tooltipAnchor, 'center'),
  minWidth: anchorSize(tooltipAnchor, 'width'),
  positionTryFallbacks: positionTryFallbacks(flipUp, 'flip-block'),
});
```

## Implementation

| File                                       | Change                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/typestyles/src/anchor.ts`        | New — `createAnchorRef`, `AnchorNameRef`, `positionTry`, `PositionTryRef`, `positionTryFallbacks`                                       |
| `packages/typestyles/src/anchor.test.ts`   | New                                                                                                                                     |
| `packages/typestyles/src/css-math.ts`      | Add `anchor()`, `anchorSize()` (shares `CssMathValue`)                                                                                  |
| `packages/typestyles/src/css-math.test.ts` | Add cases                                                                                                                               |
| `packages/typestyles/src/styles.ts`        | `styles.anchorRef(label)` instance method, mirrors `containerRef`                                                                       |
| `packages/typestyles/src/types.ts`         | Verify `anchorName`, `positionAnchor`, `positionTryFallbacks`, `positionVisibility` are present on base `CSSProperties`; add if missing |
| `packages/typestyles/src/index.ts`         | Re-export `createAnchorRef`, `anchor`, `anchorSize`, `positionTry`, `positionTryFallbacks`, `AnchorNameRef`, `PositionTryRef`           |

## Documentation

New doc page: `docs/content/docs/anchor-positioning.md`. Sections: anchor refs, `anchor()`/
`anchorSize()`, `@position-try` fallbacks, a full tooltip example, a note on the
dashed-ident distinction from `container-name`, and a link to the popover pairing
example in the typed-pseudo-elements doc once that lands. Cross-link from
`api-reference.md`.

## Testing

| Area                        | Cases                                                                        |
| --------------------------- | ---------------------------------------------------------------------------- |
| `createAnchorRef`           | `--` prefix, scopeId vs prefix, empty label throws, sanitization             |
| `anchor()` / `anchorSize()` | with/without fallback, all side/dimension keywords                           |
| `positionTry()`             | emits correct `@position-try` CSS, dedup on identical re-declare, key scheme |
| `positionTryFallbacks()`    | ref + tactic mixing, join order                                              |
| Extraction                  | anchor/position-try calls extracted like `tokens.create` (build smoke test)  |

## Open implementation questions

- Should `positionTry()` validate that only allowed properties are passed (throw in
  dev) or silently serialize whatever's given, consistent with how `@keyframes`
  silently drops non-plain keys?
- Confirm exact `AnchorSideKeyword` / `AnchorSizeDimension` unions against the current
  spec text before locking types — anchor positioning gained sub-features
  incrementally and the keyword lists should be double-checked, not assumed from
  research.
- Whether `styles.anchorRef` deserves an options-free instance shorthand only, or
  should also expose the module-level `createAnchorRef` for non-instance use (matching
  how both `createContainerRef` and `styles.containerRef` coexist today).
