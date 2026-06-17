# @typestyles/webpack

webpack plugin for `typestyles` build-time CSS extraction.

## Installation

```bash
pnpm add typestyles
pnpm add -D @typestyles/webpack webpack
```

## Usage

Add a convention entry (for example `src/typestyles-entry.ts`) or pass `extract.modules`. When modules resolve, `mode` defaults to `'build'`.

```js
import TypestylesWebpackPlugin from '@typestyles/webpack';

export default {
  entry: './src/index.js',
  plugins: [new TypestylesWebpackPlugin()],
};
```

The plugin emits `typestyles.css` as a compilation asset and applies webpack `DefinePlugin` for `__TYPESTYLES_RUNTIME_DISABLED__`.

## Options

Same shape as `@typestyles/rollup`: `mode`, `extract`, `warnDuplicates`, `root`.
