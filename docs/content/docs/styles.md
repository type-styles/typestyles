---
title: Styles
description: Create and compose style variants with styles.create
---

# Styles

The `styles` API lets you define named style variants and compose them at the call site.

For typed variant dimensions (`variants`, `compoundVariants`, `defaultVariants`), see [Recipes](/docs/recipes).

Use `styles.create` when your variants are a flat list of class names. If your component API is dimensioned (like `intent`, `size`, `tone`), use [Recipes](/docs/recipes).

## Creating styles

Call `styles.create(namespace, definitions)` with a unique namespace and an object of variant names to style definitions:

```ts
import { styles } from 'typestyles';

const card = styles.create('card', {
  base: {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
  },
  elevated: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
});
```

Class names are deterministic: `card-base`, `card-elevated`. Combine variants by passing multiple names to the selector function:

```ts
card('base', 'elevated'); // "card-base card-elevated"
```

## Selectors

Use the `&` prefix for pseudo-classes and nested selectors, just like in CSS:

```ts
const button = styles.create('button', {
  base: {
    padding: '8px 16px',
    '&:hover': { opacity: 0.9 },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});
```

### Data and ARIA attribute selectors

Attribute selectors work with `&`-prefixed nested selectors, including all CSS attribute selector operators:

```ts
const trigger = styles.create('trigger', {
  base: {
    // exact match
    '&[data-state="open"]': { opacity: 1 },

    // starts with / ends with / contains
    '&[data-side^="top"]': { marginTop: '4px' },
    '&[data-size$="-lg"]': { padding: '12px' },
    '&[data-name*="admin"]': { fontWeight: 700 },

    // whitespace-separated token / language-style match
    '&[data-flags~="selected"]': { borderStyle: 'solid' },
    '&[lang|="en"]': { fontFamily: 'system-ui' },

    // accessibility state hooks
    '&[aria-expanded="true"]': { backgroundColor: '#1d4ed8' },
    '&[aria-selected="true"]': { color: 'white' },
  },
});
```

## Composing styles

Use `styles.compose()` to combine multiple selector functions or class strings:

```ts
const base = styles.create('base', {
  root: { padding: '8px', borderRadius: '4px' },
});

const primary = styles.create('primary', {
  root: { backgroundColor: '#0066ff', color: 'white' },
});

const button = styles.compose(base, primary);
button('root'); // "base-root primary-root"
```

See the [Style Composition](/docs/compose) guide for more details.

## Utility shortcuts

Use `styles.withUtils()` to define reusable shorthand properties (similar to Stitches `utils`).

```ts
import { styles } from 'typestyles';

const s = styles.withUtils({
  marginX: (value: string | number) => ({
    marginLeft: value,
    marginRight: value,
  }),
  paddingY: (value: string | number) => ({
    paddingTop: value,
    paddingBottom: value,
  }),
  size: (value: string | number) => ({
    width: value,
    height: value,
  }),
});

const avatar = s.class('avatar', {
  size: 40,
  marginX: 8,
});

const button = s.create('button', {
  base: { paddingY: 8 },
  compact: { paddingY: 4 },
});
```

Utility keys are fully typed from your utility definitions and can be mixed with normal CSS properties.

## Composing with tokens

Use token references (e.g. from `tokens.create()`) in your style values. They compile to `var(--name-key)` and work with themes.

If you are migrating from CVA, Stitches, or vanilla-extract recipes, see [Migration Guide](/docs/migration).
