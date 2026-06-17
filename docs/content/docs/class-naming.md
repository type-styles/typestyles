---
title: Class naming
description: Per-instance semantic, hashed, or atomic class names via createStyles; scoped tokens via createTokens
---

By default, typestyles emits **readable semantic** class names: `button-base`, `card-elevated`, `button-intent-primary`. You can switch to **hashed**, **compact** (hash-only whole-object), or **atomic** (one class per declaration) names for smaller strings, deduped CSS, or closer parity with CSS-in-JS tools that minify class names.

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

Use `styles.component`, `styles.class`, and `styles.hashClass` from that object. For [utility shortcuts](/docs/styles#utility-shortcuts), pass **`utils`** into `createStyles` (or call `styles.withUtils(…)` on the default export). The default `import { styles } from 'typestyles'` is simply `createStyles()` with default options—fine for apps that own the whole page.

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

| Option    | Type                                                        | Default      | Description                                                                                                                                                                                                                                                                |
| --------- | ----------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`    | `'semantic' \| 'hashed' \| 'compact' \| 'atomic'`           | `'semantic'` | How class strings are built (see below).                                                                                                                                                                                                                                   |
| `prefix`  | `string`                                                    | `'ts'`       | Leading segment for hashed/compact/atomic output and for `hashClass`.                                                                                                                                                                                                      |
| `scopeId` | `string`                                                    | `''`         | Optional id (package name, app name) so two packages can reuse the same logical namespace without sharing the same class string. In `semantic` mode the sanitized scope is prefixed onto class names; in `hashed`/`compact`/`atomic` mode it is mixed into the hash input. |
| `layers`  | `readonly string[]` or `{ order, prependFrameworkLayers? }` | _(omitted)_  | When set, enables `@layer` output and requires `{ layer }` on each `class` / `hashClass` / `component` call. See [Cascade layers](/docs/cascade-layers).                                                                                                                   |

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

With **`scopeId`** set, the sanitized scope is prefixed onto every class name — the same way `tokens.create` scopes custom property names:

- `createStyles({ scopeId: 'my-ui' })` + `styles.component('button', { … })` → `my-ui-button-base`
- `createStyles({ scopeId: '@acme/ds' })` + `styles.class('card', { … })` → `acme-ds-card`

This keeps semantic names readable while making isolation real: two packages can both register `styles.component('button', …)` without their CSS rules overwriting each other. In development, typestyles also logs an error if two different definitions ever emit the same class string (cross-scope collisions, or hash collisions in `hashed`/`compact` mode).

### `hashed`

Deterministic names of the form **`{prefix}-{namespace-slug}-{hash}`**. The hash is computed from (when set) `scopeId`, the namespace, a variant segment (e.g. `base`, `intent-primary`, `root-compound-0`), and the serialized style object for that rule. Identical definitions produce identical class strings.

Use this when you want shorter, scoped names while still recognizing the namespace in DevTools.

### `compact`

**`{prefix}-{hash}`** only—no namespace slug in the string. Same hash inputs as `hashed`, so behavior is equally deterministic. Each component rule is still **one class per style chunk** (base, variant option, compound rule, etc.).

Use this when you want the shortest hash-only class strings without per-declaration splitting.

### `atomic`

**One class per CSS declaration.** Identical property values share a class across the codebase—CSS size plateaus as you add components instead of growing linearly with every rule chunk.

- `styles.class('card', { padding: '1rem', color: 'red' })` → two classes joined with a space
- `styles.component('button', { base: { color: 'red', padding: '8px' } })` → `button.base` is a space-separated list of atomic classes
- Nested selectors (`&:hover`, attribute selectors) and `@media` blocks decompose the same way; each inner declaration gets its own class

Hash inputs include (when set) `scopeId`, the declaration path (property + nested context), and the value. For Tailwind-style **utility prop APIs**, see [`@typestyles/props`](/docs/atomic-css).

#### Migrating from the old `atomic` name

Before P2.10, `atomic` meant hash-only **whole-object** classes (no namespace slug). That mode is now **`compact`**. If you were using `mode: 'atomic'` for short hash-only class strings, switch to **`mode: 'compact'`**. Use **`mode: 'atomic'`** when you want true per-declaration output and dedup.

## `styles.hashClass`

`hashClass` on a given instance uses that instance’s **`prefix`** and **`scopeId`**. If **`scopeId`** is empty, the hash input matches the historical behavior (properties only, plus label handling) for the same style shape.

## Monorepos and `scopeId`

Two packages might both use `styles.component('button', …)`. Give each package its own **`createStyles({ scopeId: '…' })`**: in **`semantic`** mode the scope is prefixed onto the class name (`pkg-a-button-base` vs `pkg-b-button-base`); in **`hashed`**, **`compact`**, or **`atomic`** mode the scope is mixed into the hash so identical style objects in different packages do not map to the same class string.

For tokens, use **`createTokens({ scopeId })`** per package so `--color-*` and `.theme-*` rules do not overwrite each other on `:root` or clash by name.

## SSR

Use the **same** `createStyles` / `createTokens` options (including `scopeId`) on the server and the client so class names, custom property names, and injected CSS match.

## Testing

Use a **dedicated** `createStyles({ … })` per test file or suite when you need hashed, compact, or atomic mode. There is no global naming state to reset—only call **`reset()`** (and related sheet helpers) to clear injected CSS between tests. Default **`import { styles } from 'typestyles'`** is still shared across tests, so prefer a local `createStyles()` when asserting on class strings under non-semantic modes.

```ts
import { createStyles, reset } from 'typestyles';

const styles = createStyles({ mode: 'hashed', prefix: 't', scopeId: 'test-a' });

beforeEach(() => {
  reset();
});
```

If you assert on class strings under **`hashed`**, **`compact`**, or **`atomic`**, prefer stable snapshots or assert on substrings (prefix, absence of semantic segments) rather than hard-coding full hashes unless you fix `scopeId` and styles.

See also [Testing](/docs/testing).

## Related

- [Styles](/docs/styles) — `styles.class`, `compose`, `withUtils`
- [Components](/docs/components) — `styles.component` and `slots`
- [Tokens](/docs/tokens) — `createTokens` and scoped custom properties
- [Atomic CSS Utilities](/docs/atomic-css) — `@typestyles/props` (separate naming scheme)
- [API Reference](/docs/api-reference) — export list
