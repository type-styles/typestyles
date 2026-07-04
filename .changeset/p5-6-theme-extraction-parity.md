---
---

Verify and document build-time theme extraction (P5.6): add integration tests asserting `tokens.create` / `createTheme` CSS is captured by zero-runtime extraction across all six bundler integrations (Vite, Rollup, esbuild, webpack, Next.js, Astro — including new test infrastructure for `@typestyles/astro`), and add a "Theme extraction" section to the zero-runtime docs. Docs and tests only; no published package source changed.
