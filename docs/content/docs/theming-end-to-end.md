---
title: End-to-end theming
description: Build and apply a TypeStyles theme — tokens, createTheme, styles.override, and dispose
---

A complete theming setup with TypeStyles: design tokens, a theme surface class, recipe overrides, and mounting in the DOM. Consumers can customize with TypeStyles APIs or plain CSS that targets the same class names and custom properties.

For more patterns (multi-brand, condition scopes, `@property` animation), see [Theming patterns](/docs/theming-patterns). Coming from StyleX / Panda / vanilla-extract / Stitches? See [Migration](/docs/migration#coming-from-cheat-sheet).

## What you get

| Piece                                    | CSS / DOM                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| `tokens.create` / `declare`              | `:root { --app-color-… }`                                                         |
| `tokens.createTheme({ name, … })`        | `.theme-app-brand { --app-color-… }` (+ optional `light-dark()`, `@media`, attrs) |
| `styles.component`                       | Readable recipe classes (`button--intent-primary`)                                |
| `styles.override(…, { selectorPrefix })` | `.theme-app-brand .button { … }`                                                  |
| Plain CSS                                | Same class and `--*` names — consumers can theme without TypeStyles               |

## One module

```ts
// theme.ts — design-system or app entry
import { colorModes, createTypeStyles } from 'typestyles';

export const { styles, tokens } = createTypeStyles({
  scopeId: 'app',
  colorModes,
  layers: ['tokens', 'components', 'overrides'] as const,
  tokenLayer: 'tokens',
});

// 1. Contract + defaults (declare optional — useful for cross-file refs)
const colorDecl = tokens.declare('color', {
  text: true,
  surface: true,
  accent: { default: true },
});

export const color = tokens.create(
  'color',
  {
    text: '#111827',
    surface: '#ffffff',
    accent: { default: '#2563eb' },
  },
  { decl: colorDecl },
);

// 2. Recipe consumers will restyle
export const button = styles.component(
  'button',
  {
    base: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: color.accent.default,
      color: color.surface,
    },
    variants: {
      intent: {
        primary: {},
        ghost: {
          backgroundColor: 'transparent',
          color: color.accent.default,
          border: `1px solid ${color.accent.default}`,
        },
      },
    },
    defaultVariants: { intent: 'primary' },
  },
  { layer: 'components' },
);

/** Shared preset — apps deep-merge via `from` (no custom merge helper required). */
export const designPreset = {
  tokens: {
    color: {
      text: '#111827',
      surface: '#ffffff',
      accent: { default: '#2563eb' },
    },
  },
  colorMode: {
    dark: {
      color: {
        text: '#e5e7eb',
        surface: '#0f172a',
        accent: { default: '#60a5fa' },
      },
    },
  },
};

// 3. Theme surface — preset + app tweaks + optional recipe overrides
export const brand = tokens.createTheme({
  name: 'brand',
  from: designPreset,
  tokens: {
    // App / customer overrides (deep-merged onto `from.tokens`)
    color: { accent: { default: '#7c3aed' } },
    // Theme-local namespace — also available as brand.tokens.brand.*
    brand: { glow: { default: '#a78bfa' } },
  },
  // Same as styles.override(..., { selectorPrefix: `.${brand.className}` })
  components: {
    button: ({ tokens: t }) => ({
      base: { boxShadow: `0 0 0 3px ${t.brand.glow.default}` },
    }),
  },
});

// 4. Manual scoped override (when you are not using `components` on createTheme)
styles.override(
  button,
  { variants: { intent: { ghost: { textDecoration: 'underline' } } } },
  { selectorPrefix: `.${brand.className}`, layer: 'overrides' },
);

// 5. Optional one-off namespace outside a theme
export const metrics = tokens.ensureNamespace('metrics', {
  radius: { sm: '4px', lg: '12px' },
});

/** Replace a live theme (HMR / brand switcher). Default `replace: true` on createTheme. */
export function reloadBrand() {
  tokens.disposeTheme('brand');
  return tokens.createTheme({
    name: 'brand',
    from: designPreset,
    tokens: {
      color: { accent: { default: '#db2777' } },
      brand: { glow: { default: '#f9a8d4' } },
    },
  });
}
```

`brand.className` is something like `theme-app-brand`. `brand.tokens.color.accent.default` and `brand.tokens.brand.glow.default` are `var(--…)` strings — the same shape as `tokens.use('color')`.

## Mount (React)

`colorMode` on the theme compiles static light/dark values to `light-dark()` (OS preference + `color-scheme`). For an explicit `data-mode` toggle, add a `modes` layer with `tokens.when.attr` (see [condition scopes](/docs/theming-patterns#condition-scopes-self-ancestor-descendant)) or swap theme classes.

```tsx
// App.tsx
import { brand, button } from './theme';

export function App() {
  return (
    <div className={brand.className} style={{ colorScheme: 'light dark' }}>
      <button type="button" className={button()}>
        Primary
      </button>
      <button type="button" className={button({ intent: 'ghost' })}>
        Ghost
      </button>
    </div>
  );
}
```

```ts
// Optional: attribute-driven dark instead of (or in addition to) colorMode patches
tokens.createTheme({
  name: 'brand',
  tokens: designPreset.tokens,
  modes: tokens.colorMode.attributeOnly({
    attribute: 'data-mode',
    values: { light: 'light', dark: 'dark' },
    scope: 'self',
    light: designPreset.tokens,
    dark: designPreset.colorMode!.dark!,
  }),
});
// Then: <div className={brand.className} data-mode={dark ? 'dark' : 'light'}>
```

## Mount (HTML)

```html
<div class="theme-app-brand" data-mode="light">
  <button class="button button--intent-primary">Primary</button>
</div>
```

Or override tokens from **plain CSS** (no TypeStyles in the consumer app):

```css
.theme-app-brand {
  --app-color-accent-default: #059669;
}
.theme-app-brand .button--intent-primary {
  border-radius: 999px;
}
```

## Selector prefix convention

Theme-scoped recipe restyles use a **descendant** prefix (not CSS `@scope`):

```ts
styles.override(
  button,
  { base: { borderRadius: '999px' } },
  {
    selectorPrefix: `.${brand.className}`, // → ".theme-app-brand .button { … }"
    layer: 'overrides',
  },
);
```

Prefer this (or `createTheme({ components })`) over hand-written class strings. Cascade layers keep override order predictable — see [Cascade layers](/docs/cascade-layers).

## Related APIs

| Need                                  | API                                                                                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deep-merge override trees / leaf refs | [`mergeThemeOverrides`](/docs/theming-patterns#optional-mergethemeoverrides-helpers)                                                                       |
| Media / attr / class conditions       | [`tokens.when`](/docs/theming-patterns#condition-scopes-self-ancestor-descendant), [`tokens.colorMode.*`](/docs/tokens#preset-mode-layers-tokenscolormode) |
| Drop a theme (HMR / switcher)         | `tokens.disposeTheme(name)`                                                                                                                                |
| Zero-runtime extract of all recipes   | [`getRegisteredComponentRefs`](/docs/zero-runtime#design-systems-with-many-recipes) + Vite `extract.registeredComponentsModule`                            |

## Checklist for design-system authors

1. Define tokens with `tokens.create` / `declare` and recipes with `styles.component` on a shared `createTypeStyles({ scopeId })`.
2. Export a **preset** object (`tokens` / `colorMode` / `modes`) apps can pass to `from`.
3. Document that apps call `tokens.createTheme({ name, from: preset, tokens: { … } })` and apply `surface.className`.
4. Document `selectorPrefix: \`.${surface.className}\``(or theme`components`) for recipe restyles.
5. Keep class and `--*` names stable so consumers can also theme from plain CSS.
