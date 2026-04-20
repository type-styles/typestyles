# @typestyles/vite

## 0.3.0

### Minor Changes

- [#49](https://github.com/dbanksdesign/typestyles/pull/49): Add ESLint configuration across all packages, examples, and docs. Create shared `eslint.base.js` config with TypeScript rules and add lint scripts to all package.json files. Update CI workflow to run lint via turbo.
- [#60](https://github.com/dbanksdesign/typestyles/pull/60): **@typestyles/vite:** When `extract.modules` is set and `mode` is omitted, default `mode` is now `'build'`: `vite dev` keeps runtime injection and HMR; `vite build` emits the CSS asset and disables client injection (same as explicit `mode: 'build'`). Pass `mode: 'runtime'` to keep the previous “extract config present but runtime-only” behavior. Vitest: plugin tests extended; runtime/build parity moved to `build-parity.test.ts` with `skipIf` when `build-runner` dist is missing.

  **@typestyles/next:** README documents applying `withTypestylesExtract` only in production so development keeps client runtime injection.

  Docs (`vite-plugin`, `zero-runtime`, `getting-started`) and `roadmap.md` describe dev-runtime / prod-extraction; `examples/vite-app`, `examples/typewind`, and `examples/next-app` (`next.config.mjs`) follow the recommended wiring.

### Patch Changes

- [#50](https://github.com/dbanksdesign/typestyles/pull/50): Add lint-staged for prettier formatting on pre-commit hook and format entire codebase
- [#54](https://github.com/dbanksdesign/typestyles/pull/54): Unify multi-variant styling on `styles.component` with a CVA-style return value: call it for a composed class string (base always applied) or destructure named class strings. Supports dimensioned variants (`variants`, `compoundVariants`, `defaultVariants`), flat variant maps, and slot-based configs.

  Remove `styles.create` from the public `styles` API; use `styles.component` instead.

  Update Vite and Rollup static namespace extraction to match `styles.component(...)` only (no longer scans `styles.create(...)`).

- Updated dependencies [[#49](https://github.com/dbanksdesign/typestyles/pull/49)]
- Updated dependencies [[#50](https://github.com/dbanksdesign/typestyles/pull/50)]
  - @typestyles/build-runner@0.3.0

## 0.2.0

### Minor Changes

- [#25](https://github.com/dbanksdesign/typestyles/pull/25): Updating bundler integrations and adding examples

### Patch Changes

- Updated dependencies [[#25](https://github.com/dbanksdesign/typestyles/pull/25)]
  - @typestyles/build-runner@0.2.0

## 0.1.1

### Patch Changes

- [#15](https://github.com/dbanksdesign/typestyles/pull/15): Add additional test coverage for vite plugin

## 0.1.0

### Minor Changes

- [#4](https://github.com/dbanksdesign/typestyles/pull/4): Add `styles.component()` API for multi-variant component styles with support for base styles, variant dimensions, compound variants, and default variants. Add `global.style()` and `global.fontFace()` APIs for applying styles to arbitrary CSS selectors and declaring `@font-face` rules. Update the Vite plugin to support HMR for the new APIs.

## 0.0.2

### Patch Changes

- [#1](https://github.com/dbanksdesign/typestyles/pull/1): Initial release of typestyles - CSS-in-TypeScript that embraces CSS instead of hiding from it.

  Features:
  - Core typestyles library with type-safe CSS styling
  - Server-side rendering support
  - Vite plugin for HMR support
