# @typestyles/rollup

## 0.3.0

### Minor Changes

- [#49](https://github.com/dbanksdesign/typestyles/pull/49): Add ESLint configuration across all packages, examples, and docs. Create shared `eslint.base.js` config with TypeScript rules and add lint scripts to all package.json files. Update CI workflow to run lint via turbo.

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
