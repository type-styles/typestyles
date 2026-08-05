---
'typestyles': minor
---

Add typed `vars` on `styles.override()` for component-internal CSS custom properties declared with `c.vars()`. Consumers use logical keys (`border`, `padding.outer.x`) with full TypeScript inference via `OverrideConfigFor` and optional `varDefinitions` on `styles.component()`.
