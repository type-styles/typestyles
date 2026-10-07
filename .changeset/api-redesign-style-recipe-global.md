---
'typestyles': major
'@typestyles/eslint-plugin': major
'@typestyles/cli': minor
'@typestyles/build-runner': minor
'@typestyles/vite': minor
'@typestyles/next': patch
'@typestyles/react': minor
'@typestyles/migrate': major
---

Public API redesign: `createTypeStyles` returns a flat `{ style, hash, recipe, tokens, global, … }` surface; nested `layers: { order, token, style, global? }`; `global.rule` / `global.rules`; remove root `styles` / `tokens` / `global` singletons. Migrate codemod emits `style` / `recipe` via `createTypeStyles`. Cache-bust extract module imports so Next route CSS re-runs register styles.
