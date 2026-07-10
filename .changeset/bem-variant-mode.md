---
'typestyles': minor
---

Add `mode: 'bem'` to `createStyles`/`createTypeStyles`: dimensioned and slot `styles.component()` variants compile to BEM modifier classes (`block--modifier`, `block__element--modifier`) instead of the default `{namespace}-{dimension}-{option}` naming. The base/root class drops the `-base` suffix (the bare block class is the base state). Compound variants compile to chained modifier-class selectors with no synthetic class. Dev mode warns when two dimensions would produce the same modifier class name. See `specs/bem-variant-mode.md`.
