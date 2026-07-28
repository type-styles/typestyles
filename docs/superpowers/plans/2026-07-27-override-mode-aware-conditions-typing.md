# Fix `conditions` type-checking bug + type mode-aware values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two confirmed bugs in `packages/typestyles`: `conditions` in `styles.override()` configs don't type-check today, and `{ light, dark }` mode-aware property values aren't typed anywhere in the public API despite being supported at runtime. Closes acceptance criteria #1 and #2 of [issue #169](https://github.com/type-styles/typestyles/issues/169).

**Architecture:** Two isolated type-only changes in `packages/typestyles/src/types.ts` (plus one relaxed constraint in `color-modes.ts` and one internal cast in `override.ts`), each proven by `tsc --noEmit`-checked `*.type-tests.ts` files (NOT `*.test.ts` — those are excluded from `tsc --noEmit` by `tsconfig.json` and would silently fail to catch either bug, which is exactly how bug #2 went unnoticed). No runtime behavior changes.

**Tech Stack:** TypeScript, vitest, pnpm workspaces, changesets.

## Global Constraints

- Every task's diff must leave `pnpm --filter typestyles typecheck` (root: `packages/typestyles`) passing with zero errors.
- Every task's diff must leave `pnpm --filter typestyles test` (vitest) passing with zero failed tests — currently 43 files / 662 tests.
- Do not modify `*.test.ts` files' logic — only `*.type-tests.ts` files get new type-only assertions.
- `VariantOptionStyle` must never gain a `conditions` key — only `StylableOverride` (override-specific) may. Recipe-authoring types (`ComponentConfig`, `SlotComponentConfig`, etc.) are out of scope for this plan (see the design doc's "Out of scope" section) — do not touch `component.ts`.
- Mode-aware `{ light, dark }` typing is **ungated**: it must not require threading `colorModes` through `createStyles()` as a generic parameter. Use the existing default `LightDarkColorModes` (`['light', 'dark']`) tuple from `color-modes.ts`.
- Design doc: `docs/superpowers/specs/2026-07-27-override-mode-aware-conditions-typing-design.md`.

---

## Task 1: Fix `conditions` type-checking in `styles.override()` configs

**Files:**

- Modify: `packages/typestyles/src/types.ts:534-536` (the `StylableOverride` type definition)
- Modify: `packages/typestyles/src/override.ts:126-132` (the `splitStylableOverride` function)
- Modify: `packages/typestyles/src/override.type-tests.ts` (append new assertions at end of file)

**Interfaces:**

- Consumes: nothing new — `ConditionalOverride`, `VariantOptionStyle`, `OverrideConfig` already exist in `types.ts` / `override.ts`.
- Produces: `StylableOverride` (exported from `types.ts`) becomes assignable when it has a `conditions` key — this is what `OverrideConfig.base`, `OverrideConfig.variants[K][O]`, `OverrideConfig.compoundVariants[].style`, and the slot/flat override equivalents are typed as, so this task alone fixes `conditions` everywhere overrides are used.

- [ ] **Step 1: Write the failing type-test**

Open `packages/typestyles/src/override.type-tests.ts`. Confirm the top of the file currently reads:

```ts
/**
 * Compile-time assertions for `styles.override()` — included in `tsc --noEmit`
 * (unlike `*.test.ts`). Failures here fail `pnpm typecheck`.
 */
import { createStyles } from './styles';
import type { VariantOptionStyle } from './types';
```

Change the import line to also bring in `when` and `conditional`:

```ts
import { createStyles } from './styles';
import { when } from './theme';
import { conditional } from './override';
import type { VariantOptionStyle } from './types';
```

Then append this block to the **end** of the file (after the existing `void widenedOk;` line):

```ts
// `conditions` in styles.override() configs (Issue #169) — must type-check, not just
// run correctly under vitest's untyped transform (see override-conditions.test.ts).
const condBtn = styles.component('ov-type-cond-btn', {
  base: { color: 'black' },
  variants: {
    intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
  },
});

styles.override(condBtn, {
  base: {
    color: 'red',
    conditions: [conditional(when.prefersDark, { color: 'white' })],
  },
  variants: {
    intent: {
      primary: {
        conditions: [conditional(when.prefersDark, { color: 'lightblue' }, 'primary-dark')],
      },
    },
  },
  compoundVariants: [
    {
      variants: { intent: 'primary' },
      style: {
        fontWeight: 700,
        conditions: [conditional(when.prefersDark, { fontWeight: 900 })],
      },
    },
  ],
});

// @ts-expect-error — conditions entry missing required `when`
styles.override(condBtn, {
  base: {
    conditions: [{ style: { color: 'red' } }],
  },
});
```

- [ ] **Step 2: Run typecheck to confirm it currently fails**

Run: `cd packages/typestyles && npx tsc --noEmit 2>&1 | grep -A3 "override.type-tests"`

Expected: errors referencing `override.type-tests.ts` around the new `styles.override(condBtn, {...})` calls — `No overload matches this call` / `Property 'conditions' is incompatible with index signature`. If you see no errors, stop — something about the repro differs from expected; re-check the block was appended correctly before proceeding.

- [ ] **Step 3: Fix `StylableOverride` in `types.ts`**

In `packages/typestyles/src/types.ts`, find (around line 534):

```ts
export type StylableOverride = VariantOptionStyle & {
  conditions?: readonly ConditionalOverride[];
};
```

Replace with:

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

(This redeclares `StylableOverride` as its own object type — rather than an intersection with `VariantOptionStyle` — folding `conditions` into the _same_ index-signature union as the CSS property values. `VariantOptionStyle`'s own index signature, which doesn't include `ConditionalOverride[]`, was applying across the old intersection and rejecting any object literal with a `conditions` key. `VariantOptionStyle` itself is untouched — it must not accept `conditions`.)

- [ ] **Step 4: Fix the resulting `override.ts` cast**

Run: `cd packages/typestyles && npx tsc --noEmit 2>&1 | grep -A6 "override.ts(131"`

Expected: an error at `override.ts:131` — `Type '{ ... }' is not assignable to type 'VariantOptionStyle'` — because destructuring `{ conditions, ...rest }` from the new `StylableOverride` leaves `rest` carrying the widened index signature (it still permits `readonly ConditionalOverride[]` structurally, since index signatures apply to the whole type, not just the destructured-away key).

In `packages/typestyles/src/override.ts`, find (around line 126):

```ts
function splitStylableOverride(styles: StylableOverride): {
  unconditional: VariantOptionStyle;
  conditions: readonly ConditionalOverride[];
} {
  const { conditions, ...rest } = styles;
  return { unconditional: rest, conditions: conditions ?? [] };
}
```

Replace the `return` line with:

```ts
function splitStylableOverride(styles: StylableOverride): {
  unconditional: VariantOptionStyle;
  conditions: readonly ConditionalOverride[];
} {
  const { conditions, ...rest } = styles;
  // `rest`'s inferred type still carries StylableOverride's widened index signature (it
  // permits `readonly ConditionalOverride[]` to accommodate the now-stripped `conditions`
  // key) — safe to narrow back to VariantOptionStyle since `conditions` is destructured out.
  return { unconditional: rest as VariantOptionStyle, conditions: conditions ?? [] };
}
```

- [ ] **Step 5: Run typecheck to verify it passes**

Run: `cd packages/typestyles && npx tsc --noEmit`

Expected: no output, exit code 0.

- [ ] **Step 6: Run the full test suite to verify no runtime regressions**

Run: `cd packages/typestyles && npx vitest run`

Expected: `Test Files  43 passed (43)`, `Tests  662 passed (662)`.

- [ ] **Step 7: Commit**

```bash
git add packages/typestyles/src/types.ts packages/typestyles/src/override.ts packages/typestyles/src/override.type-tests.ts
git commit -m "$(cat <<'EOF'
Fix conditions type-checking in styles.override() configs

StylableOverride's intersection with VariantOptionStyle's index signature
rejected any object literal with a `conditions` key — invisible until now
because override-conditions.test.ts is a .test.ts file, excluded from
tsc --noEmit by tsconfig.json. Part of Issue #169.
EOF
)"
```

---

## Task 2: Type mode-aware `{ light, dark }` property values

**Files:**

- Modify: `packages/typestyles/src/color-modes.ts` (relax `ModeAwareValue`'s type constraint)
- Modify: `packages/typestyles/src/types.ts` (apply `ModeAwareValue` to `CSSPropertiesBase`, `VariantOptionStyle`, `StylableOverride`)
- Modify: `packages/typestyles/src/override.type-tests.ts` (append new assertions)
- Modify: `packages/typestyles/src/component-overload.type-tests.ts` (append new assertions)

**Interfaces:**

- Consumes: the existing exported `ModeAwareValue<T, M>` type from `color-modes.ts` (currently unused anywhere), and `LightDarkColorModes` (`typeof colorModes`, i.e. `readonly ['light', 'dark']`), also from `color-modes.ts`.
- Produces: `CSSPropertiesBase` (→ `CSSProperties`, used by `ComponentConfig.base`), `VariantOptionStyle`, and `StylableOverride` (from Task 1) all accept `{ light: T, dark: T }` on any CSS property value going forward — this is what later work (recipe-level `conditions`, deferred) and var-ui's escape-hatch removal will build on.

- [ ] **Step 1: Write the failing type-tests**

Append to the end of `packages/typestyles/src/override.type-tests.ts` (after the block added in Task 1):

```ts
// Mode-aware `{ light, dark }` values (Issue #169) — must type-check on override configs.
const modeBtn = styles.component('ov-type-mode-btn', {
  base: { color: 'black' },
  variants: {
    intent: { primary: { color: 'blue' } },
  },
});

styles.override(modeBtn, {
  base: { color: { light: '#111', dark: '#eee' } },
  variants: {
    intent: { primary: { backgroundColor: { light: '#fff', dark: '#000' } } },
  },
});

const modeOk: VariantOptionStyle = { color: { light: '#111', dark: '#eee' } };
void modeOk;

// @ts-expect-error — mode object missing required `dark` key
const modeMissingDark: VariantOptionStyle = { color: { light: '#111' } };
void modeMissingDark;

// Slot overrides also accept mode-aware values
const modeAlert = styles.component('ov-type-mode-slot', {
  slots: ['root'] as const,
  base: { root: { display: 'flex' } },
});
styles.override(modeAlert, {
  base: { root: { color: { light: '#111', dark: '#eee' } } },
});
```

Append to the end of `packages/typestyles/src/component-overload.type-tests.ts` (after the existing `void card;` line):

```ts
// Mode-aware `{ light, dark }` values (Issue #169) — must type-check in recipe authoring,
// matching what color-modes.ts already compiles to `light-dark()` at runtime.
const modeAware = styles.component('mode-aware-btn', {
  base: { color: { light: '#111', dark: '#eee' } },
  variants: {
    intent: {
      primary: { backgroundColor: { light: '#fff', dark: '#000' } },
    },
  },
});
void modeAware;
```

- [ ] **Step 2: Run typecheck to confirm it currently fails**

Run: `cd packages/typestyles && npx tsc --noEmit 2>&1 | grep -E "override.type-tests|component-overload.type-tests"`

Expected: errors referencing the new `{ light: ..., dark: ... }` object literals in both files — `Type '{ light: string; dark: string; }' is not assignable to type 'string | number | ...'`.

- [ ] **Step 3: Relax `ModeAwareValue`'s constraint in `color-modes.ts`**

In `packages/typestyles/src/color-modes.ts`, find the last two lines of the file:

```ts
export type ModeAwareValue<T extends string | number, M extends ColorModeMap> =
  | T
  | { [K in M[number]]: T };
```

Replace with:

```ts
export type ModeAwareValue<T extends string | number | undefined, M extends ColorModeMap> =
  | T
  | { [K in M[number]]: T };
```

(Widening `T`'s constraint to also allow `undefined` — needed because `CSS.Properties<CSSValue>[K]` includes `undefined` for optional properties, and `T` must accept that union as-is to compose cleanly in Step 4. This is a backward-compatible relaxation: nothing currently instantiates `ModeAwareValue` with a `T` that excluded `undefined` in a way this would break, since the type was unused elsewhere.)

- [ ] **Step 4: Apply `ModeAwareValue` to `CSSPropertiesBase`, `VariantOptionStyle`, and `StylableOverride` in `types.ts`**

At the top of `packages/typestyles/src/types.ts`, find:

```ts
import type * as CSS from 'csstype';
```

Replace with:

```ts
import type * as CSS from 'csstype';
import type { LightDarkColorModes, ModeAwareValue } from './color-modes';
```

Find `CSSPropertiesBase` (around line 33):

```ts
type CSSPropertiesBase = {
  [K in keyof CSS.Properties<CSSValue>]?: CSS.Properties<CSSValue>[K] | CSSValue;
} & {
  [key: string]:
    | CSS.Properties<CSSValue>[keyof CSS.Properties<CSSValue>]
    | CSSPropertiesBase
    | CSSValue
    | undefined;
};
```

Replace with:

```ts
type CSSPropertiesBase = {
  [K in keyof CSS.Properties<CSSValue>]?: ModeAwareValue<
    CSS.Properties<CSSValue>[K] | CSSValue,
    LightDarkColorModes
  >;
} & {
  [key: string]:
    | CSS.Properties<CSSValue>[keyof CSS.Properties<CSSValue>]
    | CSSPropertiesBase
    | CSSValue
    | { readonly [mode: string]: CSSValue }
    | undefined;
};
```

Find `VariantOptionStyle` (around line 510, after Task 1's edits it will still be in its original form — Task 1 did not touch this type):

```ts
export type VariantOptionStyle = {
  [K in keyof CSS.Properties<CSSValue>]?: CSS.Properties<CSSValue>[K] | CSSValue;
} & {
  [key: string]:
    | CSS.Properties<CSSValue>[keyof CSS.Properties<CSSValue>]
    | VariantOptionStyle
    | CSSValue
    | undefined;
};
```

Replace with:

```ts
export type VariantOptionStyle = {
  [K in keyof CSS.Properties<CSSValue>]?: ModeAwareValue<
    CSS.Properties<CSSValue>[K] | CSSValue,
    LightDarkColorModes
  >;
} & {
  [key: string]:
    | CSS.Properties<CSSValue>[keyof CSS.Properties<CSSValue>]
    | VariantOptionStyle
    | CSSValue
    | { readonly [mode: string]: CSSValue }
    | undefined;
};
```

Find `StylableOverride` (the version Task 1 produced):

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

Replace with:

```ts
export type StylableOverride = {
  [K in keyof CSS.Properties<CSSValue>]?: ModeAwareValue<
    CSS.Properties<CSSValue>[K] | CSSValue,
    LightDarkColorModes
  >;
} & {
  conditions?: readonly ConditionalOverride[];
  [key: string]:
    | CSS.Properties<CSSValue>[keyof CSS.Properties<CSSValue>]
    | VariantOptionStyle
    | readonly ConditionalOverride[]
    | CSSValue
    | { readonly [mode: string]: CSSValue }
    | undefined;
};
```

- [ ] **Step 5: Run typecheck to verify it passes**

Run: `cd packages/typestyles && npx tsc --noEmit`

Expected: no output, exit code 0. (If `override.ts` reports an error again at the `splitStylableOverride` cast site, re-check Task 1's Step 4 edit is still in place — it should be, since Task 1 is committed before this task starts.)

- [ ] **Step 6: Run the full test suite to verify no runtime regressions**

Run: `cd packages/typestyles && npx vitest run`

Expected: `Test Files  43 passed (43)`, `Tests  662 passed (662)`.

- [ ] **Step 7: Commit**

```bash
git add packages/typestyles/src/color-modes.ts packages/typestyles/src/types.ts packages/typestyles/src/override.type-tests.ts packages/typestyles/src/component-overload.type-tests.ts
git commit -m "$(cat <<'EOF'
Type mode-aware { light, dark } values in override and recipe styles

VariantOptionStyle, CSSProperties, and StylableOverride now accept the
{ light, dark } shorthand color-modes.ts already compiles to light-dark()
at runtime, using the existing (previously unused) ModeAwareValue type.
Ungated — not tied to a given createStyles() instance's colorModes config,
matching how conditions/when are also never gated at the type level.
Part of Issue #169.
EOF
)"
```

---

## Task 3: Add changeset

**Files:**

- Create: `.changeset/override-mode-aware-conditions-typing.md`

**Interfaces:**

- Consumes: nothing.
- Produces: nothing consumed by other tasks — this is the last task.

- [ ] **Step 1: Write the changeset**

Create `.changeset/override-mode-aware-conditions-typing.md`:

```markdown
---
'typestyles': patch
---

Fix `conditions` type-checking in `styles.override()` configs and type mode-aware `{ light, dark }` property values in override and recipe styles (Issue #169)
```

(Matches the format of existing changesets, e.g. `.changeset/vars-typing-css-properties.md`. `patch` because this only fixes/adds type-checking — no runtime behavior changes.)

- [ ] **Step 2: Commit**

```bash
git add .changeset/override-mode-aware-conditions-typing.md
git commit -m "$(cat <<'EOF'
Add changeset for conditions/mode-aware typing fix
EOF
)"
```

---

## Final verification

- [ ] Run `cd packages/typestyles && npx tsc --noEmit && npx vitest run` one more time from a clean `git status` to confirm the full three-commit stack is green end to end.
- [ ] Run `cd packages/typestyles && npx eslint src/types.ts src/override.ts src/color-modes.ts src/override.type-tests.ts src/component-overload.type-tests.ts` to confirm lint passes on touched files.
