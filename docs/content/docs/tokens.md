---
title: Tokens
description: Design tokens and theming with tokens.create, createTheme, and color modes
---

# Tokens

Tokens are design primitives (colors, spacing, etc.) exposed as CSS custom properties. They keep your styles consistent and make theming straightforward.

## Scoped token instances

The default `import { tokens } from 'typestyles'` is unscoped. For a **package or micro-frontend** that shares the page with other TypeStyles bundles, call **`createTokens({ scopeId })`** once and reuse that instance so custom properties and theme classes do not collide:

```ts
import { createTokens } from 'typestyles';

export const tokens = createTokens({ scopeId: 'acme-ui' });

const color = tokens.create('color', { primary: '#0066ff' });
// var(--acme-ui-color-primary)
```

See [Class naming](/docs/class-naming) for how this pairs with `createStyles({ scopeId })` for styles.

## Creating tokens

Use `tokens.create(prefix, object)` to define a set of tokens:

```ts
import { tokens } from 'typestyles';

const space = tokens.create('space', {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
});

const color = tokens.create('color', {
  primary: '#0066ff',
  text: '#111827',
  border: '#e5e7eb',
});
```

Each value becomes a CSS custom property: `--space-xs`, `--color-primary`. The create function returns an object of the same shape whose values are `var(--prefix-key)` so you can use them in styles:

```ts
padding: space.md,        // var(--space-md)
backgroundColor: color.primary,  // var(--color-primary)
```

## Referencing tokens defined elsewhere

When tokens are created in another module or package, use `tokens.use(namespace)` to get the same `var(--namespace-key)` references **without** emitting another `:root` rule. The namespace must already be registered (via `tokens.create`) before those variables exist in CSS.

## Theming

Use `tokens.createTheme(name, config)` to register a **theme surface**: a class `theme-{name}` whose custom properties override token values for that subtree.

- **`base`** — Overrides always applied on the surface (typical light / default brand).
- **`modes`** — Extra layers with explicit `tokens.when.*` conditions.
- **`colorMode`** — Preset layers from `tokens.colorMode.*` (mutually exclusive with `modes`).

```ts
const dark = tokens.createTheme('dark', {
  base: {
    color: {
      primary: '#66b3ff',
      text: '#e0e0e0',
      surface: '#1a1a2e',
    },
  },
});
```

`createTheme` returns a **`ThemeSurface`** (`className`, `name`, string coercion). Pass **`dark.className`** to DOM or React `className` props, or use `String(dark)` / `` `${dark}` `` in templates.

```ts
document.body.classList.add(dark.className);
```

**Shorthand — dark under `prefers-color-scheme` only:**

```ts
const autoDark = tokens.createDarkMode('app', {
  color: { text: '#e5e7eb', surface: '#0f172a' },
});
```

**Preset — system + `data-color-mode` toggle:**

```ts
const light = { color: { text: '#111', surface: '#fff' } };
const dark = { color: { text: '#eee', surface: '#111' } };

const shell = tokens.createTheme('shell', {
  base: light,
  colorMode: tokens.colorMode.systemWithLightDarkOverride({
    attribute: 'data-color-mode',
    values: { light: 'light', dark: 'dark', system: 'system' },
    scope: 'ancestor',
    light,
    dark,
  }),
});
```

Other presets: `tokens.colorMode.mediaOnly`, `attributeOnly`, `mediaOrAttribute`. Condition primitives: `tokens.when.media`, `prefersDark`, `attr`, `className`, `selector`, `and`, `or`, `not`.

See [Theming patterns](/docs/theming-patterns) for end-to-end examples.
