# Parcel example

Vanilla JS app showing typestyles on the **runtime path** with Parcel — no typestyles bundler plugin required.

TypeStyles works with any bundler that resolves `node_modules`. This example proves the default runtime injection path without `@typestyles/vite` or extraction.

> Monorepo: `pnpm parcel-app dev` or `pnpm parcel-app test`. [Examples index](../README.md)

## Run

From the monorepo root:

```bash
pnpm parcel-app dev
```

Or build + verify:

```bash
pnpm parcel-app test
```

## What this demonstrates

```js
import { heading } from './styles.js';

app.innerHTML = `<h1 class="${heading()}">typestyles + Parcel (runtime)</h1>`;
```

- `styles.component` registers CSS on module load
- Browser bundle includes the typestyles runtime (~15 KB gzip)
- CSS injects via a managed `<style>` element on first use
- `scripts/verify-build.mjs` confirms the bundle contains expected class helpers

## When to use extraction instead

For production SPAs where you want a cacheable `.css` file and zero runtime overhead, add `@typestyles/vite` (Parcel 2 can use Vite plugins in some setups) or pre-build with `@typestyles/build-runner`. See [zero-runtime docs](https://typestyles.dev/docs/zero-runtime).

## Layout

| Path            | Purpose                   |
| --------------- | ------------------------- |
| `src/main.js`   | Renders demo heading      |
| `src/styles.js` | `heading` component style |
| `index.html`    | Parcel entry              |

## Learn more

- [Getting started](https://typestyles.dev/docs/getting-started) — runtime path needs no plugin
- [Vite example](../vite-app/README.md) — HMR + extraction
