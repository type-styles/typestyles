---
'typestyles': minor
---

Add `mode: 'template'` to `createStyles`/`createTypeStyles`: dimensioned and slot `styles.component()` variants compile to class names decided by a user-supplied `classNameTemplate: (ctx) => string` function, instead of a fixed convention. `mode: 'bem'` is now implemented internally as a built-in preset of this same mechanism — its public behavior is unchanged. See `specs/classname-template-mode.md`.
