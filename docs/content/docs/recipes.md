---
title: Recipes
description: Build typed variant APIs with styles.component
---

# Recipes

`styles.component()` is the first-class API for variant-driven component styling.

If you need flat named variants (without dimensioned recipe config), see [Styles](/docs/styles).

Use it when you want a typed interface with:

- `base` styles
- `variants` dimensions
- `compoundVariants` for combinations
- `defaultVariants`

## Basic recipe

```ts
import { styles } from 'typestyles';

export const button = styles.component('button', {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    borderRadius: '8px',
    fontWeight: 500,
  },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb', color: 'white' },
      ghost: { backgroundColor: 'transparent', color: '#1f2937' },
    },
    size: {
      sm: { padding: '6px 10px', fontSize: '14px' },
      lg: { padding: '10px 16px', fontSize: '16px' },
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'sm',
  },
});

button(); // "button-base button-intent-primary button-size-sm"
button({ size: 'lg' }); // "button-base button-intent-primary button-size-lg"
button({ intent: 'ghost', size: 'lg' }); // "button-base button-intent-ghost button-size-lg"
```

Class strings follow the global [class naming](/docs/class-naming) configuration (`semantic` by default).

## Compound variants

Use `compoundVariants` for styles that should apply only when multiple variant values match.

```ts
const badge = styles.component('badge', {
  variants: {
    tone: {
      success: { color: '#166534' },
      warning: { color: '#92400e' },
      danger: { color: '#991b1b' },
    },
    size: {
      sm: { fontSize: '12px' },
      lg: { fontSize: '14px' },
    },
  },
  compoundVariants: [
    {
      variants: { tone: ['success', 'warning'], size: 'lg' },
      style: { fontWeight: 700 },
    },
  ],
});

badge({ tone: 'success', size: 'lg' }); // includes "badge-compound-0"
badge({ tone: 'danger', size: 'lg' }); // does not include compound class
```

`compoundVariants` supports:

- single values: `{ size: 'lg' }`
- multi-value arrays: `{ tone: ['success', 'warning'] }`

## Boolean variants

Boolean variant dimensions are represented with `"true"` / `"false"` option keys.

```ts
const input = styles.component('input', {
  base: { border: '1px solid #d1d5db' },
  variants: {
    invalid: {
      true: { borderColor: '#ef4444' },
      false: { borderColor: '#d1d5db' },
    },
  },
  defaultVariants: {
    invalid: false,
  },
});

input(); // "input-base input-invalid-false"
input({ invalid: true }); // "input-base input-invalid-true"
```

## Data and ARIA selectors inside recipes

Recipes use the same selector model as `styles.create`.

```ts
const accordionTrigger = styles.component('accordion-trigger', {
  base: {
    '&[data-state="open"]': { fontWeight: 600 },
    '&[aria-expanded="true"]': { color: '#1d4ed8' },
  },
});
```

## Migration quick-start

### Variant API

`styles.component` uses the `base`, `variants`, `compoundVariants`, and `defaultVariants` config shape.

```ts
// Before
const button = styles.component('button', {
  base: { padding: '8px 12px' },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb' },
      ghost: { backgroundColor: 'transparent' },
    },
  },
  defaultVariants: { intent: 'primary' },
});

// Single API
const button = styles.component('button', {
  base: { padding: '8px 12px' },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb' },
      ghost: { backgroundColor: 'transparent' },
    },
  },
  defaultVariants: { intent: 'primary' },
});
```

### From CVA

CVA config maps directly:

- `cva(base, { variants, compoundVariants, defaultVariants })`
- to `styles.component(name, { base, variants, compoundVariants, defaultVariants })`

The main difference is class generation/injection is handled by typestyles.

See the [Migration Guide](/docs/migration) for library-specific examples.

## Related docs

- [Styles](/docs/styles)
- [Migration Guide](/docs/migration)
- [Custom Selectors & At-Rules](/docs/custom-at-rules)
