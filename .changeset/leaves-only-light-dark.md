---
'typestyles': minor
---

**BREAKING:** Remove structured `createTheme({ colorMode })` / `Theme.override({ colorMode })` patches. Light/dark values are mode-aware token leaves only (`{ light, dark }` → CSS `light-dark()`). Keep instance `colorModes` and conditional `modes` / `tokens.colorMode.*` presets.
