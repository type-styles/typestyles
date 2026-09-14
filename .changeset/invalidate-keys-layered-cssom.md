---
'typestyles': patch
---

Fix `invalidateKeys` / `invalidatePrefix` so layered theme rules are dropped from the live stylesheet (CSSOM and `#typestyles-fallback`) without deleting sibling themes in the same `@layer`. Nested `@media` / `@supports` groupings are walked the same way, emptied groupings are removed, and concatenated fallback text is pruned by registered CSS.
