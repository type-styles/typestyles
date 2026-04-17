# @typestyles/migrate

## 0.3.0

### Minor Changes

- d9c8078: Add ESLint configuration across all packages, examples, and docs. Create shared `eslint.base.js` config with TypeScript rules and add lint scripts to all package.json files. Update CI workflow to run lint via turbo.

### Patch Changes

- ca46784: Add comprehensive test coverage for previously untested modules: props utils/generate/runtime, typestyles build, and migrate transform/css/files.
- f65c570: Add lint-staged for prettier formatting on pre-commit hook and format entire codebase

## 0.2.0

### Minor Changes

- c840058: Add a new `@typestyles/migrate` CLI package for safely migrating static styled-components and Emotion patterns to typestyles with dry-run output, optional `--write`, and JSON reporting.
