---
'typestyles': minor
---

Add syntax-typed design tokens via `tokens.declare()`: `SyntaxRef<'<color>'>` (and other CSS syntaxes) for compile-time ref compatibility in `create({ decl })` and `styles()`, while plain `tokens.create()` without `declare` stays unchanged.
