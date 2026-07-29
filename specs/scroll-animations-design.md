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

These live in `css-math.ts` alongside `calc`/`clamp`/`anchor`/`anchorSize` — same
"typed function-value builder" shape.

### Named timelines — `createScrollTimelineRef`, `createViewTimelineRef`

`scroll-timeline-name` and `view-timeline-name` are `<dashed-ident>` (same category
as `anchor-name` — must start with `--`), so these mirror `createAnchorRef()`, not
`createContainerRef()`.

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
});
```

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
```

### Full scroll example

```ts
import { styles, keyframes, scroll, animationRange } from 'typestyles';

const fadeIn = keyframes.create('fade-in', { from: { opacity: 0 }, to: { opacity: 1 } });

styles.class('hero', {
  animationName: fadeIn,
  animationTimeline: scroll({ axis: 'block' }),
  animationRange: animationRange('entry 25%', 'entry 75%'),
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
styles.class('tooltip', {
  ...entryTransition({
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
    transition:
      'opacity 200ms, scale 200ms, display 200ms allow-discrete, overlay 200ms allow-discrete',
  }),
});
```

Deliberately requires an explicit `transition` string rather than auto-deriving it
from `to`'s keys — matches TypeStyles' "no runtime magic" stance (see `css-math.ts`'s
"no validation of inner syntax" precedent) and avoids silently omitting properties a
caller forgot to list.

**Safari caveat** (documented, not solved by TypeStyles): Safari lacks
`overlay: allow-discrete`, so _closing_ animations for popovers/dialogs fall back to
instant in Safari even with this helper. Note it in docs; not a TypeStyles bug.

## Implementation

| File                                                | Change                                                                                                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/typestyles/src/scroll-animations.ts`      | New — `scroll`, `view`, refs, `animationRange`                                                                                                                                                        |
| `packages/typestyles/src/scroll-animations.test.ts` | New                                                                                                                                                                                                   |
| `packages/typestyles/src/starting-style.ts`         | New — `entryTransition`                                                                                                                                                                               |
| `packages/typestyles/src/starting-style.test.ts`    | New                                                                                                                                                                                                   |
| `packages/typestyles/src/css-math.ts`               | No change — scroll/view are separate file since they're timeline-shaped, not calc-shaped; cross-reference in docs only                                                                                |
| `packages/typestyles/src/styles.ts`                 | `styles.scrollTimelineRef(label)` / `styles.viewTimelineRef(label)`, mirroring `containerRef`/`anchorRef`                                                                                             |
| `packages/typestyles/src/types.ts`                  | Verify `animationTimeline`, `animationRange`, `scrollTimelineName`, `scrollTimelineAxis`, `viewTimelineName`, `viewTimelineAxis`, `viewTimelineInset` present on base `CSSProperties`; add if missing |
| `packages/typestyles/src/index.ts`                  | Re-export all of the above                                                                                                                                                                            |

## Documentation

New doc page: `docs/content/docs/scroll-animations.md`. Sections: anonymous vs named
timelines (when to reach for each), `animationRange` patterns, pairing with
`keyframes.create()`, `entryTransition()` plus the raw `atRuleBlock('@starting-style', …)`
escape hatch, Safari `overlay: allow-discrete` caveat. Cross-link from
`api-reference.md` and `keyframes` docs.

## Testing

| Area                                                | Cases                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `scroll()` / `view()`                               | all option combinations, defaults, inset tuple vs scalar                             |
| `createScrollTimelineRef` / `createViewTimelineRef` | `--` prefix, scoping, sanitization                                                   |
| `animationRange()`                                  | named-range + offset, `normal`, single-arg (end omitted)                             |
| `entryTransition()`                                 | correct `@starting-style` key + spread order (to-properties not overwritten by from) |
| Extraction                                          | refs/timelines extracted like other primitives (build smoke test)                    |

## Open design questions

- Should `entryTransition()`'s returned object risk key collisions if `config.to`
  itself contains a `transition` key — last-write-wins spread order needs to be
  documented explicitly (config.transition always wins).
- Is a `viewTimelineInset` shorthand pairing with `view()`'s `inset` option worth
  aligning 1:1, or is slight asymmetry between the anonymous-function option name and
  the named-timeline property name acceptable (spec itself has this asymmetry)?
- Whether `animationRange`'s type should more strictly prevent nonsensical pairs
  (e.g. mismatched offset units) or, consistent with `calc`/`clamp`, stay
  string-passthrough with zero inner validation.
