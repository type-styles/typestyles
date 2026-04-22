---
title: Styles
description: Create and compose style variants with styles.component
---

The `styles` API lets you define named style variants and compose them at the call site.

`styles.component()` is the unified API for creating component styles. It supports both **flat** configs (simple named variants) and **dimensioned** configs (typed `variants`, `compoundVariants`, `defaultVariants`). For the full dimensioned variant API, see [Components](/docs/components).

## How TypeStyles runs

1. **Registration** — When your module loads, definitions are registered. Nothing paints until a class is actually used.
2. **First use** — The first time a returned class name is applied, TypeStyles injects the rules into a managed `<style>` tag (lazy injection, batched for performance).
3. **Stable names** — Class strings are deterministic from your namespace and variant keys, which keeps SSR and tests predictable when [collection APIs](/docs/ssr) wrap your render.
4. **Production** — You can keep this model, or switch to extracted CSS and a no-op runtime via the [zero-runtime](/docs/zero-runtime) path when you are ready.

## Choosing an API

| You want to…                                                            | Use                                     | Why                                                                                         |
| ----------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Style a component with base + flat toggles (`elevated`, `compact`)      | `styles.component` (flat config)        | Small surface area; base applies automatically when you call the function.                  |
| Build typed variant axes (`intent`, `size`) with defaults and compounds | `styles.component` (dimensioned config) | First-class variant model: `variants`, `compoundVariants`, `defaultVariants`.               |
| One reusable class from a single style object                           | `styles.class`                          | One class string, no variant machinery.                                                     |
| Merge several style groups                                              | `styles.compose`                        | Reuse groups without repeating objects.                                                     |
| Join class names conditionally                                          | `cx()` from `'typestyles'`              | Filters falsy values; pairs well with props from parents (not tied to a `styles` instance). |

**Practical default:** one [`createTypeStyles`](/docs/api-reference#createtypestyles-options) module per app or package; then use `styles.component` for UI components, `styles.class` for one-off utilities, and `import { cx } from 'typestyles'` when you merge external `className` strings.

## Creating styles (flat config)

Call `styles.component(namespace, definitions)` with a unique namespace and an object of variant names to style definitions:

```ts
import { styles } from 'typestyles';

const card = styles.component('card', {
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

The returned object is both **callable** and **destructurable**:

```ts
// Call as a function -- base styles are always auto-applied:
card(); // "card-base" (flat variants are opt-in via the call or `defaultVariants`)

// Destructure for direct class access:
const { base, elevated } = card;
// base => "card-base"
// elevated => "card-elevated"
```

Class names are deterministic: `card-base`, `card-elevated`.

To use **hashed** or **hash-only** class strings instead (for example in a design system package), see [Class naming](/docs/class-naming).

## Creating styles (dimensioned config)

For typed variant dimensions, use the full variant config:

```ts
const button = styles.component('button', {
  base: { padding: '8px 16px', borderRadius: '6px' },
  variants: {
    intent: {
      primary: { backgroundColor: '#0066ff', color: '#fff' },
      secondary: { backgroundColor: '#6b7280', color: '#fff' },
    },
    size: {
      sm: { fontSize: '14px' },
      lg: { fontSize: '18px' },
    },
  },
  defaultVariants: { intent: 'primary', size: 'sm' },
});

// Base styles auto-applied; pass variant overrides:
button(); // base + primary + sm
button({ intent: 'secondary' }); // base + secondary + sm
button({ size: 'lg' }); // base + primary + lg
```

See [Components](/docs/components) for `compoundVariants`, boolean variants, and multipart `slots`.

## Selectors

Use the `&` prefix for pseudo-classes and nested selectors, just like in CSS:

```ts
const button = styles.component('button', {
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
const trigger = styles.component('trigger', {
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

### `:has()`, `:is()`, and `:where()` helpers

For grouped or low-specificity pseudos, use **`styles.has`**, **`styles.is`**, and **`styles.where`** (or import `has`, `is`, `where` from `typestyles`). They mirror the ergonomics of **`styles.container()`** for container queries: small builders that return `&`-prefixed keys and infer **literal** templates from your arguments, so you can mix them with ordinary properties without `as CSSProperties`.

```ts
const nav = styles.class('nav', {
  display: 'flex',
  [styles.where('.nav')]: { gap: '8px' },
  [styles.has('.active')]: { borderBottom: '2px solid blue' },
  [styles.is(':hover', ':focus-visible')]: { outline: '2px solid dodgerblue' },
});
```

`:where()` is especially useful for design-system defaults (zero specificity). See [Custom selectors & at-rules](/docs/custom-at-rules) for TypeScript notes and more examples.

## Composing styles

Use `styles.compose()` to combine multiple component style functions or class strings:

```ts
const base = styles.component('base', {
  base: { padding: '8px', borderRadius: '4px' },
});

const primary = styles.component('primary', {
  base: { backgroundColor: '#0066ff', color: 'white' },
});

const button = styles.compose(base, primary);
```

See the [Style Composition](/docs/compose) guide for more details.

## Joining classes with cx()

Use the built-in `cx()` utility to conditionally join class strings:

```ts
import { styles, cx } from 'typestyles';

const card = styles.component('card', {
  base: { padding: '16px' },
  elevated: { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
});

const { base, elevated } = card;

// Conditionally join classes:
cx(base, isElevated && elevated, customClassName);
```

## Utility shortcuts

Define reusable shorthand properties (similar to Stitches `utils`) on your **`createStyles`** instance so class names, scope, and layers stay on one API — no global registration.

```ts
import { createStyles } from 'typestyles';

const styles = createStyles({
  scopeId: 'my-app',
  utils: {
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
  },
});

const avatar = styles.class('avatar', {
  size: 40,
  marginX: 8,
});

const button = styles.component('button', {
  base: { paddingY: 8 },
  compact: { paddingY: 4 },
});
```

The returned API is utility-aware (`class`, `hashClass`, `component` accept your utility keys). If you already use the default `import { styles } from 'typestyles'`, you can instead call **`styles.withUtils({ … })`** to get the same behavior from a second object — prefer **`createStyles({ utils })`** when you want a single exported styles instance.

Utility keys are fully typed from your utility definitions and can be mixed with normal CSS properties.

## Composing with tokens

Use token references (e.g. from `tokens.create()`) in your style values. They compile to `var(--name-key)` and work with themes.

If you are migrating from CVA, Stitches, or vanilla-extract recipes, see [Migration Guide](/docs/migration).
