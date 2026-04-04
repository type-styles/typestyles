# typestyles

## Unreleased

### Breaking changes

- **Instance-based APIs replace global class naming.** Removed `configureClassNaming`, `getClassNamingConfig`, and `resetClassNaming`.
  - Use **`createStyles({ mode?, prefix?, scopeId? })`** for a dedicated style API (same surface as the default `styles` export). Default `import { styles } from 'typestyles'` is `createStyles()`.
  - Use **`createTokens({ scopeId? })`** for a dedicated token + theme API. Default `import { tokens } from 'typestyles'` is `createTokens()`. When `scopeId` is set, `tokens.create` / `createTheme` emit scoped `--{scope}-namespace-*` variables and `.theme-{scope}-{name}` classes (sanitized segments).
  - New exports: `mergeClassNaming`, `defaultClassNamingConfig`, `scopedTokenNamespace`, and types `StylesApi`, `TokensApi`, `CreateTokensOptions`.
- Low-level **`createComponent`**, **`createClass`**, and **`createHashClass`** now take **`ClassNamingConfig`** as the first argument when imported from internal modules; app code should use `createStyles()` or the default `styles` object instead.

## 0.4.0

### Minor Changes

- 0bb563c: Updating bundler integrations and adding examples
- ee22964: Add a new `styles.withUtils(utils)` API for defining typed style shorthands (for example `marginX`, `paddingY`, and `size`) and using them with `styles.class`, `styles.create`, and `styles.hashClass`.
- 5b71381: Add configurable class naming modes for gradual adoption across packages:
  - `configureClassNaming({ mode, prefix?, scopeId? })` with modes `semantic` (default), `hashed`, and `atomic`.
  - Applies to `styles.create`, `styles.class`, `styles.component` (including slot recipes), and affects `prefix` / optional `scopeId` mixing for `styles.hashClass`.
  - Export `getClassNamingConfig` and `resetClassNaming` (for tests).

  Documentation:
  - New site page `docs/content/docs/class-naming.md` (sidebar: Class naming) describing modes, `scopeId`, SSR, and testing.
  - Cross-links from Getting Started, Styles, Recipes, Atomic CSS utilities, API Reference, and Testing.

- 3e26285: Unify variant APIs around `styles.component` and add first-class multipart slot support via `slots`.

  Breaking changes:
  - Remove `styles.recipe` in favor of `styles.component`.
  - Remove recipe type aliases (`RecipeConfig`, `RecipeFunction`, `RecipeVariants`) and replace with component terminology (`ComponentVariants`, plus new slot component types).

  New capability:
  - `styles.component(name, { slots, base, variants, compoundVariants, defaultVariants })` now returns per-slot class maps for multipart components.

  Naming update for slot mode:
  - Slot base classes now use `{namespace}-{slot}` (without `-base`).

- 4f29bb7: Add `styles.class()` for single-class definitions and a three-argument `styles.create(name, base, variants)` API that automatically includes base styles, then updated the Next.js example to use the new DX without affecting published packages.
- 8f0e9a3: feat: styles.recipe()

## 0.3.0

### Minor Changes

- 5b08816: Add support for attribute selectors in nested styles. You can now use `[data-variant]`, `[disabled]`, `[data-size="lg"]` and other attribute selectors directly in style definitions:

  ```typescript
  styles.create('button', {
    padding: '8px',
    '[data-variant="primary"]': { backgroundColor: 'blue' },
    '[disabled]': { opacity: 0.5 },
  });
  ```

- c72cb12: Fix lint errors and TypeScript issues
  - Replace `any` types with `unknown` in type definitions
  - Fix empty object types `{}` in defineProperties
  - Add proper generic type parameters to functions
  - Prefix unused parameters with underscore
  - Add eslint ignores for generated docs files and scripts
  - Fix test assertions to use proper types

### Patch Changes

- 60bc3e5: Add CI workflow for lint, typecheck, and test

## 0.2.0

### Minor Changes

- 1c6b0b7: Add new `@typestyles/props` package for type-safe atomic CSS utility generation, with `defineProperties()` and `createProps()` APIs supporting responsive conditions, shorthand properties, and automatic CSS injection.

  Add `compose` to `styles` namespace for composing multiple selector functions or class strings. Add `createVar()` and `assignVars()` for CSS custom property management. Export `insertRules`, `reset`, and `flushSync` utilities from the sheet module. Add `CSSVarRef` and `RecipeVariants` type exports.

## 0.1.0

### Minor Changes

- e63a512: Add `styles.component()` API for multi-variant component styles with support for base styles, variant dimensions, compound variants, and default variants. Add `global.style()` and `global.fontFace()` APIs for applying styles to arbitrary CSS selectors and declaring `@font-face` rules. Update the Vite plugin to support HMR for the new APIs.

## 0.0.2

### Patch Changes

- 5009776: Initial release of typestyles - CSS-in-TypeScript that embraces CSS instead of hiding from it.

  Features:
  - Core typestyles library with type-safe CSS styling
  - Server-side rendering support
  - Vite plugin for HMR support
