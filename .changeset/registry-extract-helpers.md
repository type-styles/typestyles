---
'typestyles': minor
'@typestyles/build-runner': patch
---

Add component registry extract helpers and `extract.registeredComponentsModule` / `include: 'allRegisteredComponents'` (#219). The include flag bootstraps `getRegisteredComponentRefs(styles)` on the first extract module during `runTypestylesBuild`.
