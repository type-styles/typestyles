---
title: API Reference
description: Complete API reference for typestyles
---

# API Reference

Auto-generated documentation for all typestyles APIs.

## Core Exports

### `styles`

Default style API (semantic class names, empty `scopeId`). Prefer `createStyles({ scopeId, mode, prefix })`
per package or micro-frontend for isolation.

**Methods:**

- `styles.component(namespace, config)`: Create multi-variant component styles (CVA-style)
- `styles.class(name, properties)`: Create a single class
- `styles.hashClass(properties, label?)`: Create a deterministic hashed class
- `styles.compose(...fns)`: Compose multiple style functions
- `styles.withUtils(utils)`: Create utility-aware styles API
- `styles.classNaming`: Read-only resolved naming config for the default `styles` instance

### `createStyles(options?)`

Returns a new style API (same shape as `styles`) with its own class naming config. Pass `Partial<ClassNamingConfig>`: `mode` (`'semantic' | 'hashed' | 'atomic'`), `prefix`, `scopeId`. Use one instance per package or micro-frontend.

The default `import { styles } from 'typestyles'` is `createStyles()` with default options.

### `tokens`

Default token API (unscoped custom properties). Prefer `createTokens({ scopeId })` when multiple
bundles share a page.

**Methods:**

- `tokens.create(namespace, values)`: Creates CSS custom properties
- `tokens.use(namespace)`: References existing tokens
- `tokens.createTheme(name, config)`: Registers a theme class that overrides token custom properties
- `tokens.createDarkMode(name, darkOverrides)`: Shorthand theme with a single dark `@media` branch
- `tokens.when` / `tokens.colorMode`: Condition helpers for themes
- `tokens.scopeId`: The scope passed to `createTokens`, if any

### `createTokens(options?)`

Returns a token + theme API bound to an optional `scopeId`. When set, `tokens.create('color', …)` emits `--{scopeId}-color-*` variables and `tokens.createTheme('dark', …)` registers `.theme-{scopeId}-dark` (sanitized segments).

The default `import { tokens } from 'typestyles'` is `createTokens()` (no scope).

### `keyframes`

Keyframe animation API.

**Methods:**

- `keyframes.create(name, stops)`: Creates @keyframes animation

### `color`

Type-safe CSS color function helpers.
Each function returns a plain CSS color string — no runtime color math.
Composes naturally with token references.

**Functions:**

- `color.rgb(r, g, b, alpha?)`: RGB color
- `color.hsl(h, s, l, alpha?)`: HSL color
- `color.oklch(l, c, h, alpha?)`: OKLCH color
- `color.oklab(l, a, b, alpha?)`: OKLAB color
- `color.lab(l, a, b, alpha?)`: LAB color
- `color.lch(l, c, h, alpha?)`: LCH color
- `color.hwb(h, w, b, alpha?)`: HWB color
- `color.mix(c1, c2, p?, space?)`: Mix two colors
- `color.lightDark(light, dark)`: Light/dark mode color
- `color.alpha(color, opacity, space?)`: Adjust opacity

See [Color](/docs/color).
- `tokens.create(namespace, values)`: Registers tokens on `:root` and returns `var(--namespace-key)` references
- `tokens.use(namespace)`: Returns `var(--namespace-key)` references without emitting CSS (for shared tokens defined elsewhere)
- `tokens.createTheme(name, config)`: Registers a `.theme-{name}` surface with optional `base`, and either `modes` or `colorMode` (not both). Returns a **`ThemeSurface`** (`className`, `name`, string coercion)—use `.className` in React
- `tokens.createDarkMode(name, darkOverrides)`: Shorthand for a single dark mode layer under `prefers-color-scheme: dark`
- `tokens.when`: Condition builders (`media`, `prefersDark`, `prefersLight`, `attr`, `className`, `selector`, `and`, `or`, `not`) for manual `modes`
- `tokens.colorMode`: Presets (`mediaOnly`, `attributeOnly`, `mediaOrAttribute`, `systemWithLightDarkOverride`) that expand to `modes`—pass as `colorMode` on `createTheme`

### `global`

Global CSS helpers (not scoped to a component class):

- `global.style(selector, styles)`: Insert rules for an arbitrary selector
- `global.fontFace(family, props)`: Register `@font-face`

### `cx(...parts)`

Joins class name parts into a single string, filtering out falsy values (`false`, `undefined`, `null`, `0`, `''`).

Use `cx` to combine TypeStyles classes with external class strings and conditional expressions.

```ts
import { cx, styles } from 'typestyles';

const card = styles.component('card', {
  base: { padding: '16px' },
  elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
});

cx(card('base'), isElevated && card('elevated'), externalClassName);
```

### CSS variables (advanced)

- `createVar(name, fallback?)`, `assignVars(vars)`: Typed custom property helpers for advanced patterns

### Sheet and testing utilities

- `getRegisteredCss()`: Returns all CSS registered so far (useful with SSR or diagnostics)
- `reset()`, `flushSync()`, `ensureDocumentStylesAttached()`: Primarily for tests and advanced setup; see [Testing](/docs/testing)
- `insertRules(rules)`: Low-level rule insertion (mainly for library authors)

### Class naming helpers

- `mergeClassNaming(partial?)`: Build a full `ClassNamingConfig` from partial options
- `defaultClassNamingConfig`: Default `mode`, `prefix`, and `scopeId`
- `scopedTokenNamespace(scopeId, logicalNamespace)`: CSS variable namespace segment for scoped token instances

See [Class naming](/docs/class-naming).

## Usage Examples

### Creating Styles

```ts
import { styles } from 'typestyles';

const button = styles.component('button', {
  base: { padding: '8px 16px' },
  variants: {
    intent: { primary: { backgroundColor: '#0066ff' } },
  },
  defaultVariants: { intent: 'primary' },
});

button(); // "button-base button-intent-primary"
button({ intent: 'primary' }); // same
const { base } = button; // destructure class strings
```

### Creating Tokens

```ts
import { tokens } from 'typestyles';

const color = tokens.create('color', {
  primary: '#0066ff',
  secondary: '#6b7280',
});

color.primary; // "var(--color-primary)"
```

### Scoped instances (libraries / micro-frontends)

```ts
import { createStyles, createTokens } from 'typestyles';

export const styles = createStyles({ scopeId: 'my-ds', mode: 'hashed', prefix: 'ds' });
export const tokens = createTokens({ scopeId: 'my-ds' });
```

### Creating Animations

```ts
import { keyframes } from 'typestyles';

const fadeIn = keyframes.create('fadeIn', {
  from: { opacity: 0 },
  to: { opacity: 1 },
});

// Use in styles
animation: `${fadeIn} 300ms ease`;
```

---

_This API reference was auto-generated from source code._
_Last updated: 2026-04-04_
