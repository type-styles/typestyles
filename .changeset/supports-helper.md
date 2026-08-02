---
'typestyles': minor
---

Add `supports()` and `styles.supports()` helpers for typed `@supports` feature-query keys, mirroring the `container()` pattern. Object forms accept camelCase declaration features (joined with `and`); string forms pass through raw conditions including `not` and `selector()`. Raise main-entry gzip budget (+200 B) for the new helper runtime.
