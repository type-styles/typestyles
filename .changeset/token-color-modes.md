---
'typestyles': minor
---

Add mode-aware token leaves (`{ light, dark }`) on `tokens.create()` and `tokens.createTheme()` when `colorModes` is configured. Color/image-compatible values compile to `light-dark()` on custom properties; incompatible values (e.g. shadow shorthands) emit dark-mode override rules. `createTheme` accepts structured `colorMode: { light, dark }` patches and emits `color-scheme: light dark` on theme surfaces. Preset mode layers (`tokens.colorMode.*`) are passed via `modes` instead of `colorMode`.
