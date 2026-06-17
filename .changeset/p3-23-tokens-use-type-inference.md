---
'typestyles': patch
---

`tokens.use()` now infers token shapes from a `tokens.create()` return value (P3.23). Pass the created ref for cross-package typing, or declare a `TokenRegistry` on `createTokens()` for string-based lookups.
