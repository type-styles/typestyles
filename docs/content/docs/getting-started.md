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

Use [`createTypeStyles`](/docs/api-reference#createtypestyles-options) once so `styles` and `tokens` share one **`scopeId`** (namespaced CSS variables and predictable class names). Put the module in a file you import from your UI — the live example below includes the full source and a `className` usage snippet.

<!-- doc-live-demo id="getting-started-button" -->

Toggle **Ghost** in the demo and check the **DOM** and **Emitted CSS** panels (or DevTools on the preview button). Scoped class names are prefixed with your `scopeId`, and token-backed values resolve to custom properties such as `--app-color-primary`.

**What just happened:** definitions register when the module loads; the first time a class is used, TypeStyles injects rules into a managed `<style>` tag. For SSR, streaming, or static CSS in production, see [SSR](/docs/ssr) and [Zero-runtime extraction](/docs/zero-runtime).

For React-specific patterns (refs, merging `className`, server components), see [React integration](/docs/react-integration). Vue and Svelte work the same way — see `examples/vue-app` and `examples/svelte-app` in the repo.

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

**Example projects** in this repo live under `examples/`; from the monorepo root you can run `pnpm vite-app`, `pnpm next-app`, `pnpm vue-app`, `pnpm svelte-app`, `pnpm design-system`, or `pnpm react-design-system`.
