# @typestyles/astro

## 0.3.0

### Minor Changes

- aecc3ce: Add **`@typestyles/astro`**, an Astro integration that registers the existing `@typestyles/vite` plugin for dev HMR and optional build-time CSS extraction (`mode` / `extract` options re-exported from the Vite plugin).

  Dogfood the integration on the docs site: Astro config, client entry for dev HMR, refreshed layout and docs components (code blocks, alerts, theme toggle, mobile sidebar), markdown code highlighting helpers, and shared design-system patterns in examples (`@examples/design-system`, React adapters). **Workspace-only** packages (`typestyles-docs`, examples) are unchanged on npm; root `package.json` / `turbo.json` updates are monorepo tooling only.

- d9c8078: Add ESLint configuration across all packages, examples, and docs. Create shared `eslint.base.js` config with TypeScript rules and add lint scripts to all package.json files. Update CI workflow to run lint via turbo.

### Patch Changes

- f65c570: Add lint-staged for prettier formatting on pre-commit hook and format entire codebase
- Updated dependencies [d9c8078]
- Updated dependencies [f65c570]
- Updated dependencies [eee07e5]
- Updated dependencies [b43e2f3]
  - @typestyles/vite@0.3.0
