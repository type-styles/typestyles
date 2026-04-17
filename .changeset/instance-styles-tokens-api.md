---
'typestyles': minor
---

Replace global class naming with **instance-based** APIs.

**Breaking:** Remove `configureClassNaming`, `getClassNamingConfig`, and `resetClassNaming`. Use **`createStyles({ mode?, prefix?, scopeId? })`** for a dedicated style API (same surface as the default `styles` export). The default `import { styles } from 'typestyles'` is `createStyles()` with default options.

**Breaking:** **`createTokens({ scopeId? })`** returns the token and theme API (`create`, `use`, `createTheme`, `createDarkMode`, `when`, `colorMode`, plus read-only `scopeId`). The default `import { tokens } from 'typestyles'` is `createTokens()`. When `scopeId` is set, emitted custom properties and theme class segments are prefixed (sanitized) so multiple bundles on one page do not collide.

**Breaking:** Low-level **`createComponent`**, **`createClass`**, and **`createHashClass`** now take **`ClassNamingConfig`** as the first argument when imported from implementation modules; application code should use `createStyles()` or the default `styles` object.

**Breaking:** **`createTheme`** and **`createDarkMode`** accept an optional third argument **`scopeId`** for unscoped usage; instances from `createTokens({ scopeId })` bind scope automatically.

New exports: **`mergeClassNaming`**, **`defaultClassNamingConfig`**, **`scopedTokenNamespace`**, **`StylesApi`**, **`TokensApi`**, **`CreateTokensOptions`**. Style instances expose read-only **`classNaming`**.

Documentation, examples, and the design-system package are updated to describe and use the new pattern.
