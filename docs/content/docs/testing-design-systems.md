---
title: Testing Design Systems
description: Test harness patterns for design systems and component libraries built on typestyles
---

If you're building a design system or component library on top of typestyles — registering
package-level globals, extended token namespaces, or font faces at import time — every test file
that touches your styles needs a coordinated reset. This page covers the `typestyles/testing`
utilities that make that reset automatic.

> **Note:** `typestyles/testing` shares in-memory state with `typestyles` at the module level. This is reliable under ESM resolution (Vite, Vitest's default, modern bundlers). If your test runner transforms everything to CommonJS (e.g. Jest without ESM support enabled), `typestyles` and `typestyles/testing` can resolve to separate module instances with separate state, and `resetAll()` will not correctly clear or re-register your design system's CSS. Use an ESM-native test runner (Vitest is recommended) for accurate results.

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

Instead of re-registering globals in every test file's `beforeEach`, register them once, in a
test-setup file that every test file imports (not your package's production runtime module —
`typestyles/testing` is test-only):

```ts
// your-design-system/test-setup.ts
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
| Injected style rules, atomic cache                | Global styles (`global.style(...)`) registered at import time            |
| Token registrations (`tokens.create`)             | Package-level token dedup registries you built on top of `tokens.create` |
| Custom property (`@property`) registrations       | Font faces registered via your own wrapper around `globalFontFace`       |
| Emitted class-name tracking                       | Any other package-level singleton state initialized at import time       |

If your package registers something at import time that survives a re-import in the same test
process (most test runners don't re-evaluate modules per test), it needs an `onAfterReset` hook —
otherwise the first test to run gets it, and every test after doesn't.
