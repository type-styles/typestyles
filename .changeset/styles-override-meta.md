---
'typestyles': minor
---

Add `styles.override()` for recipe-shaped typed component restyling, backed by
non-enumerable `__tsMeta` on every `styles.component()` return and
`getComponentMeta()` for consumers. Supports semantic, bem, template, and
attribute naming modes with `selectorPrefix` + cascade `layer` options.

Raises the main-entry gzip budget to 26 KB for the new override runtime.
