---
'typestyles': minor
'@typestyles/next': patch
---

**typestyles:** Extend `global.fontFace` / `FontFaceProps`: `src` may be a string or an array of fragments (joined into one CSS `src`); optional `@font-face` descriptors `sizeAdjust`, `ascentOverride`, `descentOverride`, and `lineGapOverride`; dedupe keys use normalized `src` (including array vs equivalent comma-separated string). Export `FontFaceSrc`. When the same rule dedupe key is registered again with different CSS, the later rule is skipped and non-production builds warn on the mismatch (re-registration with identical CSS stays silent). Tests cover multi-`src` font faces, metric overrides, and global dedupe warnings.

**@typestyles/next:** README examples use `styles.component` and default variant calls; add **Fonts and local files** guidance for Next extraction (`public/fonts/`, root-relative URLs) versus Vite asset URLs.
