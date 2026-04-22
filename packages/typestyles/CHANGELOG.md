# typestyles

## 0.5.0

### Minor Changes

- [#52](https://github.com/type-styles/typestyles/pull/52): Add built-in `cx()` utility for joining class names with falsy-value filtering
- [#63](https://github.com/type-styles/typestyles/pull/63): Add first-class container query helpers: `container()` for typed `@container` keys, readable `containerRef()` / `createContainerRef()` for `container-name`, and `atRuleBlock()` / `styles.atRuleBlock()` so computed `@…` nests type-check without casting. Documentation and design-system example updated.
- [#62](https://github.com/type-styles/typestyles/pull/62): Add **opt-in CSS cascade layers** (`@layer`) and a unified **`createTypeStyles`** factory.
  - **`createStyles({ layers })`** — Pass a layer tuple (`as const`) or `{ order, prependFrameworkLayers? }`. Emits a single `@layer …;` preamble (once per stack) and wraps rules in `@layer name { … }`. When enabled, every **`class`**, **`hashClass`**, and **`component`** call must pass a third argument **`{ layer: … }`** (with `hashClass`, use **`{ layer, label? }`** instead of a positional label).
  - **`createTokens({ layers, tokenLayer })`** — When `layers` is set, `tokenLayer` is required; `:root` and theme CSS are emitted into that layer.
  - **`createTypeStyles(options)`** — Returns **`{ styles, tokens }`** with one shared `scopeId` and optional `layers` / `tokenLayer` for both class and token output.
  - **`createTheme`** / **`createDarkMode`** — Optional fourth argument for layer context when using tokens with layers.

  Default behavior is unchanged when **`layers`** is omitted (flat CSS, no `layer` option).

  New exports include **`createTypeStyles`**, **`StylesApiWithLayers`**, **`CreateStylesInput`**, **`LayerOption`**, **`LayeredComponentFn`**, cascade layer types (**`CascadeLayersInput`**, **`ResolvedCascadeLayers`**, etc.), and **`ThemeEmitLayerContext`**.

  `ClassNamingConfig` may include resolved **`cascadeLayers`**. The sheet exposes **`registerCascadeLayerOrder`** for the preamble.

  Documentation: new cascade-layers doc (`docs/content/docs/cascade-layers.md`), updates to class naming, API reference, and tokens. The design-system example uses **`createTypeStyles`**.

- [#61](https://github.com/type-styles/typestyles/pull/61): Add function overload for `styles.component(namespace, (ctx) => config)` with component-scoped internal custom properties: `ctx.var(id, options?)` and `ctx.vars(definitions)` using the same nested shape as tokens (string/number leaves or `{ value, syntax?, inherits? }`). Default `value`s are merged into `base`; optional `syntax` registers `@property`. `ctx.var` now takes `value` (not `initialValue`) for defaults and typed registration. New exports: `ComponentConfigContext`, `ComponentVarDefinitions`, `ComponentVarDescriptor`, `ComponentVarNode`, `ComponentVarRefTree`, and related `*Input` types for the component overload.
- [#73](https://github.com/type-styles/typestyles/pull/73): **typestyles:** Extend `global.fontFace` / `FontFaceProps`: `src` may be a string or an array of fragments (joined into one CSS `src`); optional `@font-face` descriptors `sizeAdjust`, `ascentOverride`, `descentOverride`, and `lineGapOverride`; dedupe keys use normalized `src` (including array vs equivalent comma-separated string). Export `FontFaceSrc`. When the same rule dedupe key is registered again with different CSS, the later rule is skipped and non-production builds warn on the mismatch (re-registration with identical CSS stays silent). Tests cover multi-`src` font faces, metric overrides, and global dedupe warnings.

  **@typestyles/next:** README examples use `styles.component` and default variant calls; add **Fonts and local files** guidance for Next extraction (`public/fonts/`, root-relative URLs) versus Vite asset URLs.

- [#72](https://github.com/type-styles/typestyles/pull/72): Add **`createGlobal`** for scoped global CSS (optional cascade **`layers`** and default **`globalLayer`**), wire **`global`** into **`createTypeStyles`**, and ship a **`typestyles/globals`** entry with Josh Comeau’s **`reset`** (plus **`layer`** support for layered stacks) and small selector recipes.
  - **`createTypeStyles`** now returns **`{ styles, tokens, global }`**. With **`layers`**, pass optional **`globalLayer`** so `global.style` / **`global.apply`** defaults match your stack; **`tokenLayer`** remains required when layers are enabled.
  - **`global.style`** accepts **`GlobalStyleTuple`** recipes (from **`typestyles/globals`**) in addition to selector + properties; root **`global`** ignores per-call **`layer`** (dev warning) — use **`createGlobal`** / layered **`createTypeStyles`** for `@layer`.
  - **`global.apply(...tuples)`** applies multiple tuples in one call.
  - New **`content`** helper for typed CSS **`content`** values on the main export.
  - Types: **`GlobalApiUnlayered`**, **`GlobalApiLayered`**, **`GlobalStyleTuple`**.

- [#59](https://github.com/type-styles/typestyles/pull/59): Replace global class naming with **instance-based** APIs.

  **Breaking:** Remove `configureClassNaming`, `getClassNamingConfig`, and `resetClassNaming`. Use **`createStyles({ mode?, prefix?, scopeId? })`** for a dedicated style API (same surface as the default `styles` export). The default `import { styles } from 'typestyles'` is `createStyles()` with default options.

  **Breaking:** **`createTokens({ scopeId? })`** returns the token and theme API (`create`, `use`, `createTheme`, `createDarkMode`, `when`, `colorMode`, plus read-only `scopeId`). The default `import { tokens } from 'typestyles'` is `createTokens()`. When `scopeId` is set, emitted custom properties and theme class segments are prefixed (sanitized) so multiple bundles on one page do not collide.

  **Breaking:** Low-level **`createComponent`**, **`createClass`**, and **`createHashClass`** now take **`ClassNamingConfig`** as the first argument when imported from implementation modules; application code should use `createStyles()` or the default `styles` object.

  **Breaking:** **`createTheme`** and **`createDarkMode`** accept an optional third argument **`scopeId`** for unscoped usage; instances from `createTokens({ scopeId })` bind scope automatically.

  New exports: **`mergeClassNaming`**, **`defaultClassNamingConfig`**, **`scopedTokenNamespace`**, **`StylesApi`**, **`TokensApi`**, **`CreateTokensOptions`**. Style instances expose read-only **`classNaming`**.

  Documentation, examples, and the design-system package are updated to describe and use the new pattern.

- [#49](https://github.com/type-styles/typestyles/pull/49): Add ESLint configuration across all packages, examples, and docs. Create shared `eslint.base.js` config with TypeScript rules and add lint scripts to all package.json files. Update CI workflow to run lint via turbo.
- [#56](https://github.com/type-styles/typestyles/pull/56): Support nested token objects in `tokens.create` and the same nested shape in `tokens.createTheme`. Nested keys become hyphenated CSS custom properties (for example `color.text.primary` → `--color-text-primary` and `var(--color-text-primary)`).

  Export `flattenTokenEntries` and the `FlatTokenEntry` type so consumers can build `--namespace-key` declarations with the same rules as the token APIs.

  The design-system example now uses this pattern directly instead of local flatten/ref helpers.

- [#66](https://github.com/type-styles/typestyles/pull/66): Add `fileScopeId(import.meta)` for per-file `scopeId` so the same logical class or component name in different modules does not collide. In development, registering the same `styles.class` or `styles.component` name twice under one scope throws (with guidance to use `scopeId` / `fileScopeId`); production behavior is unchanged. In development, unknown variant dimensions, invalid option values, and unknown flat variant keys emit `console.error`. `createComponent` and `styles.component` overloads use `const` type parameters for sharper literal inference.
- [#68](https://github.com/type-styles/typestyles/pull/68): Infer multipart **`slots`** from the array literal passed to **`styles.component`** (and **`createComponent`**) using a `const` type parameter on `Slots extends readonly string[]`. Slot names are typed as `Slots[number]`, so destructuring and `()` return **`Record<…>`** with known keys and errors on unknown properties—**without `as const` on `slots`** when the array is written inline.

  **Type-only:** `MultiSlotConfig`, `MultiSlotReturn`, `SlotComponentConfig`, `SlotComponentFunction`, and related inputs now take a **readonly string tuple** type parameter (the `slots` array) instead of a single string union `S`. Call-site inference is unchanged for typical object literals; advanced `extends` / explicit generics may need a small adjustment.

  Docs and the design-system example drop redundant `as const` on `slots` where inference applies.

- [#57](https://github.com/type-styles/typestyles/pull/57): **Breaking:** `tokens.createTheme` now takes a config object with `base`, and either `modes` or `colorMode` (presets). Namespace overrides must live under `base` (for example `{ base: { color: { … } } }`). It returns a **`ThemeSurface`** (`className`, `name`, string coercion) instead of a plain class string—use `surface.className` or `` `${surface}` `` where a string is required.

  Adds **`tokens.when`** (media, `prefersDark` / `prefersLight`, attribute/class scope, `selector` escape hatch, `and` / `or` / **`not`**) and **`tokens.colorMode`** presets (`mediaOnly`, `attributeOnly`, `mediaOrAttribute`, `systemWithLightDarkOverride`), plus **`tokens.createDarkMode`** as a shorthand for media-only dark overrides.

  Theme rules use stable dedupe keys (`theme:{name}:base`, `theme:{name}:mode:{id}:branch:{n}`). In development, empty mode overrides and dubious `when.selector` / `when.not` shapes log warnings.

  **Types:** `ThemeOverrides` allows deep partial nested token maps; new exports include `ThemeConditionNot` and `DeepPartialTokenValues`.

- [#54](https://github.com/type-styles/typestyles/pull/54): Unify multi-variant styling on `styles.component` with a CVA-style return value: call it for a composed class string (base always applied) or destructure named class strings. Supports dimensioned variants (`variants`, `compoundVariants`, `defaultVariants`), flat variant maps, and slot-based configs.

  Remove `styles.create` from the public `styles` API; use `styles.component` instead.

  Update Vite and Rollup static namespace extraction to match `styles.component(...)` only (no longer scans `styles.create(...)`).

- [#64](https://github.com/type-styles/typestyles/pull/64): Add `has`, `is`, and `where` helpers for `:has()`, `:is()`, and `:where()` nested keys (also on `styles`). Infer literal `@container …` keys from typed `container()` arguments so bracket notation mixes with longhands without `as CSSProperties`; use `atRuleBlock` when the key is only a generic `string`. Export `ContainerObjectKey` and document the pattern in the docs.

### Patch Changes

- [#45](https://github.com/type-styles/typestyles/pull/45): Add comprehensive test coverage for previously untested modules: props utils/generate/runtime, typestyles build, and migrate transform/css/files.
- [#34](https://github.com/type-styles/typestyles/pull/34): `withTypestylesExtract` now sets `NEXT_PUBLIC_TYPESTYLES_RUNTIME_DISABLED` via `next.config` `env` so client bundles disable runtime style injection under **Turbopack** as well as webpack (webpack `DefinePlugin` alone does not run for Turbopack). Core `sheet` reads this env flag alongside `__TYPESTYLES_RUNTIME_DISABLED__`.

  README: build-time CSS / Turbopack notes; clarify `getTypestylesMetadata` and fix the previous `generateMetadata` example. Add `@typestyles/next` tests for `withTypestylesExtract`.

  TypeScript: module augmentation + `client.d.ts` declaration for `useServerInsertedHTML` (aligned `@types/react` / `@types/react-dom`); add `typecheck` script; restore `webpack` + `typestyles` devDependencies and `server.d.ts` / `./build` exports. `buildTypestylesForNext` now uses `collectStylesFromModules` from `typestyles/build` (no separate `@typestyles/build` package).

- [#50](https://github.com/type-styles/typestyles/pull/50): Add lint-staged for prettier formatting on pre-commit hook and format entire codebase

## Unreleased

### Breaking changes

- **Instance-based APIs replace global class naming.** Removed `configureClassNaming`, `getClassNamingConfig`, and `resetClassNaming`.
  - Use **`createStyles({ mode?, prefix?, scopeId? })`** for a dedicated style API (same surface as the default `styles` export). Default `import { styles } from 'typestyles'` is `createStyles()`.
  - Use **`createTokens({ scopeId? })`** for a dedicated token + theme API. Default `import { tokens } from 'typestyles'` is `createTokens()`. When `scopeId` is set, `tokens.create` / `createTheme` emit scoped `--{scope}-namespace-*` variables and `.theme-{scope}-{name}` classes (sanitized segments).
  - New exports: `mergeClassNaming`, `defaultClassNamingConfig`, `scopedTokenNamespace`, and types `StylesApi`, `TokensApi`, `CreateTokensOptions`.
- Low-level **`createComponent`**, **`createClass`**, and **`createHashClass`** now take **`ClassNamingConfig`** as the first argument when imported from internal modules; app code should use `createStyles()` or the default `styles` object instead.

## 0.4.0

### Minor Changes

- [#25](https://github.com/type-styles/typestyles/pull/25): Updating bundler integrations and adding examples
- [#27](https://github.com/type-styles/typestyles/pull/27): Add a new `styles.withUtils(utils)` API for defining typed style shorthands (for example `marginX`, `paddingY`, and `size`) and using them with `styles.class`, `styles.create`, and `styles.hashClass`.
- [#33](https://github.com/type-styles/typestyles/pull/33): Add configurable class naming modes for gradual adoption across packages:
  - `configureClassNaming({ mode, prefix?, scopeId? })` with modes `semantic` (default), `hashed`, and `atomic`.
  - Applies to `styles.create`, `styles.class`, `styles.component` (including slot recipes), and affects `prefix` / optional `scopeId` mixing for `styles.hashClass`.
  - Export `getClassNamingConfig` and `resetClassNaming` (for tests).

  Documentation:
  - New site page `docs/content/docs/class-naming.md` (sidebar: Class naming) describing modes, `scopeId`, SSR, and testing.
  - Cross-links from Getting Started, Styles, Recipes, Atomic CSS utilities, API Reference, and Testing.

- [#31](https://github.com/type-styles/typestyles/pull/31): Unify variant APIs around `styles.component` and add first-class multipart slot support via `slots`.

  Breaking changes:
  - Remove `styles.recipe` in favor of `styles.component`.
  - Remove recipe type aliases (`RecipeConfig`, `RecipeFunction`, `RecipeVariants`) and replace with component terminology (`ComponentVariants`, plus new slot component types).

  New capability:
  - `styles.component(name, { slots, base, variants, compoundVariants, defaultVariants })` now returns per-slot class maps for multipart components.

  Naming update for slot mode:
  - Slot base classes now use `{namespace}-{slot}` (without `-base`).

- [#23](https://github.com/type-styles/typestyles/pull/23): Add `styles.class()` for single-class definitions and a three-argument `styles.create(name, base, variants)` API that automatically includes base styles, then updated the Next.js example to use the new DX without affecting published packages.
- [#26](https://github.com/type-styles/typestyles/pull/26): feat: styles.recipe()

## 0.3.0

### Minor Changes

- [#9](https://github.com/type-styles/typestyles/pull/9): Add support for attribute selectors in nested styles. You can now use `[data-variant]`, `[disabled]`, `[data-size="lg"]` and other attribute selectors directly in style definitions:

  ```typescript
  styles.create('button', {
    padding: '8px',
    '[data-variant="primary"]': { backgroundColor: 'blue' },
    '[disabled]': { opacity: 0.5 },
  });
  ```

- [#10](https://github.com/type-styles/typestyles/pull/10): Fix lint errors and TypeScript issues
  - Replace `any` types with `unknown` in type definitions
  - Fix empty object types `{}` in defineProperties
  - Add proper generic type parameters to functions
  - Prefix unused parameters with underscore
  - Add eslint ignores for generated docs files and scripts
  - Fix test assertions to use proper types

### Patch Changes

- [#13](https://github.com/type-styles/typestyles/pull/13): Add CI workflow for lint, typecheck, and test

## 0.2.0

### Minor Changes

- [#6](https://github.com/type-styles/typestyles/pull/6): Add new `@typestyles/props` package for type-safe atomic CSS utility generation, with `defineProperties()` and `createProps()` APIs supporting responsive conditions, shorthand properties, and automatic CSS injection.

  Add `compose` to `styles` namespace for composing multiple selector functions or class strings. Add `createVar()` and `assignVars()` for CSS custom property management. Export `insertRules`, `reset`, and `flushSync` utilities from the sheet module. Add `CSSVarRef` and `RecipeVariants` type exports.

## 0.1.0

### Minor Changes

- [#4](https://github.com/type-styles/typestyles/pull/4): Add `styles.component()` API for multi-variant component styles with support for base styles, variant dimensions, compound variants, and default variants. Add `global.style()` and `global.fontFace()` APIs for applying styles to arbitrary CSS selectors and declaring `@font-face` rules. Update the Vite plugin to support HMR for the new APIs.

## 0.0.2

### Patch Changes

- [#1](https://github.com/type-styles/typestyles/pull/1): Initial release of typestyles - CSS-in-TypeScript that embraces CSS instead of hiding from it.

  Features:
  - Core typestyles library with type-safe CSS styling
  - Server-side rendering support
  - Vite plugin for HMR support
