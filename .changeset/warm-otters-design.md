---
'typestyles': minor
---

Add `has`, `is`, and `where` helpers for `:has()`, `:is()`, and `:where()` nested keys (also on `styles`). Infer literal `@container …` keys from typed `container()` arguments so bracket notation mixes with longhands without `as CSSProperties`; use `atRuleBlock` when the key is only a generic `string`. Export `ContainerObjectKey` and document the pattern in the docs.
