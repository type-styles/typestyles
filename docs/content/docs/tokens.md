---
title: Tokens
description: Design tokens and theming with tokens.create, createTheme, and color modes
---

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

To share a **cascade layer** stack with styles, use **`createTypeStyles`** or pass **`layers`** and **`tokenLayer`** to `createTokens` (see [Cascade layers](/docs/cascade-layers)).

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

When you use **`createTypeStyles({ scopeId: 'app' })`**, the same `tokens` instance emits scoped names (for example `--app-space-md`). Add new namespaces in any module that imports `tokens` from your shared `./typestyles` module:

```ts
import { tokens } from './typestyles';

export const space = tokens.create('space', {
  sm: '8px',
  md: '16px',
});

// With scopeId 'app': padding: space.md  →  var(--app-space-md)
```

## Custom CSS variable names (`nameTemplate`)

The default naming pattern (`--{scopeId}-{namespace}-{path}`) is recommended for greenfield TypeStyles apps. When migrating from an existing CSS variable system, matching Style Dictionary output, or aliasing across namespaces, pass an optional **`nameTemplate`** function to control emitted `--*` names while keeping typed `var(--…)` references and theme integration.

```ts
const tokens = createTokens({ scopeId: 'acme' });

const primitive = tokens.create('color', palette, {
  nameTemplate: ({ segments }) => `--color-${segments.join('-')}`,
});
// --color-brand-500 (no acme- prefix on these vars)

const semantic = tokens.create(
  'semantic-color',
  {
    text: { primary: primitive.brand[500] },
  },
  {
    nameTemplate: ({ path }) => `--ds-color-${path}`,
  },
);
// --ds-color-text-primary: var(--color-brand-500)
```

Set a default on the instance with `createTokens({ nameTemplate })`, or override per namespace in `tokens.create(…, { nameTemplate })`. Templates receive `scopeId`, `scope`, `namespace`, flattened `path`, and `segments` (object keys at each nesting level — use `segments` when your external spec uses a different joiner than `-`).

**Migration notes:**

- Omitting `scopeId` from a custom template restores cross-package collision risk — keep `scopeId` on **classes** even when vars match global names.
- Theme overrides use the same names registered at `tokens.create` time; renaming a template after shipping is a breaking change for plain CSS targeting `--*`.
- Do not let Style Dictionary emit `:root` CSS — TypeStyles remains the single injector. Mirror SD naming via `nameTemplate` instead.

See [Style Dictionary & W3C tokens](/docs/style-dictionary#matching-external-css-names) for pipeline examples.

## Referencing tokens defined elsewhere

When tokens are created in another module or package, use `tokens.use(namespace)` to get the same `var(--namespace-key)` references **without** emitting another `:root` rule. The namespace must already be registered (via `tokens.create`) before those variables exist in CSS.

### Type inference (cross-package)

`tokens.create()` returns a branded ref. Pass that ref to `tokens.use()` so consumers get the same typed shape without duplicating a manual generic:

```ts
// design-system/tokens.ts
export const space = tokens.create('space', { sm: '8px', md: '16px' });

// app/styles.ts
import { space as spaceTokens } from '@acme/design-system';
const space = tokens.use(spaceTokens);
space.md; // string — typed as var(--space-md)
```

For string-only lookups inside one package, declare a registry on `createTokens<Registry>()`:

```ts
type DesignTokens = {
  space: { sm: '8px'; md: '16px' };
  color: { primary: '#0066ff' };
};

const tokens = createTokens<DesignTokens>();
const space = tokens.use('space'); // typed from Registry
```

Export `InferTokenValues<typeof created>` when consumers must reference tokens by namespace string.

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

Other presets: `tokens.colorMode.mediaOnly`, `attributeOnly`, `mediaOrAttribute`. Condition primitives: `tokens.when.media`, `prefersDark`, `attr`, `className`, `selector`, `and`, `or`, `not`. `attr` and `className` take a `scope` of `'self'`, `'ancestor'`, or `'descendant'` describing where the marker lives relative to the theme root (see [Theming patterns](/docs/theming-patterns#condition-scopes-self-ancestor-descendant)).

See [Theming patterns](/docs/theming-patterns) for end-to-end examples.

## Interop with DTCG and Style Dictionary

If your tokens originate in Figma, Tokens Studio, or another design tool that emits the **W3C Design Tokens Community Group (DTCG)** JSON format, use **Style Dictionary** as a build step that emits a plain TypeScript primitives module — then feed that module into `tokens.create(…)` here. See [Style Dictionary & W3C tokens](/docs/style-dictionary) for the full pipeline in both directions.
