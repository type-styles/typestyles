---
'typestyles': minor
---

Add optional `nameTemplate` on `createTokens` and `tokens.create` for custom CSS custom property names — migration from existing variable systems, Style Dictionary / DTCG naming conventions, and cross-namespace aliasing. Default `--{scopeId}-{namespace}-{path}` behavior is unchanged when `nameTemplate` is omitted. Theme overrides, `tokens.use()`, and `@property` registration share the same resolved names.
