# Rollup example

Vanilla JS app demonstrating **`@typestyles/rollup`** build-time CSS extraction.

> Monorepo: `pnpm rollup-app build` from repo root. [Examples index](../README.md)

## Run

From the monorepo root:

```bash
pnpm rollup-app build
```

Output: `dist/index.html`, `dist/assets/index.js`, `dist/typestyles.css`.

Preview (any static server):

```bash
pnpm build
npx serve dist
# or: python3 -m http.server 8080 --directory dist
```

## What this demonstrates

```js
// rollup.config.mjs
import typestylesRollupPlugin from '@typestyles/rollup';

export default {
  input: 'src/main.js',
  output: { dir: 'dist', format: 'es' },
  plugins: [nodeResolve(), typestylesRollupPlugin()],
};
```

- Auto-discovers `src/typestyles-entry.js`
- Emits `typestyles.css` during `generateBundle`
- Links stylesheet from `index.html`

## Layout

| Path                      | Purpose                        |
| ------------------------- | ------------------------------ |
| `src/main.js`             | App entry                      |
| `src/styles.js`           | Style registrations            |
| `src/typestyles-entry.js` | Extraction side-effect imports |
| `rollup.config.mjs`       | Rollup + typestyles plugin     |

## Learn more

- [`@typestyles/rollup` README](../../packages/rollup/README.md)
- [Rolldown example](../rolldown-app/README.md) — same plugin API
