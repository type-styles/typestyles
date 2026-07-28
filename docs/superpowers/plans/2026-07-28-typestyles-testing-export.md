# typestyles/testing export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `typestyles/testing` subpath export (`resetAll`, `onAfterReset`, `createTestHarness`) so design-system packages built on TypeStyles (var-ui is the reference consumer) can reset core state and re-register package-level globals in one call, closing issue #170.

**Architecture:** A new, self-contained module `packages/typestyles/src/testing.ts` wraps the existing core `reset()` (from `sheet.ts`) with a subscriber list (`onAfterReset`), mirroring the existing `registeredCssListeners` Set pattern already in `sheet.ts`. No changes to core `reset()` semantics. Wired up as a new tsup entry + package.json subpath export, following the exact pattern of `./globals`, `./hmr`, etc. Finishes with a new docs page and the P7 backlog appended to `IMPROVEMENTS.md`.

**Tech Stack:** TypeScript, vitest (jsdom environment), tsup, pnpm workspaces, Astro docs site (`docs/content/docs/*.md` + `docs/src/navigation.ts`).

## Global Constraints

- `typestyles/testing`'s exports must never be named `reset` — `typestyles/globals` already exports an unrelated `reset` (CSS reset), and importing both in one file must never be ambiguous. Use `resetAll`.
- Core `reset()` in `packages/typestyles/src/sheet.ts` is not modified. `testing.ts` only wraps it.
- Follow the existing subpath export shape exactly: `import`/`require` blocks each with `types` + `default`, matching `./globals` in `packages/typestyles/package.json`.
- New source files go through the same `tsc --noEmit` / `eslint` / `vitest run` gates as the rest of `packages/typestyles` — no new tooling.

---

### Task 1: `resetAll` / `onAfterReset` / `createTestHarness` module

**Files:**

- Create: `packages/typestyles/src/testing.ts`
- Create: `packages/typestyles/src/testing.test.ts`

**Interfaces:**

- Consumes: `reset` from `packages/typestyles/src/sheet.ts` (existing, signature `(): void`).
- Produces (used by Task 2's barrel export, and by consumers importing `typestyles/testing`):
  - `resetAll(): void`
  - `onAfterReset(fn: () => void): () => void` (return value unsubscribes)
  - `createTestHarness(options?: { globals?: Array<() => void> }): { reset: () => void }`

- [ ] **Step 1: Write the failing tests**

Create `packages/typestyles/src/testing.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { resetAll, onAfterReset, createTestHarness } from './testing';
import { reset } from './sheet';

describe('resetAll', () => {
  it('calls core reset()', () => {
    const calls: string[] = [];
    onAfterReset(() => calls.push('after'));
    resetAll();
    expect(calls).toEqual(['after']);
  });

  it('invokes subscribers in registration order', () => {
    const calls: number[] = [];
    const unsubA = onAfterReset(() => calls.push(1));
    const unsubB = onAfterReset(() => calls.push(2));
    resetAll();
    expect(calls).toEqual([1, 2]);
    unsubA();
    unsubB();
  });

  it('stops calling a subscriber after it unsubscribes', () => {
    const fn = vi.fn();
    const unsubscribe = onAfterReset(fn);
    unsubscribe();
    resetAll();
    expect(fn).not.toHaveBeenCalled();
  });

  it('does not throw when there are no subscribers', () => {
    expect(() => resetAll()).not.toThrow();
  });
});

describe('createTestHarness', () => {
  it('registers each provided global and re-runs them on reset', () => {
    const fontFaces = vi.fn();
    const colorScheme = vi.fn();
    const harness = createTestHarness({ globals: [fontFaces, colorScheme] });

    harness.reset();

    expect(fontFaces).toHaveBeenCalledTimes(1);
    expect(colorScheme).toHaveBeenCalledTimes(1);

    harness.reset();

    expect(fontFaces).toHaveBeenCalledTimes(2);
    expect(colorScheme).toHaveBeenCalledTimes(2);
  });

  it('works with no options (just wraps resetAll)', () => {
    const harness = createTestHarness();
    expect(() => harness.reset()).not.toThrow();
  });
});

describe('reset() interop', () => {
  it('resetAll clears state that core reset() clears', () => {
    // sanity check the wrapped function is actually core reset, not a no-op
    const spy = vi.fn();
    onAfterReset(spy);
    reset(); // calling core reset directly should NOT trigger onAfterReset subscribers
    expect(spy).not.toHaveBeenCalled();
    resetAll();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter typestyles exec vitest run src/testing.test.ts`
Expected: FAIL — `Cannot find module './testing'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `packages/typestyles/src/testing.ts`:

````ts
import { reset } from './sheet';

const afterResetListeners = new Set<() => void>();

/**
 * Register a callback to run after every `resetAll()` call — typically used
 * by design-system packages to re-register package-level globals (font
 * faces, color-scheme rules, extended token namespaces) that core `reset()`
 * clears along with everything else.
 *
 * Returns an unsubscribe function.
 */
export function onAfterReset(fn: () => void): () => void {
  afterResetListeners.add(fn);
  return () => {
    afterResetListeners.delete(fn);
  };
}

/**
 * Reset all TypeStyles state (styles, tokens, custom properties, property
 * registrations — via the core `reset()`), then re-run every callback
 * registered with `onAfterReset`, in registration order.
 *
 * Use this instead of importing `reset` directly in test setup when your
 * package (or the package under test) has registered `onAfterReset` hooks.
 */
export function resetAll(): void {
  reset();
  for (const listener of afterResetListeners) {
    listener();
  }
}

/**
 * Convenience wrapper: registers each function in `options.globals` as an
 * `onAfterReset` hook, and returns a `{ reset }` object wired to `resetAll`.
 *
 * @example
 * ```ts
 * import { createTestHarness } from 'typestyles/testing';
 *
 * const harness = createTestHarness({
 *   globals: [registerColorSchemeGlobals],
 * });
 *
 * beforeEach(() => harness.reset());
 * ```
 */
export function createTestHarness(options?: { globals?: Array<() => void> }): {
  reset: () => void;
} {
  for (const fn of options?.globals ?? []) {
    onAfterReset(fn);
  }
  return { reset: resetAll };
}
````

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter typestyles exec vitest run src/testing.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Run the full typestyles package test suite to check for regressions**

Run: `pnpm --filter typestyles test`
Expected: PASS (all existing tests unaffected)

- [ ] **Step 6: Commit**

```bash
git add packages/typestyles/src/testing.ts packages/typestyles/src/testing.test.ts
git commit -m "feat(typestyles): add resetAll/onAfterReset/createTestHarness for design-system test setup"
```

---

### Task 2: Wire `typestyles/testing` as a public subpath export

**Files:**

- Modify: `packages/typestyles/tsup.config.ts`
- Modify: `packages/typestyles/package.json`
- Test: `packages/typestyles/src/testing.test.ts` (already passing from Task 1 — this task verifies the _built_ package resolves the subpath correctly)

**Interfaces:**

- Consumes: `packages/typestyles/src/testing.ts` exports from Task 1 (`resetAll`, `onAfterReset`, `createTestHarness`).
- Produces: `typestyles/testing` resolvable as an import specifier from any workspace package, backed by `dist/testing.js` / `dist/testing.cjs` / `dist/testing.d.ts` / `dist/testing.d.cts`.

- [ ] **Step 1: Add the tsup entry**

In `packages/typestyles/tsup.config.ts`, add `testing: 'src/testing.ts'` to the `entry` object (after `'token-scale'`):

```ts
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    color: 'src/color-entry.ts',
    'color-scale': 'src/color-scale-entry.ts',
    'token-scale': 'src/token-scale-entry.ts',
    globals: 'src/globals.ts',
    css: 'src/css-entry.ts',
    server: 'src/server.ts',
    hmr: 'src/hmr.ts',
    build: 'src/build.ts',
    testing: 'src/testing.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['node:async_hooks'],
});
```

- [ ] **Step 2: Add the package.json exports block**

In `packages/typestyles/package.json`, add a `"./testing"` block immediately after `"./token-scale"` (before the closing `}` of `exports`):

```json
    "./token-scale": {
      "import": {
        "types": "./dist/token-scale.d.ts",
        "default": "./dist/token-scale.js"
      },
      "require": {
        "types": "./dist/token-scale.d.cts",
        "default": "./dist/token-scale.cjs"
      }
    },
    "./testing": {
      "import": {
        "types": "./dist/testing.d.ts",
        "default": "./dist/testing.js"
      },
      "require": {
        "types": "./dist/testing.d.cts",
        "default": "./dist/testing.cjs"
      }
    }
```

(Note the added trailing comma after `"./token-scale"`'s closing `}`, since it's no longer the last entry.)

- [ ] **Step 3: Build the package**

Run: `pnpm --filter typestyles build`
Expected: Succeeds, and `packages/typestyles/dist/testing.js`, `dist/testing.cjs`, `dist/testing.d.ts`, `dist/testing.d.cts` all exist.

Verify: `ls packages/typestyles/dist/testing.*`

- [ ] **Step 4: Write a build-resolution smoke test**

Create `packages/typestyles/src/testing-export.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('typestyles/testing dist output', () => {
  it('emits esm, cjs, and type declaration files', () => {
    const dist = fileURLToPath(new URL('../dist', import.meta.url));
    expect(existsSync(`${dist}/testing.js`)).toBe(true);
    expect(existsSync(`${dist}/testing.cjs`)).toBe(true);
    expect(existsSync(`${dist}/testing.d.ts`)).toBe(true);
    expect(existsSync(`${dist}/testing.d.cts`)).toBe(true);
  });
});
```

- [ ] **Step 5: Run the smoke test**

Run: `pnpm --filter typestyles exec vitest run src/testing-export.test.ts`
Expected: PASS

- [ ] **Step 6: Run typecheck across the whole workspace**

Run: `pnpm typecheck`
Expected: PASS — confirms the new `exports` block's `types` paths resolve and nothing else in the workspace broke.

- [ ] **Step 7: Commit**

```bash
git add packages/typestyles/tsup.config.ts packages/typestyles/package.json packages/typestyles/src/testing-export.test.ts
git commit -m "feat(typestyles): expose resetAll/onAfterReset/createTestHarness via typestyles/testing subpath"
```

---

### Task 3: Docs page for testing design systems built on TypeStyles

**Files:**

- Create: `docs/content/docs/testing-design-systems.md`
- Modify: `docs/src/navigation.ts`
- Modify: `docs/content/docs/testing.md`

**Interfaces:**

- Consumes: `createTestHarness`, `onAfterReset`, `resetAll` from Task 2 (documented usage only, no new code interfaces).

- [ ] **Step 1: Add the navigation entry**

In `docs/src/navigation.ts`, in the `Guides` section, add a new item immediately after the existing `testing` entry (around line 67):

```ts
        { slug: 'testing', title: 'Testing' },
        { slug: 'testing-design-systems', title: 'Testing Design Systems' },
```

- [ ] **Step 2: Write the docs page**

Create `docs/content/docs/testing-design-systems.md`:

````markdown
---
title: Testing Design Systems
description: Test harness patterns for design systems and component libraries built on typestyles
---

If you're building a design system or component library on top of typestyles — registering
package-level globals, extended token namespaces, or font faces at import time — every test file
that touches your styles needs a coordinated reset. This page covers the `typestyles/testing`
utilities that make that reset automatic.

## The problem

typestyles' own `reset()` clears its internal state (styles, tokens, custom properties, property
registrations) between tests. But a design system built on top of it typically registers its own
state on import — global color-scheme rules, font faces, an extended token registry — none of
which typestyles knows about. Without a coordinated reset, every test file ends up with
hand-copied boilerplate like this:

```ts
import { reset } from 'typestyles';

beforeEach(() => {
  reset();
  resetRegisteredFontFaces(); // your package
  resetExtendTokenRegistry(); // your package
  registerColorSchemeGlobals(); // your package — must re-run after reset() clears globals
});
```

This is fragile: forgetting to re-run `registerColorSchemeGlobals()` after `reset()` produces
tests that silently assert against incomplete CSS.

## `onAfterReset` — register once, re-run automatically

Instead of re-registering globals in every test file's `beforeEach`, register them once, at
import time, in your package's runtime module:

```ts
// your-design-system/src/runtime.ts
import { onAfterReset } from 'typestyles/testing';

export function registerColorSchemeGlobals() {
  /* ... global.style(...) calls ... */
}

// Re-run this automatically every time a test calls resetAll()
onAfterReset(registerColorSchemeGlobals);
```

Then in tests, call `resetAll()` instead of `reset()`:

```ts
import { resetAll } from 'typestyles/testing';

beforeEach(() => {
  resetAll(); // clears typestyles state, then re-runs registerColorSchemeGlobals()
});
```

`onAfterReset` returns an unsubscribe function if you ever need to stop a callback from running
(uncommon outside of testing the hook itself).

## `createTestHarness` — one call per package

If your package has several registries to re-register, `createTestHarness` collects them:

```ts
// your-design-system/test-setup.ts
import { createTestHarness } from 'typestyles/testing';
import { registerColorSchemeGlobals } from './src/runtime';
import { resetExtendTokenRegistry } from './src/extend-tokens';
import { resetRegisteredFontFaces } from './src/fonts';

export const harness = createTestHarness({
  globals: [registerColorSchemeGlobals, resetExtendTokenRegistry, resetRegisteredFontFaces],
});
```

```ts
// any test file
import { harness } from '../test-setup';

beforeEach(() => harness.reset());
```

`harness.reset()` is exactly `resetAll()` — the object form is just a convenient place to
enumerate your package's globals once.

## Asserting on the generated CSS

Once state is reset correctly, use `getRegisteredCss()` to assert against the actual CSS your
components produce:

```ts
import { getRegisteredCss } from 'typestyles';
import { harness } from '../test-setup';
import { Button } from './Button';

beforeEach(() => harness.reset());

it('registers the primary variant CSS', () => {
  Button({ variant: 'primary' });
  expect(getRegisteredCss()).toContain('.button--primary');
});
```

## Snapshotting public class names

For a design system that promises class-name stability to consumers, snapshot the public API
surface with `@typestyles/cli` rather than asserting individual class names by hand — see
[Publishing Packages — guard public class names](/docs/publishing-packages#guard-public-class-names).

## What `reset()` clears vs. what you must re-register

| Cleared automatically by `reset()` / `resetAll()` | Must be re-registered via `onAfterReset`                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| Injected style rules, atomic cache                | Global styles (`typestyles.global.style`) registered at import time      |
| Token registrations (`tokens.create`)             | Package-level token dedup registries you built on top of `tokens.create` |
| Custom property (`@property`) registrations       | Font faces registered via your own wrapper around `globalFontFace`       |
| Emitted class-name tracking                       | Any other package-level singleton state initialized at import time       |

If your package registers something at import time that survives a re-import in the same test
process (most test runners don't re-evaluate modules per test), it needs an `onAfterReset` hook —
otherwise the first test to run gets it, and every test after doesn't.
````

- [ ] **Step 3: Link from the existing testing guide**

In `docs/content/docs/testing.md`, add a new subsection right before `## Best practices` (after the "Snapshot testing class names" and "Mocking typestyles" sections, so it reads as the natural next step for library authors):

```markdown
## Testing design systems built on typestyles

If you're building a design system or component library — not just consuming one — see
[Testing Design Systems](/docs/testing-design-systems) for the `typestyles/testing` harness
utilities (`resetAll`, `onAfterReset`, `createTestHarness`) that coordinate resetting typestyles'
state with your own package-level registries (global styles, extended tokens, font faces).
```

- [ ] **Step 4: Build the docs site to verify the page renders**

Run: `pnpm --filter docs build`

Expected: Build succeeds; no Astro content-collection errors about the new page or nav entry.

- [ ] **Step 5: Commit**

```bash
git add docs/content/docs/testing-design-systems.md docs/content/docs/testing.md docs/src/navigation.ts
git commit -m "docs: add Testing Design Systems guide for typestyles/testing harness"
```

---

### Task 4: Append P7 backlog to `IMPROVEMENTS.md`

**Files:**

- Modify: `IMPROVEMENTS.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Append the P7 section**

At the end of `IMPROVEMENTS.md` (after the `## P6 — Future (unscheduled)` section's final item),
add:

```markdown
## P7 — Testing architecture

Gaps identified while designing the `typestyles/testing` export (issue #170). See
`docs/superpowers/specs/2026-07-28-testing-architecture-design.md` for the full analysis; this
section is the authoritative tracker for the items themselves.

- [ ] **P7.1 — Wire unbuilt example apps into CI**
  - `vite-app`, `rollup-app`, `rolldown-app`, `next-app`, `typewind` have no `test` script, so
    `turbo run test` (what CI actually runs) skips them entirely — including their own `build`
    script. `next-app`'s `build` script runs `pnpm typestyles:verify`, a real correctness check
    that currently executes nowhere in CI. Give each a `test` script (`build` at minimum, or
    `build` plus a `verify-build.mjs` where a real assertion is cheap to add), matching the
    esbuild-app/parcel-app/svelte-app/vue-app pattern.

- [ ] **P7.2 — Roll out the `*.type-tests.ts` convention beyond `packages/typestyles`**
  - Only `packages/typestyles` has compile-time-checked type tests
    (`tsc --noEmit`-only, excluded from the vitest glob). Extend the convention to
    `packages/react` and `packages/props` — the two packages with the most consumer-facing
    generic/overload surface.

- [ ] **P7.3 — Harden build-parity tests against silent skip**
  - `describe.skipIf(!existsSync(dist))` in the per-bundler parity tests (vite, rollup, esbuild,
    webpack, next, astro) means a parity test silently vanishes if run outside turbo's
    dependency graph. Make the skip loud (log a warning naming the missing dist) or assert the
    dist exists explicitly in CI.

- [ ] **P7.4 — Visual regression baseline**
  - No Playwright/Cypress anywhere in the repo despite `docs/content/docs/testing.md`
    recommending both to consumers. Evaluate adding one to a single example app as a dogfooding
    proof point, not a full rollout.

- [x] **P7.5 — Public test-harness contract**
  - Shipped: `typestyles/testing` subpath export (`resetAll`, `onAfterReset`,
    `createTestHarness`), closing issue #170. Docs:
    `docs/content/docs/testing-design-systems.md`.
```

- [ ] **Step 2: Commit**

```bash
git add IMPROVEMENTS.md
git commit -m "docs: track testing-architecture gaps as P7 in IMPROVEMENTS.md"
```

---

## Final verification

- [ ] **Step 1: Run the full workspace verify script**

Run: `pnpm verify` (runs lint, typecheck, and test across the whole turbo graph)
Expected: PASS

- [ ] **Step 2: Push the branch and open a PR referencing #170**

```bash
git push -u origin docs/testing-architecture-spec-170
gh pr create --title "Add typestyles/testing export (closes #170)" --body "$(cat <<'EOF'
## Summary
- Adds `typestyles/testing` (`resetAll`, `onAfterReset`, `createTestHarness`) so design-system
  packages (var-ui) can reset typestyles state and re-register package-level globals in one call.
- Adds a "Testing Design Systems" docs guide.
- Tracks remaining testing-architecture gaps (unbuilt example apps in CI, type-tests rollout,
  build-parity silent-skip hardening, visual regression) as P7 in IMPROVEMENTS.md.

Closes #170.

## Test plan
- [ ] `pnpm --filter typestyles test` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm --filter typestyles-docs build` succeeds with the new page
- [ ] `pnpm verify` passes end-to-end
EOF
)"
```
