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

## Attribute-driven variants

Some design systems want variant state expressed as `data-*` attributes on the DOM (Radix/shadcn-style: one stable class, `data-variant`/`data-size` legible in the markup) rather than as discrete classes. Set `variantStrategy: 'attribute'` and each `variants` option compiles to a `&[data-{dimension}="{option}"]` selector scoped under the single `base` class, instead of its own class:

```ts
const button = styles.component('button', {
  base: { padding: '8px 16px', borderRadius: '6px' },
  variants: {
    variant: {
      primary: { backgroundColor: '#0066ff', color: '#fff' },
      secondary: { backgroundColor: '#6b7280', color: '#fff' },
    },
    size: {
      small: { fontSize: '14px' },
      large: { fontSize: '18px' },
    },
  },
  defaultVariants: { variant: 'primary', size: 'small' },
  variantStrategy: 'attribute',
});

const b = button({ variant: 'primary', size: 'small' });
b.className; // "button-base"
b.attrs; // { 'data-variant': 'primary', 'data-size': 'small' }
b.props; // { className: 'button-base', 'data-variant': 'primary', 'data-size': 'small' }

<button {...b.props}>...</button>;
// <button class="button-base" data-variant="primary" data-size="small">
```

`String(b)` / template-literal coercion and `cx(b, 'extra')` still return `"button-base"`, same as a plain class string.

Boolean dimensions (option keys exactly `{ true, false }`) are presence-based rather than value-matched: `true` compiles to `&[data-disabled]` and sets `data-disabled` with an empty value; `false` compiles to `&:not([data-disabled])` and omits the attribute entirely.

```ts
variants: {
  disabled: {
    true: { opacity: 0.5, cursor: 'not-allowed' },
    false: {},
  },
},
```

`compoundVariants` still work — each condition compiles to a single combined attribute selector (`.button-base[data-variant="primary"][data-size="large"]`) with no extra compound class and no runtime matching; an array of allowed values for one dimension (`{ tone: ['success', 'warning'], size: 'lg' }`) compiles to a `:is(...)` group ANDed with the rest of the condition.

Set `defaultVariantStrategy: 'attribute'` on `createStyles`/`createTypeStyles` to make this the default for every `styles.component` call from that instance, without repeating `variantStrategy` per component. A component can still opt back into class-based variants with `variantStrategy: 'class'`.

```ts
const { styles } = createTypeStyles({ defaultVariantStrategy: 'attribute', utils: {} });
```

**Trade-offs:**

- No per-option class hooks — `button['variant-primary']` doesn't exist in attribute mode, since there's no discrete class to expose. `button.base` still exposes the single base class.
- Only the plain dimensioned config (`base` / `variants` / `compoundVariants` / `defaultVariants`) supports `variantStrategy: 'attribute'` — not `slots` and not the flat (non-dimensioned) config shape.
- Attribute names are the dimension name verbatim (`data-{dimension}`), not kebab-cased. This matters only for multi-word camelCase dimension names (e.g. a dimension named `fontWeight` renders as `data-fontweight` in the DOM, since HTML lowercases attribute names on write) — it won't round-trip through `element.dataset.fontWeight`, which expects the kebab form `data-font-weight`. Single-word dimension names (`variant`, `size`, `tone`, `intent`) are unaffected.

## Migration quick-start

### From CVA

CVA config maps directly:

- `cva(base, { variants, compoundVariants, defaultVariants })`
- to `styles.component(name, { base, variants, compoundVariants, defaultVariants })`

The main difference is class generation/injection is handled by typestyles.

See the [Migration Guide](/docs/migration) for library-specific examples.

## Expose themeable properties as vars

If you expect a property to vary by theme region, expose it as a component-scoped CSS
custom property instead of hard-coding the value in `base` or variant styles. Token
and theme overrides then stay on [Tier 1](/docs/theming-patterns#tier-1--component-scoped-css-custom-properties-preferred)
and consumers rarely need plain class overrides or `@scope`.

```ts
const button = styles.component('button', (c) => {
  const v = c.vars({
    background: { value: '#fff', syntax: '<color>', inherits: false },
    foreground: { value: '#111', syntax: '<color>', inherits: false },
  });
  return {
    base: {
      backgroundColor: v.background.var,
      color: v.foreground.var,
    },
    variants: {
      intent: {
        primary: {
          [v.background.name]: '#0066ff',
          [v.foreground.name]: '#fff',
        },
      },
    },
  };
});
```

The [design-system example](/docs/design-system) uses this pattern throughout
(`examples/design-system/src/components/button.ts`).

## Responsive property values

Register breakpoints once on your styles instance, then use `{ base, md, lg }` shorthand on individual CSS properties instead of repeating full `@media` keys beside every property.

```ts
const { styles } = createTypeStyles({
  scopeId: 'app',
  breakpoints: {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
  },
});

const container = styles.component('container', {
  base: {
    width: '100%',
    paddingLeft: { base: '1rem', md: '1.5rem' },
    paddingRight: { base: '1rem', md: '1.5rem' },
    maxWidth: {
      base: '100%',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
});
```

This compiles to the same CSS you would write with explicit `'@media (min-width: …)'` object keys — one base declaration per property, plus nested `@media` blocks per breakpoint.

**Conventions:**

- `base` is the mobile-first default; `_` is an alias (Panda migration).
- Breakpoint values are media conditions **without** the `@media` wrapper — same strings as `@typestyles/props` `{ '@media': '(min-width: 640px)' }`.
- Values must be scalars (`string | number`); nested styles per breakpoint still use explicit `@media` keys.
- Responsive objects work in `styles.class`, `styles.component`, `styles.scope`, and `createTypeStyles({ breakpoints }).global.style` (or `createGlobal({ breakpoints }).style`). The root `global` export has no breakpoint registry — use a factory instance.

**Before (manual media keys):**

```ts
base: {
  padding: '1rem',
  '@media (min-width: 768px)': { padding: '1.5rem' },
  '@media (min-width: 1024px)': { padding: '2rem' },
}
```

**After:**

```ts
base: {
  padding: { base: '1rem', md: '1.5rem', lg: '2rem' },
}
```

For atomic utility props with responsive class names, use [`@typestyles/props`](/docs/atomic-css#responsive-conditions) — that system resolves to utility classes at runtime. Responsive property values are for declarative style objects that compile to plain CSS rules.

You can derive breakpoints from media tokens:

```ts
const { styles, tokens } = createTypeStyles({ scopeId: 'app' });
const media = tokens.create('media', {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
});

const stylesWithMedia = createStyles({
  scopeId: 'app',
  breakpoints: { fromTokens: media, lg: '(min-width: 1024px)' },
});
```

## Public class name stability

Semantic class names (`button-base`, `button-intent-primary`, …) are public API for
consumers theming your package. Do not rename namespaces or variant keys without a
major semver bump. Opt into snapshot + ESLint guardrails described in
[Publishing Packages — guard public class names](/docs/publishing-packages#guard-public-class-names).

## Related docs

- [Theming Patterns — component overrides](/docs/theming-patterns#component-overrides-two-tier-model)

- [Styles](/docs/styles)
- [Migration Guide](/docs/migration)
- [Custom Selectors & At-Rules](/docs/custom-at-rules)
