---
title: Getting Started
description: Install TypeStyles and ship your first typed component styles in a few minutes
---

TypeStyles is **CSS in TypeScript**: style objects (selectors, media queries, pseudos), **typed variants**, **tokens as CSS variables**, and ordinary `className` strings in React, Vue, Svelte, or HTML. No compiler is required for the default runtime path.

You need **TypeScript** and a bundler or runtime that resolves `node_modules` (Vite, webpack, Next.js, and others work; no TypeStyles-specific loader for the default path).

## Installation

<!-- doc-install-tabs -->

```bash
pnpm add typestyles
```

```bash
npm install typestyles
```

```bash
yarn add typestyles
```

<!-- /doc-install-tabs -->

**Optional — Vite:** for dev HMR and build-time CSS extraction, add [`@typestyles/vite`](/docs/vite-plugin). Other bundlers: [Zero-runtime extraction](/docs/zero-runtime).

## Your first styles

Use [`createTypeStyles`](/docs/api-reference#createtypestyles-options) once so `styles` and `tokens` share one **`scopeId`** (namespaced CSS variables and predictable class names). Put this in a module you import from your UI:

```ts
// app/typestyles.ts
import { createTypeStyles } from 'typestyles';

export const { styles, tokens } = createTypeStyles({
  scopeId: 'app',
});

export const color = tokens.create('color', {
  primary: '#0066ff',
  surface: '#ffffff',
});

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

Call the style function wherever you set `className`. The return value is one string (base styles are included automatically):

```tsx
<button type="button" className={button({ intent: 'ghost' })}>
  Cancel
</button>
```

In DevTools you should see classes like `button-base` and `button-intent-ghost`, with token-backed values resolving to scoped custom properties (for example `--app-color-primary`).

**What just happened:** definitions register when the module loads; the first time a class is used, TypeStyles injects rules into a managed `<style>` tag. For SSR, streaming, or static CSS in production, see [SSR](/docs/ssr) and [Zero-runtime extraction](/docs/zero-runtime).

For React-specific patterns (refs, merging `className`, server components), see [React integration](/docs/react-integration).

## Next steps

| Topic                                              | What you will learn                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Styles](/docs/styles)                             | Flat vs dimensioned `styles.component`, `styles.class`, composition, mental model |
| [Components](/docs/components)                     | Variants, compounds, multipart `slots`                                            |
| [Tokens](/docs/tokens)                             | Namespaces, themes, `tokens.use`                                                  |
| [Framework comparison](/docs/framework-comparison) | How TypeStyles compares to other tools                                            |
| [Migration](/docs/migration)                       | Mapping from Panda, CVA, StyleX, Emotion                                          |
| [Design system with tokens](/docs/design-system)   | Primitives → semantics → components                                               |
| [Class naming](/docs/class-naming)                 | Semantic vs hashed output                                                         |

**Example projects** in this repo live under `examples/`; from the monorepo root you can run `pnpm vite-app`, `pnpm next-app`, `pnpm design-system`, or `pnpm react-design-system`.
