---
title: CSS View Transitions (`createViewTransitionRef`, `viewTransition.*`)
status: draft
date: 2026-07-29
related: container.ts (createContainerRef precedent), global.ts, scroll-animations-design.md (naming disambiguation)
---

# CSS View Transitions

## Problem

Same-document View Transitions (`view-transition-name`, `::view-transition-group`,
`::view-transition-image-pair`, `::view-transition-old`, `::view-transition-new`,
`view-transition-class`) reached Baseline Newly Available in October 2025 (Firefox 144
completed cross-engine support). They let a single-page app morph between DOM states —
list reordering, shared-element expansion, tab switches — with browser-native
crossfade/morph animation instead of a JS animation library.

TypeStyles has no DX for it. The pain points if left uncovered:

- No typo protection or scoping for `view-transition-name` values.
- The transition pseudo-elements (`::view-transition-old(...)` etc.) are **not**
  descendants of any authored element — they live in a browser-generated tree
  parallel to `<html>` — so there's no obvious place in today's API to style them.

**Naming:** do not confuse this spec with `scroll-animations-design.md` — scroll's
`view()` builds a `view()` **timeline** function for scroll-driven animations;
`viewTransition` here is the **View Transitions API** pseudo-element namespace.
Similarly `createViewTransitionRef()` names an element for morph transitions;
`createViewTimelineRef()` names a scroll **view timeline**. Cross-link both doc pages.

**`view-transition-class`:** Level 2, newer than core same-document VT (Chrome 125,
Safari 18.2+). Transitions still run without it; custom group timing falls back to
defaults in older engines — progressive enhancement, not a hard dependency.

## Goals

- Typed, scoped `view-transition-name` references, consistent with `createContainerRef()`.
- Typed selector builders for the four transition pseudo-elements, usable with
  `global.style()`.
- `view-transition-class` support for styling a group of elements' transitions with
  one rule.
- Works in the zero-runtime extraction path — everything here is static CSS.

## Non-goals

- **No orchestration.** `document.startViewTransition(updateCallback)` triggers the
  transition and stays entirely in userland (React/Next/Vue/vanilla router code).
  TypeStyles has no opinion on routing or when a transition should fire — same
  boundary as `keyframes.create()` defining `@keyframes` but leaving `element.animate()`
  or `animation-name` assignment to the caller.
- No cross-document (MPA) transition helper beyond a thin `@view-transition` at-rule
  enabler (see below) — cross-document support is less mature (Firefox behind a flag)
  and is progressive enhancement by nature.
- No dedicated component API for "transition this element" — users assign
  `viewTransitionName` like any other CSS property.
- No multi-class `view-transition-class` builder in v1 (CSS allows
  `view-transition-class: card featured`; pass a raw string or add a helper later).

## `view-transition-name` is a `<custom-ident>`, not a dashed-ident

Unlike `anchor-name` (see `anchor-positioning-design.md`), `view-transition-name`
takes a plain `<custom-ident>` — same category as `container-name`. This means
`createViewTransitionRef()` mirrors `createContainerRef()` exactly, with no `--`
prefix.

## API

### `createViewTransitionRef(label, options?)`

```ts
export type ViewTransitionNameRef = string & { readonly __viewTransitionNameRef?: true };

/** Alias of `CreateContainerRefOptions` — same `{scopeId}-{label}` / `{prefix}-{label}` shape. */
export type CreateViewTransitionRefOptions = CreateContainerRefOptions;

export function createViewTransitionRef(
  label: string,
  options?: CreateContainerRefOptions,
): ViewTransitionNameRef;
```

Identical implementation to `createContainerRef` (`sanitizeClassSegment`, throw on
empty label). `styles.viewTransitionRef(label)` is the instance-scoped shorthand.

```ts
createViewTransitionRef('card'); // "ts-card"
createViewTransitionRef('card', { scopeId: 'my-app' }); // "my-app-card"
```

### `createViewTransitionClassRef(label, options?)`

Same shape, for `view-transition-class` (tags many elements under one shared rule):

```ts
export type ViewTransitionClassRef = string & { readonly __viewTransitionClassRef?: true };
export function createViewTransitionClassRef(
  label: string,
  options?: CreateContainerRefOptions,
): ViewTransitionClassRef;
```

`styles.viewTransitionClassRef(label)` is the instance-scoped shorthand (mirrors
`viewTransitionRef`).

### Property value typing

```ts
export type ViewTransitionNameValue = 'none' | ViewTransitionNameRef | string;
export type ViewTransitionClassValue = 'none' | ViewTransitionClassRef | string;
```

Narrow `viewTransitionName` / `viewTransitionClass` on base `CSSProperties` so refs
type-check without `as any`. CSS `none` is allowed on both properties.

### `viewTransition.*` pseudo-element selectors

Transition pseudo-elements aren't descendants of any authored selector, so these
return **bare** selector strings for use with `global.style()`, not `&`-relative
nested keys.

```ts
export type ViewTransitionNameSelector = ViewTransitionNameRef | '*' | 'root';

export const viewTransition: {
  group(ref: ViewTransitionNameSelector): `::view-transition-group(${string})`;
  imagePair(ref: ViewTransitionNameSelector): `::view-transition-image-pair(${string})`;
  old(ref: ViewTransitionNameSelector): `::view-transition-old(${string})`;
  new (ref: ViewTransitionNameSelector): `::view-transition-new(${string})`;
  groupByClass(ref: ViewTransitionClassRef): `::view-transition-group(.${string})`;
};
```

`'*'` targets every named transition (common default crossfade). `'root'` targets the
user-agent page-level transition group (elements not assigned their own
`view-transition-name`). `groupByClass` uses the class-only selector form
(`.${ref}`) — equivalent to `*.${ref}` but simpler when styling by
`view-transition-class` alone.

**v1 scope:** only `groupByClass` is provided for class-based targeting. Style
`::view-transition-old(.class)` / `::view-transition-new(.class)` via raw selector
strings passed to `global.style()` until demand justifies `oldByClass` / `newByClass`
helpers.

`'*'` and `'root'` are accepted directly (not just via a cast) because global and
page-level defaults are common starting points before naming individual elements.

## Examples

```ts
import {
  styles,
  global,
  keyframes,
  createViewTransitionRef,
  createViewTransitionClassRef,
  viewTransition,
} from 'typestyles';

const cardTransition = createViewTransitionRef('card');
const cardGroup = createViewTransitionClassRef('shared-card');

styles.class('card', {
  viewTransitionName: cardTransition,
  viewTransitionClass: cardGroup,
});

global.style(viewTransition.old(cardTransition), { animationDuration: '200ms' });
global.style(viewTransition.new(cardTransition), { animationTimingFunction: 'ease-out' });
global.style(viewTransition.group(cardTransition), { animationDuration: '400ms' });
global.style(viewTransition.groupByClass(cardGroup), { animationDuration: '400ms' });

// Default crossfade for everything, before naming individual elements
global.style(viewTransition.old('*'), { animationDuration: '150ms' });
global.style(viewTransition.new('*'), { animationDuration: '150ms' });

// Page-level (root) transition group
global.style(viewTransition.group('root'), { animationDuration: '300ms' });
```

Custom morph animation via `keyframes.create()` on the transition pseudo-elements:

```ts
const slideOut = keyframes.create('vt-slide-out', { to: { transform: 'translateX(-100%)' } });

global.style(viewTransition.old(cardTransition), {
  animationName: slideOut,
  animationDuration: '300ms',
  animationFillMode: 'both',
});
```

```ts
// App code (out of scope for typestyles, shown for context only):
function navigate() {
  if (!document.startViewTransition) return render();
  document.startViewTransition(() => render());
}
```

### `enableViewTransitions()` (optional, cross-document)

Thin `@view-transition` at-rule enabler for MPA navigations. v1 emits
`navigation: auto` only — named `types` for `:active-view-transition-type()` styling
is deferred until there is a concrete use case.

```ts
export function enableViewTransitions(): void;
```

```ts
enableViewTransitions();
// @view-transition { navigation: auto; }
```

Emits via `insertRule('@view-transition', ...)` — same pattern as
`globalFontFace`'s dedicated at-rule emission. Included because it's a one-line,
low-risk addition, not because it needs its own subsystem.

## Implementation

| File                                               | Change                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `packages/typestyles/src/view-transitions.ts`      | New — refs, `viewTransition.*`, `enableViewTransitions`                                                     |
| `packages/typestyles/src/view-transitions.test.ts` | New                                                                                                         |
| `packages/typestyles/src/styles.ts`                | `styles.viewTransitionRef(label)` / `styles.viewTransitionClassRef(label)` instance methods                 |
| `packages/typestyles/src/types.ts`                 | Verify properties on base `CSSProperties`; narrow to `ViewTransitionNameValue` / `ViewTransitionClassValue` |
| `packages/typestyles/src/index.ts`                 | Re-export refs, `viewTransition`, `enableViewTransitions`                                                   |

No changes needed to `serialize-style.ts` or `global.ts` — `viewTransition.*` returns
plain selector strings consumed by the existing `global.style(selector, properties)`
signature.

## Documentation

New doc page: `docs/content/docs/view-transitions.md`. Sections: same-document basics,
pairing with `keyframes.create()` for custom transition animations (see Examples),
`view-transition-class` for groups (**Level 2** — progressive enhancement),
the `document.startViewTransition()` scope boundary (explicit "TypeStyles styles the
transition, your router triggers it" callout), cross-document enabler,
**`prefers-reduced-motion`** (set `animation-duration: 0s` or skip custom VT styles
under `prefers-reduced-motion: reduce` — no new API). Cross-link from
`api-reference.md` and **`scroll-animations.md`** (disambiguate `view()` vs
`viewTransition`).

## Testing

| Area                                                       | Cases                                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `createViewTransitionRef` / `createViewTransitionClassRef` | scoping, sanitization, empty-label throw                               |
| `styles.viewTransitionRef` / `viewTransitionClassRef`      | scoping matches `containerRef`                                         |
| `viewTransition.*`                                         | all four pseudo-elements + `groupByClass` (`.${ref}`), `'*'`, `'root'` |
| `viewTransitionName` / `viewTransitionClass`               | `'none'` serializes correctly                                          |
| `enableViewTransitions`                                    | dedup on repeated call; emits `navigation: auto` only                  |
| Examples / docs                                            | keyframes on `::view-transition-old` / `::view-transition-new`         |
| Extraction                                                 | refs/selectors extracted like `container()` calls (build smoke test)   |
