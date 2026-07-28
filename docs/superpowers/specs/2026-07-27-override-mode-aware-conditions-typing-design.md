# Design: Fix `conditions` type-checking bug + type mode-aware values in override/recipe styles

- **Issue:** [type-styles/typestyles#169](https://github.com/type-styles/typestyles/issues/169)
- **Status:** Approved
- **Scope:** PR 1 of 2. This PR fixes two confirmed bugs. Recipe-level `conditions`/`when.dark(...)`
  support inside `styles.component()` (issue #169 acceptance criterion #3) is a separate, larger
  feature deferred to a follow-up PR with its own design.

## Context

var-ui's `createDesignTheme({ components })` compiles to `styles.override()`. Most overrides infer
correctly, but authors hit strict type limits with mode-aware color values (`{ light, dark }`) and
conditional overrides (`when.dark(...)`, `conditional(...)`), forcing a `Record<string, unknown>`
escape hatch (`ThemeComponentOverrideInput` in var-ui) that loses IntelliSense.

Issue #169 frames this as "most overrides infer correctly ... but authors hit strict inference
limits" on these two specific shapes, and assumes recipe authoring (`styles.component()`) already
has full typing/support for both shapes, with overrides just needing to catch up.

## Investigation findings

Verified directly against `tsc --noEmit` (not just static reading), using scratch `.type-tests.ts`
files (excluded from the final diff — `tsconfig.json` only excludes `**/*.test.ts`, so
`*.type-tests.ts` files ARE checked by `tsc --noEmit` and enforced by `pnpm typecheck`).

1. **`{ light, dark }` mode-aware values are not typed anywhere in the public API** — not just in
   overrides. `styles.component('x', { base: { color: { light: '#111', dark: '#eee' } } })` fails
   to type-check today even though `color-modes.ts`'s `expandColorModeProperty` already compiles
   this shape to `light-dark()` at runtime when `colorModes` is configured on the `createStyles()`
   instance. The existing `ModeAwareValue<T, M>` type (`color-modes.ts:332`) is exported from
   `index.ts` but never actually used anywhere in `VariantOptionStyle`, `CSSProperties`, or
   `StylableOverride`.

2. **`conditions` in `styles.override()` configs do not type-check today — this is a real
   regression, not a missing feature.** `StylableOverride` is defined as:

   ```ts
   export type StylableOverride = VariantOptionStyle & {
     conditions?: readonly ConditionalOverride[];
   };
   ```

   `VariantOptionStyle` has an open string index signature:

   ```ts
   [key: string]:
     | CSS.Properties<CSSValue>[keyof CSS.Properties<CSSValue>]
     | VariantOptionStyle
     | CSSValue
     | undefined;
   ```

   In the intersection, this index signature's value union applies to _every_ string-keyed
   property of the merged type — including the `conditions` property added by the second half of
   the intersection. `ConditionalOverride[]` isn't assignable to that union, so any object literal
   with a `conditions` key is rejected:

   ```
   error TS2322: Type '{ conditions: ConditionalOverride[]; }' is not assignable to type 'StylableOverride'.
     Property 'conditions' is incompatible with index signature.
   ```

   Reproduced with `OverrideConfig<V>` directly (bypassing overload dispatch) and with
   `styles.override(button, { base: { conditions: [...] } })` (full overload resolution — TS falls
   through to the wrong overload and reports a misleading "no overload matches" error whose root
   cause is this same index-signature conflict).

   This is invisible in the existing test suite: `override-conditions.test.ts` exercises
   `conditions` successfully, but it's a `.test.ts` file, and `tsconfig.json` excludes
   `**/*.test.ts` from `tsc --noEmit`. Vitest runs it through an untyped transform, so the tests
   pass at runtime without ever being type-checked. `pnpm typecheck` currently has no coverage of
   `conditions` in override configs at all.

3. **Recipe authoring (`styles.component()`) does not support `conditions`/`when.dark(...)` at
   all — neither in types nor at runtime.** `component.ts` has zero references to `conditions`.
   This means issue #169's acceptance criterion #3 ("if a recipe variant accepts
   `when.dark({ color: '…' })`, the corresponding theme override should accept the same shape")
   rests on a false premise — recipes don't accept `when.dark(...)` today. Adding that is new
   functionality, not a typing fix, and touches all 11 naming-mode component builders in
   `component.ts` (semantic/BEM/template/attribute × dimensioned/flat/slot/multi-slot). That's
   out of scope for this PR (see Scope above).

## Fix design

### Fix 2 — repair `conditions` type-checking (do first)

Redeclare `StylableOverride` as its own object type instead of an intersection with
`VariantOptionStyle`, folding `conditions` into the _same_ index-signature union so there's no
cross-type index-signature conflict:

```ts
export type StylableOverride = {
  [K in keyof CSS.Properties<CSSValue>]?: CSS.Properties<CSSValue>[K] | CSSValue;
} & {
  conditions?: readonly ConditionalOverride[];
  [key: string]:
    | CSS.Properties<CSSValue>[keyof CSS.Properties<CSSValue>]
    | VariantOptionStyle
    | readonly ConditionalOverride[]
    | CSSValue
    | undefined;
};
```

Verified in isolation: an object literal with both a known CSS property and `conditions` type-checks
cleanly against this shape, where it failed against the current definition.

`VariantOptionStyle` itself is untouched by this fix — it must _not_ accept `conditions` (it's used
broadly for plain variant-option styles that aren't override/condition-aware), so duplicating its
mapped-properties shape locally in `StylableOverride` (cheap at the type level — mapped types don't
duplicate runtime code) is the right boundary, matching the existing pattern already used to keep
`VariantOptionStyle` and `CSSPropertiesBase` as deliberate near-duplicates (see the `CSSProperties`
doc comment referencing issue #167 for precedent).

### Fix 1 — type mode-aware `{ light, dark }` values

Extend the property-value union in `VariantOptionStyle`, `CSSPropertiesBase`, and the fixed
`StylableOverride` to also accept the existing `ModeAwareValue<T, LightDarkColorModes>` shape,
using the default `['light', 'dark']` mode-key tuple (`LightDarkColorModes`, already exported from
`color-modes.ts`) as the canonical key set for typing purposes.

This is **ungated** — per the scoping decision, it does not require threading the actual configured
`colorModes` tuple through `createStyles()` as a generic parameter (unlike `layers`, which already
does this). This matches the existing convention: `conditions`/`when` are also never gated by
`createStyles()` config at the type level today, and a mismatch (mode object on an instance with no
`colorModes` configured) already just `warnDev`s at runtime (`color-modes.ts:321`) rather than being
a hard error — so a type-level mismatch in the same spirit is consistent, not a new footgun.

Because `styles.component()`'s `base` field is typed as bare `CSSProperties` (not
`VariantOptionStyle`), the same treatment must be applied to `CSSPropertiesBase` for `{ light, dark }`
values to type-check in `base` too, not only in override configs and recipe `variants`.

The exact generic wiring (how `ModeAwareValue<T, M>`'s `T extends string | number` constraint
composes with `CSS.Properties<CSSValue>[K]`, which may be a union including non-scalar members) is
an implementation detail to work out against the scratch `tsc` checks already used during
investigation — not fully pre-specified here, since it's mechanical once the shape above is right.

## Testing

- Add cases to `override.type-tests.ts`: `conditions` on `base`, on a variant option, and on a
  `compoundVariants[].style`; a `@ts-expect-error` case for an invalid `conditions` shape (e.g.
  missing `when`); `{ light, dark }` on a known color property in `base`, a variant option, and a
  slot override.
- Add a mode-aware-value case to the recipe side (new or existing `*.type-tests.ts` file covering
  `styles.component()`) — `base` and `variants` with `{ light, dark }` on a color property.
- No runtime behavior changes are expected — `color-modes.ts` and `override.ts` already implement
  the compiled/emitted behavior these types are catching up to. Existing `.test.ts` files continue
  to assert runtime output; this PR's job is closing the `tsc --noEmit` gap, verified by
  `pnpm typecheck` passing with the new cases (including the `@ts-expect-error` cases actually
  erroring pre-fix and not erroring post-fix, confirmed manually during implementation).

## Out of scope

- Recipe-level (`styles.component()`) support for `conditions`/`when.dark(...)` — issue #169
  acceptance criterion #3. Deferred to a follow-up PR/design given its size (all 11 naming-mode
  builders in `component.ts`).
- Threading `colorModes` as a generic through `createStyles()` for stricter (gated) mode-aware
  typing — considered and explicitly rejected for this PR per the scoping decision above.
- Any changes to var-ui itself (separate repo) — `ThemeComponentOverrideInput` removal there is a
  downstream consequence of this fix landing, not part of this PR.
