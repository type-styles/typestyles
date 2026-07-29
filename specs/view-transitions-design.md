---
title: CSS View Transitions (`createViewTransitionRef`, `viewTransition.*`)
status: draft
date: 2026-07-29
related: container.ts (createContainerRef precedent), global.ts
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

## `view-transition-name` is a `<custom-ident>`, not a dashed-ident

Unlike `anchor-name` (see `anchor-positioning-design.md`), `view-transition-name`
takes a plain `<custom-ident>` — same category as `container-name`. This means
`createViewTransitionRef()` mirrors `createContainerRef()` exactly, with no `--`
prefix.

## API

### `createViewTransitionRef(label, options?)`

```ts
export type ViewTransitionNameRef = string & { readonly __viewTransitionNameRef?: true };

export type CreateViewTransitionRefOptions = {
  scopeId?: string; // "{scopeId}-{label}"
  prefix?: string; // "{prefix}-{label}", default "ts"
};

export function createViewTransitionRef(
  label: string,
  options?: CreateViewTransitionRefOptions,
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
  options?: CreateViewTransitionRefOptions,
): ViewTransitionClassRef;
```

### `viewTransition.*` pseudo-element selectors

Transition pseudo-elements aren't descendants of any authored selector, so these
return **bare** selector strings for use with `global.style()`, not `&`-relative
nested keys.

```ts
export const viewTransition: {
  group(ref: ViewTransitionNameRef | '*'): `::view-transition-group(${string})`;
  imagePair(ref: ViewTransitionNameRef | '*'): `::view-transition-image-pair(${string})`;
  old(ref: ViewTransitionNameRef | '*'): `::view-transition-old(${string})`;
  new (ref: ViewTransitionNameRef | '*'): `::view-transition-new(${string})`;
  groupByClass(ref: ViewTransitionClassRef): `::view-transition-group(*.${string})`;
};
```

`'*'` is accepted directly (not just via a cast) because targeting "every named
transition" (e.g. a default crossfade duration) is the common starting point before
naming individual elements.

## Examples

```ts
import { styles, global, createViewTransitionRef, viewTransition } from 'typestyles';

const cardTransition = createViewTransitionRef('card');

styles.class('card', { viewTransitionName: cardTransition });

global.style(viewTransition.old(cardTransition), { animationDuration: '200ms' });
global.style(viewTransition.new(cardTransition), { animationTimingFunction: 'ease-out' });
global.style(viewTransition.group(cardTransition), { animationDuration: '400ms' });

// Default crossfade for everything, before naming individual elements
global.style(viewTransition.old('*'), { animationDuration: '150ms' });
global.style(viewTransition.new('*'), { animationDuration: '150ms' });
```

```ts
// view-transition-class: style a whole group's transition with one rule
const cardGroup = createViewTransitionClassRef('shared-card');

styles.class('card', { viewTransitionName: cardTransition, viewTransitionClass: cardGroup });
global.style(viewTransition.groupByClass(cardGroup), { animationDuration: '400ms' });
```

```ts
// App code (out of scope for typestyles, shown for context only):
function navigate() {
  if (!document.startViewTransition) return render();
  document.startViewTransition(() => render());
}
```

### `enableViewTransitions()` (optional, cross-document)

Thin `@view-transition` at-rule enabler for MPA navigations:

```ts
export function enableViewTransitions(options?: { types?: string[] }): void;
```

```ts
enableViewTransitions();
// @view-transition { navigation: auto; }
```

Emits via `insertRule('@view-transition', ...)` — same pattern as
`globalFontFace`'s dedicated at-rule emission. Included because it's a one-line,
low-risk addition, not because it needs its own subsystem.

## Implementation

| File                                               | Change                                                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `packages/typestyles/src/view-transitions.ts`      | New — refs, `viewTransition.*`, `enableViewTransitions`                                            |
| `packages/typestyles/src/view-transitions.test.ts` | New                                                                                                |
| `packages/typestyles/src/styles.ts`                | `styles.viewTransitionRef(label)` instance method                                                  |
| `packages/typestyles/src/types.ts`                 | Verify `viewTransitionName`, `viewTransitionClass` present on base `CSSProperties`; add if missing |
| `packages/typestyles/src/index.ts`                 | Re-export refs, `viewTransition`, `enableViewTransitions`                                          |

No changes needed to `serialize-style.ts` or `global.ts` — `viewTransition.*` returns
plain selector strings consumed by the existing `global.style(selector, properties)`
signature.

## Documentation

New doc page: `docs/content/docs/view-transitions.md`. Sections: same-document basics,
pairing with `keyframes.create()` for custom transition animations,
`view-transition-class` for groups, the `document.startViewTransition()` scope
boundary (explicit "TypeStyles styles the transition, your router triggers it"
callout), cross-document enabler. Cross-link from `api-reference.md`.

## Testing

| Area                                                       | Cases                                                                                  |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `createViewTransitionRef` / `createViewTransitionClassRef` | scoping, sanitization, empty-label throw                                               |
| `viewTransition.*`                                         | correct selector strings for all four pseudo-elements + `groupByClass`, `'*'` handling |
| `enableViewTransitions`                                    | dedup on repeated call, `types` option serialization                                   |
| Extraction                                                 | refs/selectors extracted like `container()` calls (build smoke test)                   |

## Open design questions

- Should `viewTransition.old`/`.new` reject `'*'` when a specific ref type is expected
  elsewhere in the same call site (unlikely useful), or is the union always fine?
- Is `enableViewTransitions({ types })` worth the `types` option in v1 (named
  transition types for conditional styling via `:active-view-transition-type()`), or
  ship the at-rule enabler without it and add later?
- Does `view-transition-class` justify a bundled ref (`ViewTransitionClassRef`) or
  should it just accept a plain string, given it's a simpler feature than
  `view-transition-name`'s per-element uniqueness requirement?
