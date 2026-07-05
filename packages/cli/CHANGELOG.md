# @typestyles/cli

## 0.2.0

### Minor Changes

- [#119](https://github.com/type-styles/typestyles/pull/119) [`10edb85`](https://github.com/type-styles/typestyles/commit/10edb85cf37802090cdc80b8294f0ecd342ba54b) Thanks [@dbanksdesign](https://github.com/dbanksdesign)! - Add `styles.scope()` for proximity-correct nested theme overrides via CSS `@scope` (P5.3).

  Introduce **`@typestyles/cli`**, a new package with the `typestyles` binary and subcommands. The first command is `typestyles snapshot`, which scans semantic `styles.class` / `styles.component` class names and writes `.typestyles-public-classnames.json` for semver guarding. Snapshot logic and heavy deps (`typescript`, `fast-glob`) live in this package so the core `typestyles` runtime stays lean.

  Also ships the opt-in `@typestyles/no-removed-public-classname` ESLint rule (consumes `@typestyles/cli` programmatically).
