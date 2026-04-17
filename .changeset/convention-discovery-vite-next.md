---
'@typestyles/build-runner': minor
'@typestyles/vite': minor
'@typestyles/next': minor
---

Add shared convention entry discovery: `discoverDefaultExtractModules` and `DEFAULT_EXTRACT_MODULE_CANDIDATES` (including `styles/typestyles-entry.ts` and `styles/typestyles.ts` after the `src/…` paths).

**@typestyles/vite** re-exports these from `@typestyles/build-runner` and resolves optional `extract.modules` using the same list.

**@typestyles/next** depends on `@typestyles/build-runner`, aligns `buildTypestylesForNext` with that discovery, defaults `cssOutFile` to `app/typestyles.css` and manifest output unless overridden, adds `withTypestyles` for production config when a convention file exists, and re-exports the discovery helpers.

`withTypestyles` now passes `root` through to extraction internals so webpack resolution uses the same project root as convention discovery.

**Breaking (Next):** `BuildTypestylesForNextOptions` no longer requires `modules` or `cssOutFile`; pass them explicitly when you need non-default behavior.
