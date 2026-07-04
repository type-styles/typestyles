---
'typestyles': minor
---

Add `typestyles/token-scale` subpath with `generateGeometricScale` (modular ladders like font sizes from `{ base, ratio, steps }`), `generateLinearScale` (grid-based ladders like radii from `{ base, multiplier, steps }`), and `expandDurationBand` (a `{ min, base, max }` motion band from `{ base, ratio }`, rounded to the nearest 5ms by default). Pure numeric outputs with zero naming opinions — mapping steps to token names stays a design-system concern (P5.2).
