---
title: Tokens
description: Design tokens, mode-aware leaves, and theming with tokens.create and createTheme
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

TypeStyles offers several tiers for custom properties — from design tokens down to exact-name migration helpers. [Tokens](/docs/tokens) (`tokens.declare` / `tokens.create`) is the top rung for design systems; see [CSS primitives](/docs/css-primitives) for the full ladder and when to use `ctx.vars`, `styles.property`, or `typestyles/css`.

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

## Forward-referencing tokens (`tokens.declare`)

`tokens.create(namespace, values)` takes a single plain object, so nothing
inside `values` can reference the object being built — a semantic
`accent.subtle` built from `color-mix()` of `accent.default` can't refer to
`accent.default` from within the same `tokens.create('color', {...})` call.

`tokens.declare(namespace, schema, options?)` declares the namespace shape,
emits `@property` for schema leaves with `syntax`, and returns a typed
reference proxy you can use while building values — in the same namespace or
another one before it exists:

```ts
import { tokens } from 'typestyles';

const color = tokens.declare('color', {
  background: { app: { syntax: '<color>', inherits: false } },
  accent: {
    default: { syntax: '<color>', inherits: false },
    subtle: { syntax: '<color>', inherits: false },
  },
});

tokens.create(
  'color',
  {
    background: { app: '#0a0a0a' },
    accent: { default: '#0066ff' },
  },
  { decl: color },
);

tokens.create(
  'color',
  {
    accent: {
      subtle: `color-mix(in oklch, ${color.accent.default} 24%, ${color.background.app})`,
    },
  },
  { decl: color },
);
```

Schema leaves are either `{ syntax, inherits?, initial? }` (typed,
animatable — `@property` emitted at declare time with a placeholder
`initial-value`) or `true` (plain token path, no `@property`). `create()`
accepts plain `string | number` values only; pass `{ decl: color }` for
compile-time typing and dev-mode namespace alignment.

`declare()` is optional — simple namespaces can use `create()` alone with no
schema. When a namespace was declared, `create()` validates paths against the
merged schema in development. Multiple `create()` calls on the same namespace
deep-merge values.

**Cross-namespace / avoiding import cycles:**

```ts
// module-a.ts
import { tokens } from './runtime';
const colorFromB = tokens.declare('colorB', {
  accent: { syntax: '<color>', inherits: false },
});
export const colorA = tokens.create('colorA', {
  accent: `color-mix(in oklch, ${colorFromB.accent} 50%, black)`,
});

// module-b.ts — no import of module-a.ts needed
import { tokens } from './runtime';
const colorFromA = tokens.declare('colorA', {
  accent: { syntax: '<color>', inherits: false },
});
export const colorB = tokens.create('colorB', {
  accent: `color-mix(in oklch, ${colorFromA.accent} 50%, white)`,
});
```

Name resolution reuses the same logic `tokens.create` and `tokens.use` use
internally — including `scopeId` and any `nameTemplate`. If you pass a
`nameTemplate` to `declare()`, pass the **same** function reference to the
matching `create()` call (or omit it there to reuse the declared one);
passing a different one throws in development.

## Syntax-typed tokens

`tokens.declare()` is also the opt-in path for **compile-time syntax safety**. Schema
leaves with `syntax` (for example `{ syntax: '<color>', inherits: false }`) return
`SyntaxRef<'<color>'>` refs instead of plain `string`. TypeScript then checks:

- **`tokens.create(…, { decl })`** — a `<color>` path accepts plain `string | number`
  literals (you still set values like `'#0066ff'`), compatible `SyntaxRef` values, and
  mode-aware `{ light, dark }` leaves. Assigning a `SyntaxRef<'<length>'>` to a
  `<color>` path is a type error.
- **`styles()` / component styles** — when the value is a `SyntaxRef`, it must match the
  target CSS property (`color.bg` on `backgroundColor` ✓, on `width` ✗). Plain
  `string` literals are always allowed (escape hatch).
- **`tokens.use(decl)`** — preserves `SyntaxRef<S>` from the declared schema.

Plain `tokens.create()` **without** `declare` is unchanged: refs stay `string` and no
property checking applies. Strictness follows the value's type, not a global flag.

TypeScript does **not** validate that a literal string is a valid CSS color or length —
the schema declares the slot; literals are trusted. Strictness is about **ref
compatibility** (token-to-slot and ref-to-property), aligned with the `@property` rules
already emitted at declare time.

```ts
import { createTypeStyles } from 'typestyles';

const { styles, tokens } = createTypeStyles({ scopeId: 'app' });

const color = tokens.declare('color', {
  bg: { syntax: '<color>', inherits: false },
  text: { syntax: '<color>', inherits: false },
});

const space = tokens.declare('space', {
  md: { syntax: '<length>' },
});

tokens.create('color', { bg: '#0a0a0a', text: '#fafafa' }, { decl: color });

export const card = styles({
  backgroundColor: color.bg,
  color: color.text,
  padding: space.md,
});

// Type errors:
// styles({ width: color.bg })
// tokens.create('color', { bg: space.md }, { decl: color })
```

Supported syntax strings match [`atProperty`](/docs/api-reference#atproperty-presets) presets (`<color>`, `<length>`,
`<length-percentage>`, `<number>`, `<angle>`, `<time>`, …). `<length>` refs are
assignable where `<length-percentage>` is expected (for example `width` and `padding`).

Exported types: `SyntaxRef`, `CssSyntax`, `SyntaxRefAccepts`, `CreateValueForSyntax`,
`CompatibleSourceSyntax`, `SyntaxAwareLonghands`, `CSSPropertyValue`.

## Mode-aware token leaves

Register color modes once on your TypeStyles instance, then use `{ light, dark }` on **token
leaves** in `tokens.create()` and `tokens.createTheme()`. Compatible values (colors, images)
compile to `light-dark()` on `--*` custom properties; incompatible values (shadow shorthands,
lengths) keep the light value on the base rule and emit a dark-mode override rule.

```ts
import { colorModes, createTypeStyles } from 'typestyles';

const { tokens } = createTypeStyles({ scopeId: 'app', colorModes });

tokens.create('brand', {
  accent: { light: '#111827', dark: '#f9fafb' },
  glow: { light: '0 0 0 3px blue', dark: '0 0 16px navy' },
});
// --app-brand-accent: light-dark(#111827, #f9fafb);
// --app-brand-glow: 0 0 0 3px blue;
// + dark override rule for --app-brand-glow when dark mode is active
```

`colorModes` from `typestyles` is `['light', 'dark']`. **Array order** defines
`light-dark()` arguments: index `0` = light color-scheme, index `1` = dark — not inferred
from key names alone. v1 supports at most two registered modes.

Theme surfaces created while `colorModes` is configured also emit `color-scheme: light dark` on
the theme class so `light-dark()` resolves correctly in the subtree.

### Structured `colorMode` patches on themes

Pass light and dark token trees as **patches** on `createTheme` — TypeStyles deep-merges them
into `base` and compiles color-compatible leaves to `light-dark()`:

```ts
const light = { color: { text: { primary: '#111827' } } };
const dark = { color: { text: { primary: '#f9fafb' } } };

const acme = tokens.createTheme('acme', {
  base: light,
  colorMode: { light, dark },
});
// .theme-app-acme { color-scheme: light dark; --app-color-text-primary: light-dark(#111827, #f9fafb); }
```

You can supply only one side — for example `colorMode: { dark }` when `base` already holds the
light values. Mode-aware leaves are also valid directly on `base`:

```ts
tokens.createTheme('leaf', {
  base: {
    color: {
      accent: { default: { light: '#111', dark: '#eee' } },
    },
  },
});
```

`colorMode` patches can be combined with manual `modes` layers (for example a shadow-only dark
layer under `tokens.when.prefersDark`).

### Preset mode layers (`tokens.colorMode.*`)

Preset helpers (`mediaOnly`, `attributeOnly`, `mediaOrAttribute`,
`systemWithLightDarkOverride`) return `ThemeModeDefinition[]` arrays. Pass them via **`modes`**
(spread or assign), not the `colorMode` config field:

```ts
const light = { color: { text: '#111', surface: '#fff' } };
const dark = { color: { text: '#eee', surface: '#111' } };

const shell = tokens.createTheme('shell', {
  base: light,
  modes: tokens.colorMode.systemWithLightDarkOverride({
    attribute: 'data-color-mode',
    values: { light: 'light', dark: 'dark', system: 'system' },
    scope: 'ancestor',
    light,
    dark,
  }),
});
```

See [Theming patterns](/docs/theming-patterns) for end-to-end examples with `data-mode`,
multi-brand palettes, and condition scopes.

`colorMode` on `createTheme` and `tokens.colorMode.*` presets solve different problems:
**structured patches** compile static light/dark token values into `light-dark()` on the theme
surface; **presets** emit conditional override rules when appearance should follow media queries
or attribute toggles.

## Theming

Use `tokens.createTheme(name, config)` to register a **theme surface**: a class `theme-{name}` whose custom properties override token values for that subtree.

- **`base`** — Overrides always applied on the surface (typical light / default brand).
- **`colorMode`** — Optional `{ light?, dark? }` patches deep-merged into `base` and compiled to `light-dark()` when `colorModes` is configured (see [Mode-aware token leaves](#mode-aware-token-leaves)).
- **`modes`** — Conditional layers with explicit `tokens.when.*` conditions, including spreads of `tokens.colorMode.*` preset arrays.

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

**Light/dark patches compiled to `light-dark()`:**

```ts
const light = { color: { text: '#111', surface: '#fff' } };
const dark = { color: { text: '#eee', surface: '#111' } };

const brand = tokens.createTheme('brand', {
  base: light,
  colorMode: { light, dark },
});
```

Condition primitives: `tokens.when.media`, `prefersDark`, `attr`, `className`, `selector`, `and`, `or`, `not`. `attr` and `className` take a `scope` of `'self'`, `'ancestor'`, or `'descendant'` describing where the marker lives relative to the theme root (see [Theming patterns](/docs/theming-patterns#condition-scopes-self-ancestor-descendant)).

See [Theming patterns](/docs/theming-patterns) for preset mode layers, multi-brand setups, and component overrides.

## Interop with DTCG and Style Dictionary

If your tokens originate in Figma, Tokens Studio, or another design tool that emits the **W3C Design Tokens Community Group (DTCG)** JSON format, use **Style Dictionary** as a build step that emits a plain TypeScript primitives module — then feed that module into `tokens.create(…)` here. See [Style Dictionary & W3C tokens](/docs/style-dictionary) for the full pipeline in both directions.
