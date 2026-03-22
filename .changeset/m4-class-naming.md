---
'typestyles': minor
---

Add configurable class naming modes for gradual adoption across packages:

- `configureClassNaming({ mode, prefix?, scopeId? })` with modes `semantic` (default), `hashed`, and `atomic`.
- Applies to `styles.create`, `styles.class`, `styles.component` (including slot recipes), and affects `prefix` / optional `scopeId` mixing for `styles.hashClass`.
- Export `getClassNamingConfig` and `resetClassNaming` (for tests).

Documentation:

- New site page `docs/content/docs/class-naming.md` (sidebar: Class naming) describing modes, `scopeId`, SSR, and testing.
- Cross-links from Getting Started, Styles, Recipes, Atomic CSS utilities, API Reference, and Testing.
