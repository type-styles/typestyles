# esbuild example

Vanilla JS app demonstrating **`@typestyles/esbuild`** build-time CSS extraction without Vite or Rollup.

> Monorepo: `pnpm esbuild-app test` from repo root. [Examples index](../README.md)

## Run

From the monorepo root:

```bash
pnpm esbuild-app build
```

Or with verification:

```bash
pnpm esbuild-app test
```

Output lands in `dist/` (`index.html`, `index.js`, `typestyles.css`). Open `dist/index.html` via a static server after build.

## What this demonstrates

```js
// build.mjs
import typestylesEsbuildPlugin from '@typestyles/esbuild';

await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'dist/index.js',
  plugins: [typestylesEsbuildPlugin()],
});
```

- Convention entry discovery (`src/typestyles-entry.js`)
- Static CSS asset + `__TYPESTYLES_RUNTIME_DISABLED__` in the JS bundle
- Plain browser DOM — no framework

## Layout

| Path                       | Purpose                               |
| -------------------------- | ------------------------------------- |
| `src/main.js`              | Renders heading with typestyles class |
| `src/styles.js`            | Style registrations                   |
| `src/typestyles-entry.js`  | Extraction entry                      |
| `build.mjs`                | esbuild config with plugin            |
| `scripts/verify-build.mjs` | Checks CSS + bundle expectations      |

## Learn more

- [`@typestyles/esbuild` README](../../packages/esbuild/README.md)
- [Rollup example](../rollup-app/README.md) — same extraction model, different bundler
