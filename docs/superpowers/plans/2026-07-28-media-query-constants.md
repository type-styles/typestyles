# Media Query Constants (`mediaQueries`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `mediaQueries` constant export to the `typestyles` package providing ready-to-use `@media (...)` string constants for `prefers-reduced-motion`, `prefers-contrast`, and hover/pointer capability queries.

**Architecture:** One new small, self-contained module (`media-queries.ts`) exporting a single `as const` object grouped by CSS media feature, wired into the existing `index.ts` barrel export. No changes to runtime style-resolution code — the existing `@media (...)` string-key handling in `styles.component`/`css`/`override` already supports arbitrary literal keys (see `at-rule-block.ts`, `media.ts`), so this is purely additive constants.

**Tech Stack:** TypeScript, Vitest (existing project toolchain — no new dependencies).

## Global Constraints

- Every leaf value must be a complete, literal string of the exact form `` `@media (${feature}: ${value})` ``, typed as the existing `MediaQueryKey` type from `./media` (`` `@media ${string}` ``).
- Sub-keys are the camelCase form of the literal CSS keyword (e.g. `no-preference` → `noPreference`), matching the spec exactly — see `docs/superpowers/specs/2026-07-28-media-query-constants-design.md`.
- Only these six feature groups, exactly these values (no `prefers-color-scheme`, `orientation`, width breakpoints, `forced-colors`, `inverted-colors`, or `print` — explicitly out of scope):
  - `prefersReducedMotion`: `reduce`, `noPreference`
  - `prefersContrast`: `more`, `less`, `noPreference`
  - `hover`: `hover`, `none`
  - `anyHover`: `hover`, `none`
  - `pointer`: `fine`, `coarse`, `none`
  - `anyPointer`: `fine`, `coarse`, `none`
- Follow existing repo conventions: Vitest `describe`/`it`/`expect` (see `packages/typestyles/src/media.test.ts` for house style), named exports (no default exports), `as const satisfies` pattern already used elsewhere in the package.

---

### Task 1: `mediaQueries` module with tests

**Files:**

- Create: `packages/typestyles/src/media-queries.ts`
- Create: `packages/typestyles/src/media-queries.test.ts`

**Interfaces:**

- Consumes: `MediaQueryKey` type, exported from `packages/typestyles/src/media.ts` (already defined as ``export type MediaQueryKey = `@media ${string}`;``).
- Produces: `mediaQueries` (const object) and `MediaQueries` (its inferred type), both exported from `packages/typestyles/src/media-queries.ts`. Task 2 imports both by these exact names.

- [ ] **Step 1: Write the failing test**

Create `packages/typestyles/src/media-queries.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mediaQueries } from './media-queries';

describe('mediaQueries', () => {
  it('prefersReducedMotion', () => {
    expect(mediaQueries.prefersReducedMotion.reduce).toBe(
      '@media (prefers-reduced-motion: reduce)',
    );
    expect(mediaQueries.prefersReducedMotion.noPreference).toBe(
      '@media (prefers-reduced-motion: no-preference)',
    );
  });

  it('prefersContrast', () => {
    expect(mediaQueries.prefersContrast.more).toBe('@media (prefers-contrast: more)');
    expect(mediaQueries.prefersContrast.less).toBe('@media (prefers-contrast: less)');
    expect(mediaQueries.prefersContrast.noPreference).toBe(
      '@media (prefers-contrast: no-preference)',
    );
  });

  it('hover', () => {
    expect(mediaQueries.hover.hover).toBe('@media (hover: hover)');
    expect(mediaQueries.hover.none).toBe('@media (hover: none)');
  });

  it('anyHover', () => {
    expect(mediaQueries.anyHover.hover).toBe('@media (any-hover: hover)');
    expect(mediaQueries.anyHover.none).toBe('@media (any-hover: none)');
  });

  it('pointer', () => {
    expect(mediaQueries.pointer.fine).toBe('@media (pointer: fine)');
    expect(mediaQueries.pointer.coarse).toBe('@media (pointer: coarse)');
    expect(mediaQueries.pointer.none).toBe('@media (pointer: none)');
  });

  it('anyPointer', () => {
    expect(mediaQueries.anyPointer.fine).toBe('@media (any-pointer: fine)');
    expect(mediaQueries.anyPointer.coarse).toBe('@media (any-pointer: coarse)');
    expect(mediaQueries.anyPointer.none).toBe('@media (any-pointer: none)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/typestyles && npx vitest run src/media-queries.test.ts`
Expected: FAIL — `Cannot find module './media-queries'` (the module doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `packages/typestyles/src/media-queries.ts`:

````ts
import type { MediaQueryKey } from './media';

/**
 * Ready-to-use `@media (...)` string constants for common CSS media features,
 * grouped by feature. Drop a leaf value directly into a `styles.component` /
 * `css` / `override` style object as a key:
 *
 * @example
 * ```ts
 * const card = styles.component('card', {
 *   base: { transition: 'transform 200ms ease' },
 *   [mediaQueries.prefersReducedMotion.reduce]: { transition: 'none' },
 * });
 * ```
 */
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
````

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/typestyles && npx vitest run src/media-queries.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck**

Run: `cd packages/typestyles && npx tsc --noEmit`
Expected: no errors. This confirms every leaf value satisfies `MediaQueryKey`.

- [ ] **Step 6: Commit**

```bash
git add packages/typestyles/src/media-queries.ts packages/typestyles/src/media-queries.test.ts
git commit -m "feat: add mediaQueries constant module"
```

---

### Task 2: Wire `mediaQueries` into the package's public API

**Files:**

- Modify: `packages/typestyles/src/index.ts`
- Test: `packages/typestyles/src/media-queries.test.ts` (extend from Task 1)

**Interfaces:**

- Consumes: `mediaQueries` and `MediaQueries` from `./media-queries` (produced by Task 1).
- Produces: `mediaQueries` and `MediaQueries` now importable from the package root (`typestyles`), for docs (Task 3) and any consumer code.

- [ ] **Step 1: Write the failing test**

Add this test to the bottom of `packages/typestyles/src/media-queries.test.ts` (same file — appended, not a new file):

```ts
describe('mediaQueries package export', () => {
  it('is re-exported from the package root', async () => {
    const pkg = await import('./index');
    expect(pkg.mediaQueries).toBe(mediaQueries);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/typestyles && npx vitest run src/media-queries.test.ts`
Expected: FAIL — `pkg.mediaQueries` is `undefined`, `expect(undefined).toBe(mediaQueries)` fails.

- [ ] **Step 3: Add the export**

In `packages/typestyles/src/index.ts`, find the existing media-related export block (currently):

```ts
export type {
  MediaQueryKey,
  MediaKeyFromCondition,
  MediaBreakpointFeature,
  MediaBreakpointOptions,
  BreakpointMediaFn,
  MediaFn,
} from './media';
export { createBreakpointMediaFn, createMediaFn, resolveBreakpointMediaKey } from './media';
```

Immediately after it, add:

```ts
export type { MediaQueries } from './media-queries';
export { mediaQueries } from './media-queries';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/typestyles && npx vitest run src/media-queries.test.ts`
Expected: PASS (7 tests total).

- [ ] **Step 5: Run the full package test suite and typecheck**

Run: `cd packages/typestyles && npx vitest run && npx tsc --noEmit`
Expected: all existing tests still PASS, no typecheck errors (confirms no naming collision with existing exports).

- [ ] **Step 6: Commit**

```bash
git add packages/typestyles/src/index.ts packages/typestyles/src/media-queries.test.ts
git commit -m "feat: export mediaQueries from typestyles package root"
```

---

### Task 3: Document `mediaQueries` in the custom-at-rules guide

**Files:**

- Modify: `docs/content/docs/custom-at-rules.md:341-343` (insert a new subsection between the existing `### Combining media queries with pseudo-classes` section and `### Viewport breakpoints from config`)

**Interfaces:**

- Consumes: `mediaQueries` from `typestyles` (produced by Task 2) — only used inside a documentation code sample, not imported by any other task.
- Produces: nothing consumed by later tasks (this is the last task).

- [ ] **Step 1: Insert the new docs subsection**

In `docs/content/docs/custom-at-rules.md`, the file currently reads (around line 336-343):

```
    // Touch device adjustments
    '@media (pointer: coarse)': {
      padding: '12px 20px', // Larger touch target
    },
  },
});
```

### Viewport breakpoints from config

````

Insert a new subsection directly after the closing ` ``` ` of the "Combining media queries with pseudo-classes" example and before `### Viewport breakpoints from config`, so the file reads:

````

    // Touch device adjustments
    '@media (pointer: coarse)': {
      padding: '12px 20px', // Larger touch target
    },

},
});

````

### Media query constants (`mediaQueries`)

`typestyles` exports a `mediaQueries` constant with ready-to-use `@media (...)` strings for common features that don't come from your configured breakpoints — motion, contrast, and hover/pointer capability preferences. Each value is grouped by feature, then by the literal CSS keyword:

```ts
import { styles, mediaQueries } from 'typestyles';

const card = styles.component('card', {
  base: { transition: 'transform 200ms ease' },

  // Respect prefers-reduced-motion
  [mediaQueries.prefersReducedMotion.reduce]: { transition: 'none' },

  // Larger touch target on coarse pointers (e.g. touchscreens)
  [mediaQueries.pointer.coarse]: { padding: '12px 20px' },
});
````

Available groups: `prefersReducedMotion` (`reduce`, `noPreference`), `prefersContrast` (`more`, `less`, `noPreference`), `hover` (`hover`, `none`), `anyHover` (`hover`, `none`), `pointer` (`fine`, `coarse`, `none`), `anyPointer` (`fine`, `coarse`, `none`).

For `prefers-color-scheme`, viewport orientation, or width breakpoints, see [`@typestyles/open-props`'s `media` token map](/docs/open-props#media-queries) or [`tokens.when.prefersDark` / `prefersLight`](/docs/theming-patterns) instead.

### Viewport breakpoints from config

````

- [ ] **Step 2: Verify the docs build**

Run: `cd docs && npm run build` (runs `astro build`, per `docs/package.json`) and confirm no errors and the new section renders under `/docs/custom-at-rules`.

- [ ] **Step 3: Commit**

```bash
git add docs/content/docs/custom-at-rules.md
git commit -m "docs: document mediaQueries constant export"
````
