---
'typestyles': minor
---

Simplify `tokens.createTheme` to a single named-argument object: per-namespace values live under `tokens` (replacing `base` / `extend`), presets use `from` with sibling-field merges (no `patch`), and docs cover migration from StyleX, Panda, vanilla-extract, and Stitches.
