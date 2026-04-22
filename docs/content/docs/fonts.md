---
title: Fonts
description: Loading web fonts with global.fontFace, Vite, and Next.js
---

TypeStyles does not replace the platform font stack: you still choose **families** with normal CSS properties (`fontFamily`, `fontWeight`, tokens, and so on). For **loading** files or tuning fallbacks, use **`global.fontFace()`** from the same `createTypeStyles` / `createGlobal` instance as the rest of your app styles.

## `global.fontFace(family, props)`

Registers an `@font-face` rule. Calls are deduplicated by **family name + normalized `src`**.

- **`src`** — Either one CSS fragment (`"url('…') format('woff2')"` or `"local('My Font')"`…) or an **array** of fragments, which are joined with commas (same as a handwritten multi-value `src:`).
- **`fontWeight`** / **`fontStyle`** — Supports variable fonts with a range string, e.g. `'100 900'`.
- **`fontDisplay`**, **`fontStretch`**, **`unicodeRange`** — Passed through to CSS.
- **Metric overrides** (optional): **`sizeAdjust`**, **`ascentOverride`**, **`descentOverride`**, **`lineGapOverride`** — map to `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override` for fallback tuning.

The family name is emitted as a quoted `font-family` in `@font-face`. Use the same name first in your `font-family` stacks (as in design tokens) so the loaded face applies.

See also [API Reference — `global`](/docs/api-reference).

## Vite: local files

### `public/` (works with zero-runtime extraction)

Put files under **`public/fonts/`** and use a root-relative URL. This matches how [zero-runtime extraction](/docs/zero-runtime) collects CSS: extract entries are bundled with **esbuild**, which does **not** run Vite’s `?url` pipeline for font files. Any module in `extract.modules` should avoid `import './font.woff2?url'` unless you add a custom extract setup.

```ts
global.fontFace('Inter', {
  src: "url('/fonts/inter-latin-400-normal.woff2') format('woff2')",
  fontWeight: 400,
  fontStyle: 'normal',
  fontDisplay: 'swap',
});
```

The [Vite plugin](/docs/vite-plugin) invalidates `@font-face` rules on HMR when your module calls `global.fontFace('FamilyName', …)`.

### `?url` imports (runtime-only or non-extract graphs)

When styles run only through **Vite’s** transform (for example **no** `extract.modules`, or the font import lives outside the extract entry graph), you can use **`?url`** so production CSS points at a hashed asset:

```ts
import interWoff2 from './fonts/inter-latin-400-normal.woff2?url';

global.fontFace('Inter', {
  src: `url(${interWoff2}) format('woff2')`,
  fontDisplay: 'swap',
});
```

Add `/// <reference types="vite/client" />` in a `vite-env.d.ts` (or use Vite’s default template) so TypeScript understands `?url` imports.

## Next.js: local files

**`buildTypestylesForNext` / `collectStylesFromModules`** execute your style entry in **Node**. Avoid importing binary font URLs there unless your runner resolves them the same way as the browser bundle.

**Reliable pattern:** place fonts in **`public/fonts/…`** and reference them with a **root-relative** `url('/fonts/…')` in `global.fontFace`. Next serves `public/` at the site root, and extraction only needs the string.

**With `next/font/local`:** you can keep `next/font` for optimized loading and still use TypeStyles for components. Either apply the `next/font` `className` on the root layout or map the resolved CSS variables into your tokens—TypeStyles does not need to own `@font-face` in that setup.

## External stylesheets (Google Fonts, etc.)

You can still use `<link rel="stylesheet" href="…">` in your layout. That path is independent of `global.fontFace`; pick one strategy per family to avoid loading the same face twice.

## Types

`FontFaceProps` and **`FontFaceSrc`** are exported from `typestyles` for reuse in helpers or design-system wrappers.
