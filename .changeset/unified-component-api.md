---
'typestyles': minor
'@typestyles/vite': patch
'@typestyles/rollup': patch
---

Unify multi-variant styling on `styles.component` with a CVA-style return value: call it for a composed class string (base always applied) or destructure named class strings. Supports dimensioned variants (`variants`, `compoundVariants`, `defaultVariants`), flat variant maps, and slot-based configs.

Remove `styles.create` from the public `styles` API; use `styles.component` instead.

Update Vite and Rollup static namespace extraction to match `styles.component(...)` only (no longer scans `styles.create(...)`).
