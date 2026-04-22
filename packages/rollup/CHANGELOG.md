# @typestyles/rollup

## 0.4.0

### Minor Changes

- [#77](https://github.com/type-styles/typestyles/pull/77) [`28a3f82`](https://github.com/type-styles/typestyles/commit/28a3f8233b473ee7420afb2b23564253f4221f73) Thanks [@dbanksdesign](https://github.com/dbanksdesign)! - **Breaking:** Duplicate logical `styles.component` / `styles.class` namespaces across different modules are now **build errors** (via `this.error`) instead of Rollup warnings, so overlapping registrations fail fast during `vite build` / Rollup.

  The `warnDuplicates` option still defaults to `true`; set `warnDuplicates: false` to skip the check. Namespace extraction now includes `styles.class('…')` calls so they participate in the same cross-module duplicate detection as `styles.component`.

### Patch Changes

- Updated dependencies [[`8bf64b0`](https://github.com/type-styles/typestyles/commit/8bf64b0f3f7da26a4dd91ce4ef5fcca5fea0cb4b)]:
  - @typestyles/build-runner@0.4.0

## 0.3.0

### Minor Changes

- [#49](https://github.com/type-styles/typestyles/pull/49): Add ESLint configuration across all packages, examples, and docs. Create shared `eslint.base.js` config with TypeScript rules and add lint scripts to all package.json files. Update CI workflow to run lint via turbo.

### Patch Changes

- [#50](https://github.com/type-styles/typestyles/pull/50): Add lint-staged for prettier formatting on pre-commit hook and format entire codebase
- [#54](https://github.com/type-styles/typestyles/pull/54): Unify multi-variant styling on `styles.component` with a CVA-style return value: call it for a composed class string (base always applied) or destructure named class strings. Supports dimensioned variants (`variants`, `compoundVariants`, `defaultVariants`), flat variant maps, and slot-based configs.

  Remove `styles.create` from the public `styles` API; use `styles.component` instead.

  Update Vite and Rollup static namespace extraction to match `styles.component(...)` only (no longer scans `styles.create(...)`).

- Updated dependencies [[#49](https://github.com/type-styles/typestyles/pull/49)]
- Updated dependencies [[#50](https://github.com/type-styles/typestyles/pull/50)]
  - @typestyles/build-runner@0.3.0

## 0.2.0

### Minor Changes

- [#25](https://github.com/type-styles/typestyles/pull/25): Updating bundler integrations and adding examples

### Patch Changes

- Updated dependencies [[#25](https://github.com/type-styles/typestyles/pull/25)]
  - @typestyles/build-runner@0.2.0
