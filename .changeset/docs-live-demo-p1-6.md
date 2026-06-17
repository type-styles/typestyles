---
---

Docs live demos (P1.6): add interactive proof blocks to Getting started, Components, and Theming patterns — live preview, source, usage, DOM classes, and emitted CSS with variant toggles. Demos register via a markdown `doc-live-demo` marker, a central registry, and build-time CSS extraction through `@typestyles/build-runner`. The getting-started button demo is isolated in a build-runner-only impl module so `styles.component('button')` does not collide with `@examples/design-system` in the Vite duplicate-namespace check.
