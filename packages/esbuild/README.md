# @typestyles/esbuild

esbuild plugin for `typestyles` build-time CSS extraction.

## Installation

```bash
pnpm add typestyles
pnpm add -D @typestyles/esbuild esbuild
```

## Usage

Add a convention entry (for example `src/typestyles-entry.ts`) or pass `extract.modules`. When modules resolve, `mode` defaults to `'build'`.

```js
import { build } from 'esbuild';
import typestylesEsbuildPlugin from '@typestyles/esbuild';

await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  plugins: [typestylesEsbuildPlugin()],
});
```

The plugin writes `typestyles.css` to esbuild’s `outdir` and defines `__TYPESTYLES_RUNTIME_DISABLED__` when extracting.

## Options

Same shape as `@typestyles/rollup`: `mode`, `extract`, `warnDuplicates`, `root`.
