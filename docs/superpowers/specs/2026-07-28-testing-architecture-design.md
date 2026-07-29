# Design: TypeStyles testing architecture (+ public test-harness contract, closes #170)

- **Issue:** [type-styles/typestyles#170](https://github.com/type-styles/typestyles/issues/170)
- **Status:** Approved
- **Scope:** Two parts. (1) A named taxonomy for the testing layers that already exist informally
  in this repo, plus a gap analysis. (2) A fully-specified, immediately-implementable feature: a
  `typestyles/testing` export closing issue #170. Gaps identified in the taxonomy that aren't #170
  become backlog items tracked as **P7** in `IMPROVEMENTS.md`, not implemented in this PR.

## Context

Issue #170 was filed against a specific pain point: design systems built on TypeStyles (var-ui is
the reference case) accumulate package-level registries — custom token namespaces, font faces,
global styles registered on import — that must be cleared in the same lifecycle as TypeStyles'
own `reset()`. Every design-system package currently hand-rolls this in a `beforeEach`:

```ts
import { reset } from 'typestyles';

beforeEach(() => {
  reset();
  resetRegisteredFontFaces(); // var-ui local
  resetExtendTokenRegistry(); // var-ui local (wraps tokens.create dedup)
  registerColorSchemeGlobals(); // var-ui local (re-registers global color-scheme rules)
});
```

While scoping the fix, a broader question came up: TypeStyles has never written down what its
testing strategy actually is, across CSS-output correctness, TypeScript DX correctness, and
bundler-integration correctness. That strategy already exists, just implicitly, spread across
five uncoordinated layers with inconsistent coverage. This spec names those layers so future gap
analysis (including this one) has a shared vocabulary, and treats the #170 fix as the first
concrete instance of one of those layers.

## Part 1 — Testing taxonomy

| #   | Layer                                   | Mechanism                                                                                                                                                       | Current coverage                                                                                                           | Correctness claim                                                                                        |
| --- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | Unit tests                              | vitest + jsdom, colocated `*.test.ts`                                                                                                                           | Deep in `packages/typestyles`; decent in `props`/`build-runner`/`cli`/`migrate`; thin elsewhere                            | "This function/module does what its contract says"                                                       |
| 2   | Type-DX tests                           | `*.type-tests.ts`, excluded from the vitest glob (`tsconfig.json` only excludes `**/*.test.ts`) but included in `tsc --noEmit`, so `pnpm typecheck` is the gate | Only `packages/typestyles` (`override.type-tests.ts`, `component-overload.type-tests.ts`, `tokens-ref-tree.type-tests.ts`) | "Valid usage type-checks; invalid usage is caught via `@ts-expect-error`"                                |
| 3   | Runtime/build-parity tests              | Per-bundler vitest suites asserting build-time-extracted CSS === runtime-injected CSS for identical source, gated by `describe.skipIf(!existsSync(dist))`       | vite, rollup, esbuild, webpack, next, astro (per P5.6)                                                                     | "What ships from a build is what you'd get at runtime"                                                   |
| 4   | Bundler-integration (example-app) tests | A real bundler builds a real app; `verify-build.mjs` inspects the dist output                                                                                   | Only `esbuild-app`, `parcel-app`, `svelte-app`, `vue-app` have a `test` script                                             | "The bundler that has no dedicated TypeStyles plugin package still produces correct output"              |
| 5   | Public test-harness contract            | Utilities TypeStyles ships _for consumers_ testing their own output                                                                                             | Nonexistent today — this is issue #170                                                                                     | "Design systems built on TypeStyles can reset state correctly between tests without copying boilerplate" |

## Part 2 — Public test-harness contract (closes #170)

### API

New subpath export `typestyles/testing`, following the existing subpath convention (`./server`,
`./globals`, `./hmr`, `./build`, `./css`, `./color`, `./color-scale`, `./token-scale`):

```ts
// typestyles/testing
export function resetAll(): void;
export function onAfterReset(fn: () => void): () => void; // returns an unsubscribe function

export function createTestHarness(options?: { globals?: Array<() => void> }): { reset: () => void };
```

- **`resetAll()`** calls the existing core `reset()` (from `sheet.ts` — styles, tokens, custom
  properties, property registrations; no behavior change to core `reset()`), then synchronously
  invokes every subscriber registered via `onAfterReset`, in registration order.
- **`onAfterReset(fn)`** is the generic re-registration hook. A design-system package's runtime
  module calls it once, at import time (`onAfterReset(registerColorSchemeGlobals)`), and every
  future `resetAll()` re-runs `fn` automatically — no more hand-copied `beforeEach` blocks per test
  file.
- **`createTestHarness({ globals })`** is sugar: calls `onAfterReset` once per function in
  `globals`, and returns `{ reset: resetAll }` — matching the exact ergonomics the issue's example
  requests.

### Naming

`typestyles/globals` already exports a function called `reset` — a Josh Comeau–style _CSS_ reset
(browser default-style reset), unrelated to test state. `typestyles/testing`'s functions use
distinct names (`resetAll`, not `reset`) so importing both in the same file is never ambiguous.

### Resolves the issue's open design question without touching core `reset()` semantics

The issue asks whether TypeStyles should support "persistent global registrations that survive
reset" as a core capability. This design says no: core `reset()` keeps clearing everything
unconditionally — simple, predictable, one reset mode to reason about. `onAfterReset` makes
re-registration automatic and declarative instead of manual and error-prone, which solves the same
ergonomic problem without adding a second reset mode to the core engine's contract.

### Implementation surface

- `packages/typestyles/src/testing.ts` — new module, `resetAll`/`onAfterReset`/`createTestHarness`.
- `packages/typestyles/tsup.config.ts` — add `testing: 'src/testing.ts'` to `entry`.
- `packages/typestyles/package.json` — add a `"./testing"` block to `exports`, matching the
  `import`/`require` + `types` shape of existing subpath entries.
- `packages/typestyles/src/testing.test.ts` — unit tests: subscriber ordering, unsubscribe,
  `createTestHarness` wiring, interaction with core `reset()`.
- `docs/content/docs/testing-design-systems.md` — new page: the `beforeEach(harness.reset)`
  pattern, `getRegisteredCss()` assertions, snapshot testing via `@typestyles/cli`, using var-ui's
  actual `registerColorSchemeGlobals`/`resetExtendTokenRegistry` shape as the worked example.
  Linked from the existing `docs/content/docs/testing.md`.

### Acceptance criteria (from issue #170)

- [x] Testing guide added to TypeStyles docs — `testing-design-systems.md`
- [x] `typestyles/testing` entry with `createTestHarness` (plus composable primitives)
- [ ] Example test file in TypeStyles repo or var-ui referenced from docs — the docs page's worked
      example serves this; a follow-up var-ui-side PR to actually adopt the harness is out of
      scope here (separate repo)
- [x] Documented contract: what `reset()` clears vs. what packages must re-register (via
      `onAfterReset`)

## Part 3 — Gap analysis → backlog (tracked as P7 in `IMPROVEMENTS.md`, not implemented here)

While mapping CI wiring for layer 4, found the failure mode is sharper than "some example apps
lack a `test` script": CI's `test` job runs `turbo run test` only (never `turbo run build` across
the whole graph). Turbo skips any package with no matching script entirely — including that
package's own `build` script. So `vite-app`, `rollup-app`, `rolldown-app`, `next-app`, and
`typewind` are never built in CI today, not even to catch a broken build. `next-app` is the
sharpest case: its `build` script runs `pnpm typestyles:verify`, a real correctness check that
currently executes nowhere in CI.

This becomes **P7 — Testing architecture** in `IMPROVEMENTS.md`, appended after P6 following the
existing P-item convention (checkbox, one-paragraph description, PR link when shipped):

- **P7.1 — Wire unbuilt example apps into CI.** Give `vite-app`, `rollup-app`, `rolldown-app`,
  `next-app`, `typewind` a `test` script (`build` at minimum; `build` + `verify-build.mjs` where a
  real assertion is cheap to add), matching the esbuild-app/parcel-app/svelte-app/vue-app pattern.
- **P7.2 — Roll out the `*.type-tests.ts` convention beyond `packages/typestyles`.** Extend to
  `packages/react` and `packages/props` — the two packages with the most consumer-facing
  generic/overload surface.
- **P7.3 — Harden build-parity tests against silent skip.** `describe.skipIf(!existsSync(dist))`
  means a parity test silently vanishes if run outside turbo's dependency graph (e.g.
  `vitest run` directly inside a bundler package, or CI running tests without the build step for
  some reason). Make the skip loud (log a warning naming the missing dist) or assert the dist
  exists explicitly in CI.
- **P7.4 — Visual regression baseline.** No Playwright/Cypress anywhere in the repo despite
  `docs/content/docs/testing.md` recommending both to consumers. Evaluate adding one to a single
  example app as a dogfooding proof point, not a full rollout.
- **P7.5 — Public test-harness contract.** Cross-reference only — tracked as shipped once the Part
  2 PR described in this spec lands; not a new open item.

`IMPROVEMENTS.md`'s P7 section is the authoritative backlog tracker for these items going forward;
this spec is the design record for why they exist, not a duplicate tracker.
