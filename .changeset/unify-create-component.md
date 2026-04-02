---
'typestyles': minor
'@typestyles/vite': minor
'@typestyles/rollup': minor
---

Unify styles.create and styles.component into a single API

- Remove `styles.create` in favor of `styles.component` as the sole variant API
- Base class now uses the namespace directly (e.g., "button") instead of "button-base"
- Compound variants use a flat format: `{ intent: 'primary', size: 'lg', css: { ... } }`
- `styles.class` and `styles.hashClass` remain unchanged
- Update `styles.withUtils` to provide `component` instead of `create`
