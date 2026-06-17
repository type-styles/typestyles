# Svelte 5 example

Minimal **Svelte + Vite** app showing typestyles with `class={…}` bindings and variant props.

Uses `@typestyles/vite` for HMR and production CSS extraction.

> Monorepo: `pnpm install` at repo root, then `pnpm svelte-app dev`. [Examples index](../README.md)

## Run

From the monorepo root:

```bash
pnpm svelte-app dev
```

Or from this directory:

```bash
pnpm install
pnpm dev
```

Build and verify:

```bash
pnpm test   # vite build + scripts/verify-build.mjs
```

## What this demonstrates

```svelte
<script lang="ts">
  import { button } from './styles';
  let ghost = $state(false);
</script>

<button class={button({ ghost })} onclick={() => (ghost = !ghost)}>
  …
</button>
```

- Typed variants without a Svelte-specific styling layer
- Scoped Svelte `<style>` for layout chrome; typestyles for component tokens
- Extraction via `src/typestyles-entry.ts`

## Layout

| Path                       | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| `src/styles.ts`            | `button` component styles                       |
| `src/typestyles-entry.ts`  | Extraction side-effect entry                    |
| `vite.config.ts`           | `@sveltejs/vite-plugin-svelte` + `typestyles()` |
| `scripts/verify-build.mjs` | Asserts expected class names in build output    |

Use `pnpm preview` after `pnpm test` to load the production build locally.

## Learn more

- [`@typestyles/vite` README](../../packages/vite/README.md)
- [Vue example](../vue-app/README.md)
