---
'typestyles': minor
'@typestyles/build-runner': patch
---

Add component registry extract helpers and `extract.registeredComponentsModule` / `include: 'allRegisteredComponents'` (#219). The include flag appends a convention `themeable-refs` registry module to the extract graph when it exists.
