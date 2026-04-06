---
'typestyles': minor
---

Add **opt-in CSS cascade layers** (`@layer`) and a unified **`createTypeStyles`** factory.

- **`createStyles({ layers })`** — Pass a layer tuple (`as const`) or `{ order, prependFrameworkLayers? }`. Emits a single `@layer …;` preamble (once per stack) and wraps rules in `@layer name { … }`. When enabled, every **`class`**, **`hashClass`**, and **`component`** call must pass a third argument **`{ layer: … }`** (with `hashClass`, use **`{ layer, label? }`** instead of a positional label).
- **`createTokens({ layers, tokenLayer })`** — When `layers` is set, `tokenLayer` is required; `:root` and theme CSS are emitted into that layer.
- **`createTypeStyles(options)`** — Returns **`{ styles, tokens }`** with one shared `scopeId` and optional `layers` / `tokenLayer` for both class and token output.
- **`createTheme`** / **`createDarkMode`** — Optional fourth argument for layer context when using tokens with layers.

Default behavior is unchanged when **`layers`** is omitted (flat CSS, no `layer` option).

New exports include **`createTypeStyles`**, **`StylesApiWithLayers`**, **`CreateStylesInput`**, **`LayerOption`**, **`LayeredComponentFn`**, cascade layer types (**`CascadeLayersInput`**, **`ResolvedCascadeLayers`**, etc.), and **`ThemeEmitLayerContext`**.

`ClassNamingConfig` may include resolved **`cascadeLayers`**. The sheet exposes **`registerCascadeLayerOrder`** for the preamble.

Documentation: new cascade-layers doc (`docs/content/docs/cascade-layers.md`), updates to class naming, API reference, and tokens. The design-system example uses **`createTypeStyles`**.
