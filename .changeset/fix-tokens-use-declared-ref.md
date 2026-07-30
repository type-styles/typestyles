---
'typestyles': patch
---

Fix `tokens.use()` when passed a `tokens.declare()` handle — rebuild proxies from declared schema paths instead of resolving an empty namespace. Raise main-entry gzip budget (+200 B) for syntax-typed token runtime.
