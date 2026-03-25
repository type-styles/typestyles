---
---

Introduce a framework-agnostic design system example (`@examples/design-system`) with shared tokens, layout/text recipes, component class recipes (buttons, form controls, dialogs, tabs, etc.), and a `TODO.md` roadmap focused on documentation-site patterns (code blocks, alerts, theming).

Refactor `@examples/react-design-system` to consume the shared package so React is an adapter layer over the same typestyles definitions.

Wire the Astro docs site to import the shared package on the homepage for basic dogfooding. Workspace-only and private example packages; no published npm packages are versioned by this entry.
