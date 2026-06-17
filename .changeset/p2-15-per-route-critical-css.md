---
'@typestyles/build-runner': minor
'@typestyles/next': minor
---

Per-route critical CSS for Next.js App Router (P2.15): `buildTypestylesForNext` emits route-scoped stylesheets and manifest v2 with a `routes` map; `getRouteCss` reads them at request time instead of the full `getRegisteredCss()` buffer.
