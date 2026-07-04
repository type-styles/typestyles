---
'typestyles': minor
'@typestyles/eslint-plugin': minor
---

Formalize the component-override public contract (P5.3). `semantic`-mode class names from `styles.component()` / `styles.class()` are now documented as a stable, semver-guarded surface consumers may target with plain CSS. New `styles.scope({ root, to?, layer? }, className, overrides)` emits CSS `@scope` rules (reusing the existing serializer, layer wrapping, and sheet registration) so nested theme regions resolve overrides by DOM proximity instead of insertion order. New opt-in `@typestyles/no-removed-public-classname` ESLint rule diffs emitted class names against a committed `.typestyles-public-classnames.json` snapshot and flags removals/renames as breaking changes.
