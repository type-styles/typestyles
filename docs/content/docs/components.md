---
title: Components
description: Build typed variant APIs with styles.component
---

`styles.component()` is the first-class API for variant-driven component styling.

`styles.component()` is the unified API for all component styling. For flat configs (no dimensioned `variants`), see [Styles](/docs/styles).

Use the dimensioned config when you want a typed interface with:

- `base` styles
- `variants` dimensions
- `compoundVariants` for combinations
- `defaultVariants`

## Basic component

The live example defines a dimensioned `button` with `intent` and `size` variants, then shows how to call it. Class strings follow the global [class naming](/docs/class-naming) configuration (`semantic` by default).

<!-- doc-live-demo id="components-variants" -->

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

## Multipart `slots`

Pass a `slots` array for components with multiple parts (for example root, trigger, and panel). `base`, `variants`, `compoundVariants`, and `defaultVariants` can each target specific slot keys.

TypeScript infers each slot name from the array literal, so the return value is typed with those keys (for example `tabs.root`, `tabs.trigger`) and unknown keys are errors. You do not need `as const` on `slots` when you pass an inline array inside `styles.component(...)`.

```ts
const tabs = styles.component('tabs', {
  slots: ['root', 'trigger', 'content'],
  base: {
    root: { display: 'grid' },
    trigger: { cursor: 'pointer' },
  },
  variants: {
    size: {
      sm: {
        trigger: { fontSize: '12px' },
        content: { padding: '8px' },
      },
      lg: {
        trigger: { fontSize: '16px' },
        content: { padding: '12px' },
      },
    },
  },
  defaultVariants: { size: 'sm' },
});

const c = tabs();
c.root; // class string for the root element
c.trigger;
c.content;
```

## Data and ARIA selectors

`styles.component` supports all CSS selectors:

```ts
const accordionTrigger = styles.component('accordion-trigger', {
  base: {
    '&[data-state="open"]': { fontWeight: 600 },
    '&[aria-expanded="true"]': { color: '#1d4ed8' },
  },
});
```

## Class names are a public contract

In `semantic` naming mode (the default), the class names `styles.component()` and `styles.class()` emit are a direct function of the string literals you write: `styles.component('button', { variants: { intent: { primary: … } } })` always produces `button-base`, `button-intent-primary`, and so on. Once your package ships, those names — and their pseudo-selectors — are **stable public API**: consumers are entitled to target them with plain CSS or [`styles.scope()`](/docs/theming-patterns#overriding-component-styles-from-a-theme), and renaming a namespace or a variant key is a breaking change under your normal versioning rules.

Two consequences for component authors:

1. **If you expect a property to vary per theme, expose it as a var.** A component-scoped custom property (`ctx.vars({ … })` in a function config — see [Dynamic styles](/docs/dynamic-styles)) is the one override surface that is proximity-correct in nested themes for free — consumers who theme through your vars never need `@scope`, a cascade layer, or any tooling. Save class-name overrides for what you didn't anticipate.
2. **Defend the names deliberately.** TypeScript won't catch a renamed string literal (no call site breaks), so publishable packages can enable the opt-in [`@typestyles/no-removed-public-classname`](/docs/publishing-packages#eslint-enforcement) ESLint rule, which errors when a shipped class name disappears until the rename is acknowledged with a snapshot update and a changeset.

See [Theming Patterns → Overriding component styles](/docs/theming-patterns#overriding-component-styles-from-a-theme) for the consumer-side decision guide.

## Migration quick-start

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
