---
title: Scroll-driven animations (`scroll()`, `view()`, named timelines, `animationRange`) + `entryTransition()`
status: draft
date: 2026-07-29
related: keyframes.ts, css-math.ts, anchor-positioning-design.md (dashed-ident ref precedent)
---

# Scroll-driven animations + `@starting-style` entry transitions

## Problem

CSS scroll-driven animations (`animation-timeline: scroll()` / `view()`,
`scroll-timeline-name`, `view-timeline-name`, `animation-range`) let scroll
progress or element visibility drive a `@keyframes` animation with zero JS —
scroll progress bars, reveal-on-scroll, parallax. Support: Chrome/Edge 115+,
Safari 18+, Firefox 132+ (~84%+ coverage; not yet Baseline due to Firefox's later
rollout, but safe as progressive enhancement — unsupported browsers simply don't
run the animation).

`@starting-style` (Baseline Newly Available, ~85–90% coverage) is the paired concern:
it's what makes `display: none → block` and `content-visibility` transitions
animatable — the standard mechanism for popover/dialog _entry_ animations. TypeStyles
already supports it today as a bare primitive (`serializeStyleExpanded` treats any
`@`-prefixed object key generically, so `atRuleBlock('@starting-style', {...})`
already works with zero code changes) — but there's no ergonomic wrapper for the
common "from X, transition to Y, allow-discrete" pattern.

Both are bundled in one spec because they're the two pieces of "animate a UI state
change without JS" and both compose with `keyframes.create()`.

## Goals

- Typed value builders for `scroll()` / `view()` (anonymous/inline timelines — the
  common case, zero extra element coordination).
- Named-timeline refs (`scroll-timeline-name` / `view-timeline-name`) for when the
  animated element isn't a descendant of the scroller.
- A typed `animationRange()` builder for the common named-range-with-offset patterns.
- `entryTransition()` — a thin convenience composing `@starting-style` +
  `transition-behavior: allow-discrete`, following the existing `atRuleBlock` pattern.

## Non-goals

- No `@starting-style` subsystem beyond `entryTransition()` — the raw primitive
  already works via `atRuleBlock('@starting-style', {...})`; document that path too,
  don't hide it behind the wrapper.
- No `calc-size()`/`interpolate-size` helpers in v1 — Chrome/Edge-only as of 2026,
  too early to commit DX to (tracked as a `css-math.ts` follow-up, not a spec item).
- No `timeline-scope` typed helper in v1 — raw string/`insertRule` remains the escape
  hatch for the (rarer) cross-boundary named-timeline case; revisit if usage shows
  it's common.

## API

### Anonymous timelines — `scroll()` / `view()`

```ts
export type ScrollTimelineScroller = 'nearest' | 'root' | 'self';
export type ScrollTimelineAxis = 'block' | 'inline' | 'x' | 'y';

export function scroll(options?: {
  scroller?: ScrollTimelineScroller;
  axis?: ScrollTimelineAxis;
}): string;

export function view(options?: {
  axis?: ScrollTimelineAxis;
  inset?: CssMathValue | [CssMathValue, CssMathValue];
}): string;
```

```ts
scroll(); // "scroll()"
scroll({ axis: 'block' }); // "scroll(block)"
scroll({ scroller: 'nearest', axis: 'block' }); // "scroll(nearest block)"
view({ inset: '20%' }); // "view(20%)"
view({ axis: 'block', inset: ['10%', '20%'] }); // "view(block 10% 20%)"
```

These live in `scroll-animations.ts` — same "typed function-value builder" shape as
`calc`/`clamp`/`anchor`/`anchorSize` in `css-math.ts`, but in a separate module
because timelines are not math-shaped. Cross-reference in docs only; no `css-math.ts`
changes.

**Export naming:** top-level `scroll` and `view` match the CSS function names for
discoverability and parity with MDN. The names are generic (`view` especially), but
they're unambiguous in the `typestyles` import namespace and tree-shake independently;
`scrollTimeline()` / `viewTimeline()` aliases are not planned for v1. Do not confuse
`view()` with `viewTransition` from `view-transitions-design.md` — that namespace is
for the **View Transitions API** (`::view-transition-*` pseudo-elements), not scroll
view timelines. Cross-link both doc pages.

### Named timelines — `createScrollTimelineRef`, `createViewTimelineRef`

`scroll-timeline-name` and `view-timeline-name` are `<dashed-ident>` (same category
as `anchor-name` — must start with `--`), so these mirror `createAnchorRef()`, not
`createContainerRef()`. Options type: `CreateAnchorRefOptions` from
`anchor-positioning-design.md`.

```ts
export type ScrollTimelineRef = `--${string}` & { readonly __scrollTimelineRef?: true };
export type ViewTimelineRef = `--${string}` & { readonly __viewTimelineRef?: true };

export function createScrollTimelineRef(
  label: string,
  options?: CreateAnchorRefOptions,
): ScrollTimelineRef;
export function createViewTimelineRef(
  label: string,
  options?: CreateAnchorRefOptions,
): ViewTimelineRef;
```

```ts
const progress = createScrollTimelineRef('article-progress');

// Declared on the scroller
styles.class('article', {
  scrollTimelineName: progress,
  scrollTimelineAxis: 'block',
});

// Consumed on any element (named timelines aren't limited to descendants)
styles.class('progress-bar', {
  animationName: fillBar,
  animationTimeline: progress,
  animationRange: animationRange('0%', '100%'),
});
```

Named **view** timeline (symmetric to scroll — declare on the observed element, consume
on the animated element or the same element):

```ts
const reveal = createViewTimelineRef('hero-reveal');

styles.class('hero', {
  viewTimelineName: reveal,
  viewTimelineAxis: 'block',
  viewTimelineInset: '10%',
  animationName: fadeIn,
  animationTimeline: reveal,
  animationRange: animationRange('entry 0%', 'entry 100%'),
});
```

### `animationTimeline` value typing

Branded refs are only useful if `animationTimeline` accepts them at the property
boundary:

```ts
export type AnimationTimelineValue =
  | string
  | ScrollTimelineRef
  | ViewTimelineRef
  | ReturnType<typeof scroll>
  | ReturnType<typeof view>;
```

`animationTimeline` on base `CSSProperties` should be narrowed to
`AnimationTimelineValue` (or a compatible union) so passing a ref or builder return
value is typed without `as any`.

**Range pairing:** `cover`, `contain`, `entry`, `exit`, `entry-crossing`, and
`exit-crossing` are **view-timeline** range names — pair them with `view()` or a
`ViewTimelineRef`. Scroll progress timelines (`scroll()` or `ScrollTimelineRef`) use
length/percentage ranges (e.g. `'0%'`, `'100%'`) or `normal`, not `entry`/`cover`.

### `animationRange(start, end?)`

```ts
export type AnimationRangeName =
  | 'cover'
  | 'contain'
  | 'entry'
  | 'exit'
  | 'entry-crossing'
  | 'exit-crossing';
export type AnimationRangeValue =
  | 'normal'
  | AnimationRangeName
  | `${AnimationRangeName} ${string}`
  | CssMathValue;

export function animationRange(start: AnimationRangeValue, end?: AnimationRangeValue): string;
```

```ts
animationRange('entry 0%', 'entry 100%'); // "entry 0% entry 100%"
animationRange('cover 25%', 'cover 75%'); // "cover 25% cover 75%"
animationRange('entry'); // "entry" — end omitted, single value passed through
animationRange('0%', '100%'); // "0% 100%" — scroll-timeline progress range
```

No inner validation of offset units or range-name pairing — same passthrough stance
as `calc`/`clamp`.

### Reveal-on-scroll (`view()` + view ranges)

```ts
import { styles, keyframes, view, animationRange } from 'typestyles';

const fadeIn = keyframes.create('fade-in', { from: { opacity: 0 }, to: { opacity: 1 } });

styles.class('hero', {
  animationName: fadeIn,
  animationTimeline: view({ axis: 'block' }),
  animationRange: animationRange('entry 25%', 'entry 75%'),
});
```

### Scroll progress (`scroll()` + progress ranges)

```ts
import { styles, keyframes, scroll, animationRange } from 'typestyles';

const fillBar = keyframes.create('fill-bar', { from: { width: '0%' }, to: { width: '100%' } });

styles.class('progress-bar', {
  animationName: fillBar,
  animationTimeline: scroll({ axis: 'block' }),
  animationRange: animationRange('0%', '100%'),
});
```

### `entryTransition(config)`

```ts
export function entryTransition(config: {
  from: CSSProperties;
  to: CSSProperties;
  transition: string;
}): CSSProperties;
```

Composes the existing `atRuleBlock` helper — no new `insertRule` plumbing:

```ts
function entryTransition(config) {
  return {
    ...config.to,
    transition: config.transition,
    ...atRuleBlock('@starting-style', config.from),
  };
}
```

```ts
styles.class('popover', {
  ...entryTransition({
    from: { opacity: 0, scale: 0.95, display: 'none' },
    to: { opacity: 1, scale: 1, display: 'block' },
    transition:
      'opacity 200ms, scale 200ms, display 200ms allow-discrete, overlay 200ms allow-discrete',
  }),
});
```

`config.transition` always wins over `config.to.transition` — spread order is
`...config.to`, then `transition: config.transition`, then the `@starting-style` block
(which cannot collide with top-level longhands).

Deliberately requires an explicit `transition` string rather than auto-deriving it
from `to`'s keys — matches TypeStyles' "no runtime magic" stance (see `css-math.ts`'s
"no validation of inner syntax" precedent) and avoids silently omitting properties a
caller forgot to list.

**Safari caveat** (documented, not solved by TypeStyles): Safari lacks
`overlay: allow-discrete`, so _closing_ animations for popovers/dialogs fall back to
instant in Safari even with this helper. Note it in docs; not a TypeStyles bug.

## Implementation

| File                                                | Change                                                                                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/typestyles/src/scroll-animations.ts`      | New — `scroll`, `view`, refs, `animationRange`                                                                                                             |
| `packages/typestyles/src/scroll-animations.test.ts` | New                                                                                                                                                        |
| `packages/typestyles/src/starting-style.ts`         | New — `entryTransition` only (~10 lines today; separate from scroll-animations so `@starting-style` helpers can grow without bloating the timeline module) |
| `packages/typestyles/src/starting-style.test.ts`    | New                                                                                                                                                        |
| `packages/typestyles/src/css-math.ts`               | No change — scroll/view are separate file since they're timeline-shaped, not calc-shaped; cross-reference in docs only                                     |
| `packages/typestyles/src/styles.ts`                 | `styles.scrollTimelineRef(label)` / `styles.viewTimelineRef(label)`, mirroring `containerRef`/`anchorRef`                                                  |
| `packages/typestyles/src/types.ts`                  | Verify timeline/range properties on base `CSSProperties`; add if missing. Narrow `animationTimeline` to `AnimationTimelineValue`                           |
| `packages/typestyles/src/index.ts`                  | Re-export all of the above                                                                                                                                 |

## Documentation

New doc page: `docs/content/docs/scroll-animations.md`. Sections: anonymous vs named
timelines (when to reach for each), `animationRange` patterns (**view ranges** vs
**scroll progress ranges** — don't mix `entry`/`cover` with `scroll()`), pairing with
`keyframes.create()`, `entryTransition()` plus the raw `atRuleBlock('@starting-style', …)`
escape hatch, Safari `overlay: allow-discrete` caveat, **`prefers-reduced-motion`**
(wrap scroll/view animations in `@media (prefers-reduced-motion: no-preference)` or
set `animation: none` — no new API). Cross-link from `api-reference.md` and `keyframes`
docs.

**`view()` `inset` vs `viewTimelineInset`:** the CSS spec uses different names for the
anonymous function argument and the named-timeline property; accept that asymmetry in
TypeStyles and note it in docs rather than inventing a unified option name.

## Testing

| Area                                                | Cases                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `scroll()` / `view()`                               | all option combinations, defaults, inset tuple vs scalar                                                                             |
| `createScrollTimelineRef` / `createViewTimelineRef` | `--` prefix, scoping, sanitization                                                                                                   |
| `animationRange()`                                  | named-range + offset, `normal`, single-arg (`animationRange('entry')` → `"entry"`)                                                   |
| `entryTransition()`                                 | `@starting-style` key, spread order, `config.transition` overrides `config.to.transition`, popover `display` + `allow-discrete` case |
| Examples / docs                                     | `view()` + `entry` reveal pattern; `scroll()` + `%` progress pattern — not crossed                                                   |
| Extraction                                          | refs/timelines extracted like other primitives (build smoke test)                                                                    |
