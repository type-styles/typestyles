---
'@typestyles/build-runner': patch
---

Fix `runTypestylesBuild` dropping CSS from components reached only through an unread namespace/barrel import. Style registration calls (`styles.component`, `styles.class`, `createTypeStyles`) are side-effect-only — the CSS they register is the point, independent of whether the returned classname function is ever read. esbuild's default tree shaking didn't know that, so a consumer's extraction entry that imports a tree-shakeable component library via `import * as lib from '...'` (never destructuring/reading a named export) could have that library's internal registration calls silently eliminated as "unused," especially for libraries marked `"sideEffects": false`. The extraction bundle now sets `treeShaking: false` so every registration in the graph survives, matching real runtime behavior.
