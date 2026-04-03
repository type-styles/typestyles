---
'typestyles': minor
---

Support nested token objects in `tokens.create` and the same nested shape in `tokens.createTheme`. Nested keys become hyphenated CSS custom properties (for example `color.text.primary` → `--color-text-primary` and `var(--color-text-primary)`).

Export `flattenTokenEntries` and the `FlatTokenEntry` type so consumers can build `--namespace-key` declarations with the same rules as the token APIs.

The design-system example now uses this pattern directly instead of local flatten/ref helpers.
