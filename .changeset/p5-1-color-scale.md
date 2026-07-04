---
'typestyles': minor
---

Add `typestyles/color-scale` subpath with `parseColor` (hex → OKLCH), `generateRamp` (perceptual OKLCH ramps), and `contrastRatio` (WCAG relative luminance). Design-system palette ramps now call the shared `generateRamp` implementation (P5.1).
