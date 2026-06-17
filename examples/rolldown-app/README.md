# Rolldown example

Vanilla JS app demonstrating **`@typestyles/rollup`** with [Rolldown](https://rolldown.rs/) — Rollup-compatible plugin API.

> Monorepo: `pnpm rolldown-app build` from repo root. [Examples index](../README.md)

## Run

From the monorepo root:

```bash
pnpm rolldown-app build
```

Output: `dist/index.html`, `dist/assets/index.js`, `dist/typestyles.css`.

Preview with `npx serve dist` after build (same layout as the Rollup example).

## What this demonstrates

Rolldown accepts Rollup plugins, so zero-runtime extraction uses the same package as Rollup:

```js
// rolldown.config.mjs
import typestylesRollupPlugin from '@typestyles/rollup';

export default {
  input: 'src/main.js',
  output: { dir: 'dist', format: 'esm' },
  plugins: [typestylesRollupPlugin()],
};
```

Convention entry: `src/typestyles-entry.js`.

## Layout

Same structure as [`examples/rollup-app`](../rollup-app/README.md) — swap `rollup -c` for `rolldown -c`.

## Learn more

- [`@typestyles/rollup` README](../../packages/rollup/README.md)
- [Rollup example](../rollup-app/README.md)
