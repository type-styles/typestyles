---
'@typestyles/build-runner': patch
---

Fix `runTypestylesBuild` dropping CSS from a component reached only through a plain bare import (`import './some-lib';`, no binding at all) of a package marked `"sideEffects": false`. This is a separate esbuild behavior from the tree-shaking-of-declarations bug fixed previously (`treeShaking: false`, in the prior patch) — it happens earlier, driven directly by the `sideEffects` / `@__PURE__` annotations, and drops the import before the module is ever considered for bundling, regardless of the `treeShaking` setting. A real extraction entry is exactly this shape: several side-effect-only imports, any one of which may point at a (correctly) tree-shakeable component library. The extraction bundle now also sets `ignoreAnnotations: true` so no import in the extraction graph is dropped based on these annotations.
