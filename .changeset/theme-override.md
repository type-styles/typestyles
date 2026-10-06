---
'typestyles': minor
---

Add `Theme.source` and typed `Theme.override()` for deriving child themes from a root `createTheme`. Override patches are deep-partials of the parent token tree (excess keys error). Remove `createTheme({ from })` — fork with `theme.override({ name, tokens })` instead. Rename `ThemeSurface` → `Theme`, `ThemePreset` → `ThemeSource`, and `ThemeSurfaceOverrideInput` → `ThemeOverrideInput`. Raise main-entry gzip budget (+400 B) for override/source runtime.
