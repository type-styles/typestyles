---
title: Tokens
description: Design tokens and theming with tokens.create and createTheme
---

# Tokens

Tokens are design primitives (colors, spacing, etc.) exposed as CSS custom properties. They keep your styles consistent and make theming straightforward.

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

Use `tokens.createTheme(name, overrides)` to define a theme that overrides token values:

```ts
const dark = tokens.createTheme('dark', {
  color: {
    primary: '#66b3ff',
    text: '#e0e0e0',
    surface: '#1a1a2e',
  },
});
```

Apply the theme by adding the theme class to a parent (e.g. `document.body.classList.add(dark)`). All token references under that subtree will use the overridden values.
