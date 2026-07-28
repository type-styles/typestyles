# Design: `mediaQueries` constant export for common CSS media features

- **Status:** Approved
- **Scope:** Add one new small module of literal-string `@media` constants and wire it into the
  public API, tests, and docs. No changes to existing exports.

## Context

`packages/open-props/src/index.ts` already has a `media` object (via `tokens.create('media', ...)`)
covering `prefers-reduced-motion`, `prefers-color-scheme`, `orientation`, and width breakpoints —
but every value resolves to a CSS custom property reference (`var(--media-motionReduce)`), which is
not valid inside an actual `@media (...)` condition or a `styles.component`/`css`/`override` object
key.

`packages/typestyles/src/theme.ts` has `when.prefersDark` / `when.prefersLight` — plain literal
condition strings, but scoped narrowly to theme token-override layers (`ThemeCondition`), not
general-purpose keys for style objects.

There is currently no literal, ready-to-use `@media (...)` string constant for general use as an
object key in `styles.component`, `styles.class`, `css`, or `override` calls — authors have to hand
write the full string (e.g. `'@media (prefers-reduced-motion: reduce)'`) every time. This request
adds constants for `prefers-reduced-motion`, `prefers-contrast`, and hover/pointer capability
queries, grouped by CSS media feature.

## Design

New file `packages/typestyles/src/media-queries.ts` exports a single grouped constant, `mediaQueries`,
keyed by CSS media feature, with each feature's known values as sub-keys (camelCase of the literal
CSS keyword, e.g. `no-preference` → `noPreference`). Each leaf value is a complete `@media (...)`
string typed as the existing `MediaQueryKey` type (`` `@media ${string}` ``, from `media.ts`), so it
drops directly into a nested style object as a key with no wrapping:

```ts
export const mediaQueries = {
  prefersReducedMotion: {
    reduce: '@media (prefers-reduced-motion: reduce)',
    noPreference: '@media (prefers-reduced-motion: no-preference)',
  },
  prefersContrast: {
    more: '@media (prefers-contrast: more)',
    less: '@media (prefers-contrast: less)',
    noPreference: '@media (prefers-contrast: no-preference)',
  },
  hover: {
    hover: '@media (hover: hover)',
    none: '@media (hover: none)',
  },
  anyHover: {
    hover: '@media (any-hover: hover)',
    none: '@media (any-hover: none)',
  },
  pointer: {
    fine: '@media (pointer: fine)',
    coarse: '@media (pointer: coarse)',
    none: '@media (pointer: none)',
  },
  anyPointer: {
    fine: '@media (any-pointer: fine)',
    coarse: '@media (any-pointer: coarse)',
    none: '@media (any-pointer: none)',
  },
} as const satisfies Record<string, Record<string, MediaQueryKey>>;

export type MediaQueries = typeof mediaQueries;
```

Usage:

```ts
import { styles, mediaQueries } from 'typestyles';

const card = styles.component('card', {
  base: { transition: 'transform 200ms ease' },
  [mediaQueries.prefersReducedMotion.reduce]: { transition: 'none' },
});
```

### Wiring

- `packages/typestyles/src/index.ts`: export `mediaQueries` and the `MediaQueries` type alongside
  the existing `media.ts` exports (`MediaQueryKey`, `createMediaFn`, etc.).
- No changes to `media.ts`, `open-props`, or `theme.ts` — this is purely additive.

## Testing

- New `packages/typestyles/src/media-queries.test.ts`: assert the exact string value of every leaf
  (e.g. `expect(mediaQueries.pointer.coarse).toBe('@media (pointer: coarse)')`), covering all six
  feature groups.
- No runtime behavior beyond string constants — no interaction with `serialize-style.ts` or the
  sheet pipeline to test; existing `atRuleBlock`/style-object handling already accepts arbitrary
  `@media (...)` string keys (covered by `at-rule-block.test.ts`, `media.test.ts`).

## Docs

Add a short "Media Query Constants" section to `docs/content/docs/custom-at-rules.md` (where
breakpoints/media are already documented), with the usage example above and a one-line note
pointing to `@typestyles/open-props`'s `media` token map for anyone who wants `prefers-color-scheme`
/ `orientation` / width-breakpoint constants (out of scope here — already covered there).

## Out of scope

- `prefers-color-scheme`, `orientation`, and width breakpoints — already covered by
  `@typestyles/open-props`'s `media` map and `theme.ts`'s `when.prefersDark`/`prefersLight`.
- `forced-colors`, `inverted-colors`, `print` — explicitly deferred by the user during scoping.
- Any change to how `styles.component`/`css`/`override` resolve `@media` keys — the existing
  mechanism already handles arbitrary literal `@media (...)` string keys; this PR only adds string
  constants, not new resolution logic.
