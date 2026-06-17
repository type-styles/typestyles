---
'typestyles': patch
---

Dev-mode warning for unscoped namespace collisions (P3.5.2): `styles.component()` now emits a `console.warn` when the same namespace is registered more than once without a `scopeId`, helping catch cross-file class name collisions before they reach production.
