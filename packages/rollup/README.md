# @typestyles/rollup

Rollup and Rolldown plugin for `typestyles`.

Supports:

- Runtime mode (default when no extraction modules resolve): normal typestyles runtime behavior.
- Build mode: emit static CSS and disable runtime style insertion in bundle.
- Hybrid mode: emit static CSS for production while keeping runtime-friendly behavior in development.

## Installation

```bash
pnpm add typestyles
pnpm add -D @typestyles/rollup rollup
```

## Rollup usage

Add a convention entry file that imports every registration side effect (for example `src/typestyles-entry.ts`), **or** pass `extract.modules` explicitly. When at least one module resolves, **`mode` defaults to `'build'`**.

```js
// rollup.config.mjs
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typestylesRollupPlugin from '@typestyles/rollup';

export default {
  input: 'src/main.js',
  output: {
    dir: 'dist',
    format: 'es',
  },
  plugins: [
    nodeResolve(),
    typestylesRollupPlugin(), // discovers src/typestyles-entry.ts (etc.)
  ],
};
```

Then link the emitted CSS in your HTML:

```html
<link rel="stylesheet" href="/typestyles.css" />
```

## Rolldown usage

Rolldown supports Rollup-compatible plugins, so you can use the same plugin:

```js
// rolldown.config.mjs
import typestylesRollupPlugin from '@typestyles/rollup';

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  plugins: [typestylesRollupPlugin()],
};
```

## Options

- `mode?: 'runtime' | 'build' | 'hybrid'`
  - Default: `'build'` when a convention entry or `extract.modules` resolves; otherwise `'runtime'`
- `extract?: { modules?: string[]; fileName?: string }`
  - Omitted: discover a convention entry under `root` (see `DEFAULT_EXTRACT_MODULE_CANDIDATES`)
- `warnDuplicates?: boolean`
  - Default: `true`
- `root?: string`
  - Project root for convention discovery and module resolution
  - Default: `process.cwd()`
