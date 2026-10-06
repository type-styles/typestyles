---
'typestyles': minor
---

Add `ThemeSurface.source` and typed `ThemeSurface.override()` for deriving child themes from a root `createTheme` surface. Override patches are deep-partials of the parent token tree (excess keys error). Prefer `theme.override({ name, tokens })` over `createTheme({ from })` when forking a design-system theme. Raise main-entry gzip budget (+400 B) for override/source runtime.
