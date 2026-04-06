---
title: Class naming
description: Per-instance semantic, hashed, or atomic class names via createStyles; scoped tokens via createTokens
---

# Class naming

By default, typestyles emits **readable semantic** class names: `button-base`, `card-elevated`, `button-intent-primary`. You can switch to **hashed** or **hash-only** names for smaller strings, fewer accidental collisions across packages, or closer parity with CSS-in-JS tools that minify class names.

Naming applies to:

- [`styles.class`](/docs/styles)
- [`styles.component`](/docs/components) (single-part components and [multipart `slots`](/docs/components))

It does **not** change [`@typestyles/props`](/docs/atomic-css) utility naming; that package uses its own `createProps` namespace pattern.

## Quick start

**Class names** are configured per **`createStyles()`** instance (not with a global singleton). Create one instance per package, design system, or micro-frontend and import that everywhere in the package:

```ts
import { createStyles } from 'typestyles';

export const styles = createStyles({
  mode: 'hashed',
  prefix: 'ds',
  scopeId: '@acme/design-system',
});
```

Use `styles.component`, `styles.class`, `styles.hashClass`, and `styles.withUtils` from that object. The default `import { styles } from 'typestyles'` is simply `createStyles()` with default options—fine for apps that own the whole page.

**Tokens and themes** use the same idea: **`createTokens({ scopeId })`** so custom properties and theme classes do not collide when multiple bundles share one document:

```ts
import { createTokens } from 'typestyles';

export const tokens = createTokens({ scopeId: '@acme/design-system' });
```

With `scopeId` set, `tokens.create('color', …)` emits variables like `--acme-design-system-color-primary` (sanitized), and `tokens.createTheme('dark', …)` registers a theme class whose segment includes the scope.

For **CSS cascade layers** (`@layer`) — optional, and off by default — see [Cascade layers](/docs/cascade-layers). Use **`createTypeStyles`** when both class rules and token/theme CSS should share one layer stack and one `scopeId`.

## API

### `createStyles(options?)`

Returns a style API with the same methods as the default `styles` export. Options are a partial **`ClassNamingConfig`** merged onto defaults:

| Option    | Type                                                        | Default      | Description                                                                                                                                                |
| --------- | ----------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`    | `'semantic' \| 'hashed' \| 'atomic'`                        | `'semantic'` | How class strings are built (see below).                                                                                                                   |
| `prefix`  | `string`                                                    | `'ts'`       | Leading segment for hashed/atomic output and for `hashClass`.                                                                                              |
| `scopeId` | `string`                                                    | `''`         | Optional id (package name, app name) mixed into the hash input so two packages can reuse the same logical namespace without sharing the same class string. |
| `layers`  | `readonly string[]` or `{ order, prependFrameworkLayers? }` | _(omitted)_  | When set, enables `@layer` output and requires `{ layer }` on each `class` / `hashClass` / `component` call. See [Cascade layers](/docs/cascade-layers).   |

The instance also exposes **`styles.classNaming`**: a read-only snapshot of the resolved config (useful for debugging).

### `mergeClassNaming(partial?)` and `defaultClassNamingConfig`

Use these when you need the resolved config object without creating a full API (for example tests or tooling).

### `scopedTokenNamespace(scopeId, logicalNamespace)`

Returns the CSS custom property namespace segment used for `tokens.create` when `scopeId` is set (sanitized). Advanced / library use.

## Modes

### `semantic` (default)

Human-readable, stable names derived from the namespace and variant segment:

- `styles.class('card', { … })` → `card`
- `styles.component('button', { … })` → `button-base`, `button-intent-primary`, etc.
- Components with `slots` → `{namespace}-{slot}`, `{namespace}-{slot}-{dimension}-{option}`, etc.

### `hashed`

Deterministic names of the form **`{prefix}-{namespace-slug}-{hash}`**. The hash is computed from (when set) `scopeId`, the namespace, a variant segment (e.g. `base`, `intent-primary`, `root-compound-0`), and the serialized style object for that rule. Identical definitions produce identical class strings.

Use this when you want shorter, scoped names while still recognizing the namespace in DevTools.

### `atomic`

**`{prefix}-{hash}`** only—no namespace slug in the string. Same hash inputs as `hashed`, so behavior is equally deterministic.

This mode is a **prototype** for hash-only ergonomics: each component rule is still **one class per chunk of CSS** (the same as today), not one utility class per CSS declaration. True per-property atomic output is a separate roadmap area; for Tailwind-style utilities, use [`@typestyles/props`](/docs/atomic-css).

## `styles.hashClass`

`hashClass` on a given instance uses that instance’s **`prefix`** and **`scopeId`**. If **`scopeId`** is empty, the hash input matches the historical behavior (properties only, plus label handling) for the same style shape.

## Monorepos and `scopeId`

Two packages might both use `styles.component('button', …)`. With **`semantic`** mode, you rely on distinct namespaces or separate bundles. With **`hashed`** / **`atomic`**, give each package its own **`createStyles({ scopeId: '…' })`** so identical style objects in different packages do not map to the same class string.

For tokens, use **`createTokens({ scopeId })`** per package so `--color-*` and `.theme-*` rules do not overwrite each other on `:root` or clash by name.

## SSR

Use the **same** `createStyles` / `createTokens` options (including `scopeId`) on the server and the client so class names, custom property names, and injected CSS match.

## Testing

Use a **dedicated** `createStyles({ … })` per test file or suite when you need hashed/atomic mode. There is no global naming state to reset—only call **`reset()`** (and related sheet helpers) to clear injected CSS between tests. Default **`import { styles } from 'typestyles'`** is still shared across tests, so prefer a local `createStyles()` when asserting on class strings under non-semantic modes.

```ts
import { createStyles, reset } from 'typestyles';

const styles = createStyles({ mode: 'hashed', prefix: 't', scopeId: 'test-a' });

beforeEach(() => {
  reset();
});
```

If you assert on class strings under **`hashed`** or **`atomic`**, prefer stable snapshots or assert on substrings (prefix, absence of semantic segments) rather than hard-coding full hashes unless you fix `scopeId` and styles.

See also [Testing](/docs/testing).

## Related

- [Styles](/docs/styles) — `styles.class`, `compose`, `withUtils`
- [Components](/docs/components) — `styles.component` and `slots`
- [Tokens](/docs/tokens) — `createTokens` and scoped custom properties
- [Atomic CSS Utilities](/docs/atomic-css) — `@typestyles/props` (separate naming scheme)
- [API Reference](/docs/api-reference) — export list
