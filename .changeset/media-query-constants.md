---
'typestyles': minor
---

Add `mediaQueries` constant export with ready-to-use `@media (...)` strings for `prefers-reduced-motion`, `prefers-contrast`, and hover/pointer capability queries (`hover`, `any-hover`, `pointer`, `any-pointer`), grouped by feature. Drop a leaf value (e.g. `mediaQueries.prefersReducedMotion.reduce`) directly into a `styles.class`, `styles.override`, or `styles.component` (nested inside `base` or a variant's style) object as a key.
