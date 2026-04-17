---
'@typestyles/vite': minor
'@typestyles/rollup': minor
---

**Breaking:** Duplicate logical `styles.component` / `styles.class` namespaces across different modules are now **build errors** (via `this.error`) instead of Rollup warnings, so overlapping registrations fail fast during `vite build` / Rollup.

The `warnDuplicates` option still defaults to `true`; set `warnDuplicates: false` to skip the check. Namespace extraction now includes `styles.class('…')` calls so they participate in the same cross-module duplicate detection as `styles.component`.
