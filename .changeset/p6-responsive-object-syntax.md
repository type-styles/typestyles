---
'typestyles': minor
---

Add responsive object syntax for breakpoint shorthand in style property values. Register breakpoints once via `createStyles({ breakpoints })` or `createTypeStyles({ breakpoints })`, then use `{ base, md, lg }` on CSS properties — expands to `@media` blocks at serialization time. Supports `_` alias, `breakpoints.fromTokens`, atomic mode, and dev-time validation for unknown breakpoints.
