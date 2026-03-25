---
'@typestyles/astro': minor
---

Add **`@typestyles/astro`**, an Astro integration that registers the existing `@typestyles/vite` plugin for dev HMR and optional build-time CSS extraction (`mode` / `extract` options re-exported from the Vite plugin).

Dogfood the integration on the docs site: Astro config, client entry for dev HMR, refreshed layout and docs components (code blocks, alerts, theme toggle, mobile sidebar), markdown code highlighting helpers, and shared design-system patterns in examples (`@examples/design-system`, React adapters). **Workspace-only** packages (`typestyles-docs`, examples) are unchanged on npm; root `package.json` / `turbo.json` updates are monorepo tooling only.
