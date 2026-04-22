---
title: Getting Started
description: Install TypeStyles and ship your first typed component styles in a few minutes
---

TypeStyles is **CSS in TypeScript**: you write style objects (including selectors, media queries, and pseudos), get **typed variants** and **design tokens backed by CSS custom properties**, and apply ordinary `className` strings in React, Vue, Svelte, or plain HTML.

**In one sentence:** define styles once in TS, reuse tokens in TS or plain CSS, and let TypeStyles register readable class names and inject CSS when those styles are first used—no compiler required to get started.

---

## What you get

- **Readable class names** — Names in your source map to names in DevTools (for example `button-base`, `button-intent-primary`), not opaque hashes.
- **Tokens as real CSS variables** — `tokens.create` emits scoped `--{scopeId}-{namespace}-*` values (when you use [`createTypeStyles`](/docs/api-reference#createtypestyles-options)) so they stay distinct across micro-frontends and libraries.
- **Variants without a separate library** — `styles.component` covers CVA-style dimensions, defaults, and compound variants in one API.
- **Incremental adoption** — Add one component at a time beside existing CSS; optional [`cx()`](/docs/compose) merges TypeStyles classes with external strings.
- **Optional zero-runtime** — Ship a static CSS file in production when you enable a bundler plugin; see [Zero-runtime extraction](/docs/zero-runtime).

If you are comparing tools, read the [framework comparison](/docs/framework-comparison) page next, then [Migration](/docs/migration) for API mapping from Panda, CVA, StyleX, or Emotion.

---

## Requirements

- **TypeScript** in the project you style (types are part of the value).
- **A bundler or runtime** that resolves `node_modules` (Vite, webpack, Next.js, esbuild, and others work; no TypeStyles-specific loader is required for the default path).

---

## Installation

Install the `typestyles` package:

```bash
pnpm add typestyles
```

```bash
npm install typestyles
```

```bash
yarn add typestyles
```

**Optional — Vite:** for dev HMR and build-time CSS extraction, add [`@typestyles/vite`](/docs/vite-plugin). Rollup, Rolldown, and Next.js are covered in [Zero-runtime extraction](/docs/zero-runtime) (see [Rollup / Rolldown](/docs/zero-runtime#rollup-rolldown) and [Next.js](/docs/zero-runtime#next-js)).

---

## Your first styles (four steps)

Use **one instanced API** from [`createTypeStyles`](/docs/api-reference#createtypestyles-options) so `styles` and `tokens` share the same `scopeId`. That avoids collisions with other bundles on the page and matches what design-system packages do.

### 1. Create the instance

Add a small module you import everywhere in your app (adjust the path to match your layout):

```ts
// typestyles.ts
import { createTypeStyles } from 'typestyles';

/** Pick a stable id: your app name, package name, or `@scope/package`. */
export const { styles, tokens } = createTypeStyles({
  scopeId: 'app',
});
```

### 2. Create tokens

Tokens become custom properties on `:root` with your scope baked into the name (for example `--app-color-primary` when `scopeId` is `'app'`):

```ts
// tokens.ts
import { tokens } from './typestyles';

export const color = tokens.create('color', {
  primary: '#0066ff',
  surface: '#ffffff',
  text: '#111827',
});
```

You reference them as typed values such as `color.primary` (that expands to `var(--app-color-primary)` in output CSS for the instance above).

### 3. Define a component style

Use `styles.component` with a **namespace** (used in class names) and a **config** (`base`, optional `variants`, `defaultVariants`):

```ts
// button.styles.ts
import { styles } from './typestyles';
import { color } from './tokens';

export const button = styles.component('button', {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    color: color.surface,
    backgroundColor: color.primary,
  },
  variants: {
    intent: {
      primary: { backgroundColor: color.primary, color: color.surface },
      ghost: {
        backgroundColor: 'transparent',
        color: color.primary,
        border: `1px solid ${color.primary}`,
      },
    },
  },
  defaultVariants: { intent: 'primary' },
});
```

### 4. Apply classes in UI

Call the style function with the variant props you need. The return value is a single `className` string (base styles are always included unless you opt into lower-level composition):

```tsx
// Button.tsx
import type { ReactNode } from 'react';
import { button } from './button.styles';

export function Button({
  intent,
  children,
}: {
  intent?: 'primary' | 'ghost';
  children: ReactNode;
}) {
  return (
    <button type="button" className={button({ intent })}>
      {children}
    </button>
  );
}
```

**Check DevTools:** you should see classes like `button-base` and `button-intent-primary` on the element, and token-backed values resolving to your scoped custom properties (for example `--app-color-primary`).

For more React patterns (forwarded refs, `className` merging, server components), see [React integration](/docs/react-integration).

---

## How it runs (mental model)

1. **Registration** — When your module loads, definitions are registered. Nothing paints until a class is actually used.
2. **First use** — The first time a returned class name is applied, TypeStyles injects the rules into a managed `<style>` tag (lazy injection, batched for performance).
3. **Stable names** — Class strings are deterministic from your namespace and variant keys, which keeps SSR and tests predictable when [collection APIs](/docs/ssr) wrap your render.
4. **Production** — You can keep this model, or switch to extracted CSS and a no-op runtime via the [zero-runtime](/docs/zero-runtime) path when you are ready.

---

## Flat variants (simple toggles)

When you only need boolean-style layers on top of `base`, you can use a **flat** config (no `variants` object). Use the same `styles` from your instance module:

```ts
import { styles } from './typestyles';

const card = styles.component('card', {
  base: { padding: '16px', borderRadius: '8px' },
  elevated: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
});

card(); // base only
card({ elevated: true }); // base + elevated

const { base, elevated } = card;
```

---

## Default singleton (optional)

`import { styles, tokens } from 'typestyles'` is the same as calling `createStyles()` and `createTokens()` with **no** `scopeId`. That is fine for throwaway demos, but **prefer `createTypeStyles({ scopeId })`** in real apps and libraries so tokens and themes stay namespaced. Add [`global`](/docs/api-reference#createtypestyles-options) from the same constructor when you register [cascade layers](/docs/cascade-layers) or shared `@layer` stacks.

---

## Which API should I use?

| You want to…                                                            | Use                                     | Why                                                                                         |
| ----------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Style a component with base + flat toggles (`elevated`, `compact`)      | `styles.component` (flat config)        | Small surface area; base applies automatically when you call the function.                  |
| Build typed variant axes (`intent`, `size`) with defaults and compounds | `styles.component` (dimensioned config) | First-class variant model: `variants`, `compoundVariants`, `defaultVariants`.               |
| One reusable class from a single style object                           | `styles.class`                          | One class string, no variant machinery.                                                     |
| Merge several style groups                                              | `styles.compose`                        | Reuse groups without repeating objects.                                                     |
| Join class names conditionally                                          | `cx()` from `'typestyles'`              | Filters falsy values; pairs well with props from parents (not tied to a `styles` instance). |

**Practical default:** one `createTypeStyles` module per app or package; then use `styles.component` for UI components, `styles.class` for one-off utilities, and `import { cx } from 'typestyles'` when you merge external `className` strings.

---

## Next steps

| Topic                                            | What you will learn                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| [Styles](/docs/styles)                           | `styles.class`, composition, utilities, and naming modes.                      |
| [Components](/docs/components)                   | Variants, compounds, and component recipes in depth.                           |
| [Tokens](/docs/tokens)                           | Namespaces, themes, and `tokens.use` for shared token modules.                 |
| [Design system with tokens](/docs/design-system) | Layering primitives → semantics → components.                                  |
| [SSR](/docs/ssr)                                 | `collectStyles` and framework-specific notes for HTML that matches the client. |
| [Zero-runtime extraction](/docs/zero-runtime)    | Static CSS in production and bundler setup.                                    |
| [Class naming](/docs/class-naming)               | Semantic vs hashed output for `styles.component`.                              |

**Example projects** in this repo live under `examples/`; from the monorepo root you can run `pnpm vite-app`, `pnpm next-app`, `pnpm design-system`, or `pnpm react-design-system`.

---

## Token-only snippet

If you already export `{ styles, tokens }` from `./typestyles` and only need a token namespace:

```ts
import { tokens } from './typestyles';

const space = tokens.create('space', {
  sm: '8px',
  md: '16px',
});

// With scopeId 'app': padding: space.md  →  var(--app-space-md)
```

You keep full control of the emitted CSS; TypeStyles wires names, variables, and injection (or extraction) around your definitions.
