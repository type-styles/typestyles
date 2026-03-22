---
'@typestyles/build': minor
'@typestyles/vite': patch
'@typestyles/next': minor
---

Add `@typestyles/build` with `extractCss`, `writeExtractedCss`, optional `manifestOutFile` / `manifestCssPath` for a small JSON manifest, and the `typestyles-build` CLI for standalone CSS extraction (wraps `@typestyles/build-runner`).

`@typestyles/next/build`: `buildTypestylesForNext`, `withTypestylesExtract` (webpack `DefinePlugin` for `__TYPESTYLES_RUNTIME_DISABLED__` on the client), and re-exports from `@typestyles/build`.

Vite plugin: in `mode: "build"`, disable runtime style injection during dev (same as production), serve extracted CSS from the dev server, and inject a `<link rel="stylesheet">` via `transformIndexHtml` so `index.html` does not reference a missing public file.
