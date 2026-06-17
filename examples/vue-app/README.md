# Vue 3 example

Minimal **Vue + Vite** app showing typestyles with ordinary `class` bindings and variant props.

Uses `@typestyles/vite` for HMR and production CSS extraction (convention entry at `src/typestyles-entry.ts`).

> Monorepo: `pnpm install` at repo root, then `pnpm vue-app dev`. [Examples index](../README.md)

## Run

From the monorepo root:

```bash
pnpm vue-app dev
```

Or from this directory:

```bash
pnpm install
pnpm dev
```

Build and verify extraction:

```bash
pnpm test   # vite build + scripts/verify-build.mjs
```

## What this demonstrates

```vue
<script setup lang="ts">
import { button } from './styles';
</script>

<template>
  <button :class="button({ ghost })">…</button>
</template>
```

- `styles.component` with boolean variants in `src/styles.ts`
- No Vue-specific adapter — typestyles returns class name strings
- Same dev/prod split as the React Vite example (runtime + HMR in dev, extracted CSS on build)

## Layout

| Path                       | Purpose                                   |
| -------------------------- | ----------------------------------------- |
| `src/styles.ts`            | `button` component styles                 |
| `src/typestyles-entry.ts`  | Side-effect entry for extraction          |
| `vite.config.ts`           | `@vitejs/plugin-vue` + `typestyles()`     |
| `scripts/verify-build.mjs` | Asserts `vue-button` in CSS and JS bundle |

After `pnpm test`, open `dist/index.html` with a static server or `pnpm preview` to inspect output manually.

## Learn more

- [`@typestyles/vite` README](../../packages/vite/README.md)
- [Svelte example](../svelte-app/README.md) — same pattern, different framework
