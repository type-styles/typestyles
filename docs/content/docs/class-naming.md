---
title: Class naming
description: Configure semantic, hashed, or atomic-style class names for styles.create, styles.class, and styles.component
---

# Class naming

By default, typestyles emits **readable semantic** class names: `button-base`, `card-elevated`, `button-intent-primary`. You can switch to **hashed** or **hash-only** names for smaller strings, fewer accidental collisions across packages, or closer parity with CSS-in-JS tools that minify class names.

Naming applies to:

- [`styles.create`](/docs/styles)
- [`styles.class`](/docs/styles)
- [`styles.component`](/docs/recipes) (single-part and [slot](/docs/recipes) recipes)

It does **not** change [`@typestyles/props`](/docs/atomic-css) utility naming; that package uses its own `createProps` namespace pattern.

## Quick start

Call **`configureClassNaming`** once at app or package entry (for example your design system `index.ts` or root `main.tsx`) **before** modules register styles:

```ts
import { configureClassNaming } from 'typestyles';

configureClassNaming({
  mode: 'hashed',
  prefix: 'ds',
  scopeId: '@acme/design-system',
});
```

Then existing `styles.create` / `styles.component` calls keep the same TypeScript API; only the emitted `class` strings and generated selectors change.

## API

### `configureClassNaming(options)`

Merges into the current global config (partial updates are allowed).

| Option     | Type | Default    | Description |
| ---------- | ---- | ---------- | ----------- |
| `mode`     | `'semantic' \| 'hashed' \| 'atomic'` | `'semantic'` | How class strings are built (see below). |
| `prefix`   | `string` | `'ts'` | Leading segment for hashed/atomic output and for [`styles.hashClass`](#styleshashclass). |
| `scopeId`  | `string` | `''` | Optional id (package name, app name) mixed into the hash input so two packages can reuse the same logical namespace without sharing the same class string. |

### `getClassNamingConfig()`

Returns a read-only snapshot of the active config (useful for debugging).

### `resetClassNaming()`

Restores defaults. Intended for **tests** so one suite cannot leak naming mode into another; not something you typically call in application code.

## Modes

### `semantic` (default)

Human-readable, stable names derived from the namespace and variant segment:

- `styles.create('card', { base: { … } })` → `card-base`
- `styles.component('button', { … })` → `button-base`, `button-intent-primary`, etc.
- Slot recipes → `{namespace}-{slot}`, `{namespace}-{slot}-{dimension}-{option}`, etc.

### `hashed`

Deterministic names of the form **`{prefix}-{namespace-slug}-{hash}`**. The hash is computed from (when set) `scopeId`, the namespace, a variant segment (e.g. `base`, `intent-primary`, `root-compound-0`), and the serialized style object for that rule. Identical definitions produce identical class strings.

Use this when you want shorter, scoped names while still recognizing the namespace in DevTools.

### `atomic`

**`{prefix}-{hash}`** only—no namespace slug in the string. Same hash inputs as `hashed`, so behavior is equally deterministic.

This mode is a **prototype** for hash-only ergonomics: each recipe rule is still **one class per chunk of CSS** (the same as today), not one utility class per CSS declaration. True per-property atomic output is a separate roadmap area; for Tailwind-style utilities, use [`@typestyles/props`](/docs/atomic-css).

## `styles.hashClass`

[`styles.hashClass(styles, label?)`](/docs/styles) always emits a hashed class from the style object. It uses the configured **`prefix`**. If **`scopeId`** is non-empty, it is included in the hash input so scoped packages do not collide.

When `scopeId` is the default empty string, the hash input matches the previous behavior (properties only, plus label handling), so existing class strings stay stable if you only adopt `prefix` or other naming modes for `create` / `component`.

## Monorepos and `scopeId`

Two packages might both use `styles.create('button', …)` or `styles.component('button', …)`. With **`semantic`** mode, you rely on distinct namespaces. With **`hashed`** / **`atomic`**, set a different **`scopeId`** per package (for example the npm package name) so identical style objects in different packages do not map to the same class string.

## SSR and entry order

Naming is **global** for the loaded bundle. Ensure **`configureClassNaming`** runs before any module that calls `styles.create`, `styles.class`, or `styles.component` during that load. In SSR, the server bundle should apply the same configuration as the client so class names and injected CSS match.

## Testing

If tests call **`configureClassNaming`**, reset in **`beforeEach`** (or **`afterEach`**) so other tests keep the default:

```ts
import { resetClassNaming } from 'typestyles';
import { reset } from 'typestyles';

beforeEach(() => {
  reset();
  resetClassNaming();
});
```

If you assert on class strings under **`hashed`** or **`atomic`**, prefer stable snapshots or assert on substrings (prefix, absence of semantic segments) rather than hard-coding full hashes unless you fix `scopeId` and styles.

See also [Testing](/docs/testing).

## Related

- [Styles](/docs/styles) — `styles.create`, `styles.class`, `compose`, `withUtils`
- [Recipes](/docs/recipes) — `styles.component` and slot recipes
- [Atomic CSS Utilities](/docs/atomic-css) — `@typestyles/props` (separate naming scheme)
- [API Reference](/docs/api-reference) — export list
