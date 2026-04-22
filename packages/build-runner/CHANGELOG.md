# @typestyles/build-runner

## 0.4.0

### Minor Changes

- [#75](https://github.com/type-styles/typestyles/pull/75) [`8bf64b0`](https://github.com/type-styles/typestyles/commit/8bf64b0f3f7da26a4dd91ce4ef5fcca5fea0cb4b) Thanks [@dbanksdesign](https://github.com/dbanksdesign)! - Add shared convention entry discovery: `discoverDefaultExtractModules` and `DEFAULT_EXTRACT_MODULE_CANDIDATES` (including `styles/typestyles-entry.ts` and `styles/typestyles.ts` after the `src/…` paths).

  **@typestyles/vite** re-exports these from `@typestyles/build-runner` and resolves optional `extract.modules` using the same list.

  **@typestyles/next** depends on `@typestyles/build-runner`, aligns `buildTypestylesForNext` with that discovery, defaults `cssOutFile` to `app/typestyles.css` and manifest output unless overridden, adds `withTypestyles` for production config when a convention file exists, and re-exports the discovery helpers.

  `withTypestyles` now passes `root` through to extraction internals so webpack resolution uses the same project root as convention discovery.

  **Breaking (Next):** `BuildTypestylesForNextOptions` no longer requires `modules` or `cssOutFile`; pass them explicitly when you need non-default behavior.

## 0.3.0

### Minor Changes

- [#49](https://github.com/type-styles/typestyles/pull/49): Add ESLint configuration across all packages, examples, and docs. Create shared `eslint.base.js` config with TypeScript rules and add lint scripts to all package.json files. Update CI workflow to run lint via turbo.

### Patch Changes

- [#50](https://github.com/type-styles/typestyles/pull/50): Add lint-staged for prettier formatting on pre-commit hook and format entire codebase

## 0.2.0

### Minor Changes

- [#25](https://github.com/type-styles/typestyles/pull/25): Updating bundler integrations and adding examples
