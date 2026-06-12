---
'typestyles': patch
'@typestyles/next': patch
---

Fix silent-wrong-output correctness issues (P0.1): refresh the unitless CSS property set, prefix `scopeId` onto semantic class names, add dev-mode class-name collision warnings, and wire `useTypestyles` to `subscribeRegisteredCss` via `useSyncExternalStore`.
