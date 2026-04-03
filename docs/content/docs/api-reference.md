---
title: API Reference
description: Complete API reference for typestyles
---

# API Reference

Reference for the main typestyles APIs (kept in sync with the published package).

## Core Exports

### `styles`

Style creation and composition API.

**Methods:**

- `styles.component(namespace, config)`: Creates component styles (flat or dimensioned). Returns a CVA-style object that is both callable and destructurable.
- `styles.class(name, style)`: Creates a single registered class from one style object
- `styles.hashClass(styles, label?)`: Emits a hashed class from a style object (see [Class naming](/docs/class-naming))
- `styles.withUtils(utils)`: Returns utility-aware `component`, `class`, and `hashClass` helpers
- `styles.compose(...selectors)`: Combines multiple selector functions or class strings

### `cx`

Built-in class joining utility:

```ts
import { cx } from 'typestyles';

cx('class-a', isActive && 'class-b', undefined, 'class-c');
// "class-a class-b class-c" (falsy values are filtered out)
```

### Class naming

Global options for emitted class strings (used by `styles.component`, `styles.class`):

- `configureClassNaming(options)`: Set `mode` (`'semantic' | 'hashed' | 'atomic'`), optional `prefix`, optional `scopeId`
- `getClassNamingConfig()`: Read current config
- `resetClassNaming()`: Restore defaults (mainly for tests)

See [Class naming](/docs/class-naming).

### `tokens`

Design token API using CSS custom properties.

**Methods:**

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

### `color`

Type-safe helpers that return CSS color strings (`rgb`, `hsl`, `oklch`, `mix`, `alpha`, `lightDark`, etc.). See [Color](/docs/color).

### `cx(...parts)`

Joins class name parts into a single string, filtering out falsy values (`false`, `undefined`, `null`, `0`, `''`).

Use `cx` to combine TypeStyles classes with external class strings and conditional expressions.

```ts
import { cx, styles } from 'typestyles';

const card = styles.create('card', {
  base: { padding: '16px' },
  active: { borderColor: 'blue' },
});

cx(card('base'), isActive && card('active'), externalClassName);
// => "card-base card-active my-external-class"
```

### CSS variables (advanced)

- `createVar(name, fallback?)`, `assignVars(vars)`: Typed custom property helpers for advanced patterns

### Sheet and testing utilities

- `getRegisteredCss()`: Returns all CSS registered so far (useful with SSR or diagnostics)
- `reset()`, `flushSync()`, `ensureDocumentStylesAttached()`: Primarily for tests and advanced setup; see [Testing](/docs/testing)
- `insertRules(rules)`: Low-level rule insertion (mainly for library authors)

### `keyframes`

Keyframe animation API.

**Methods:**

- `keyframes.create(name, stops)`: Creates @keyframes animation

## Usage Examples

### Creating Component Styles (flat config)

```ts
import { styles } from 'typestyles';

const card = styles.component('card', {
  base: { padding: '16px', borderRadius: '8px' },
  elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
});

// Call as function (base auto-applied):
card();

// Destructure:
const { base, elevated } = card;
```

### Creating Component Styles (dimensioned config)

```ts
import { styles } from 'typestyles';

const button = styles.component('button', {
  base: { borderRadius: '8px' },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb', color: 'white' },
      ghost: { backgroundColor: 'transparent', color: '#111827' },
    },
  },
  defaultVariants: {
    intent: 'primary',
  },
});

button(); // "button-base button-intent-primary"
button({ intent: 'ghost' }); // "button-base button-intent-ghost"
```

### Joining Classes with cx()

```ts
import { cx } from 'typestyles';

const className = cx('base-class', isActive && 'active', isPrimary && 'primary');
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

### Composing Styles

```ts
import { styles } from 'typestyles';

const base = styles.component('base', {
  base: { padding: '8px' },
});

const primary = styles.component('primary', {
  base: { color: 'blue' },
});

const button = styles.compose(base, primary);
```

## @typestyles/props

Atomic CSS utility generator for type-safe utility classes.

### `defineProperties(config)`

Define a collection of CSS properties with allowed values.

```ts
import { defineProperties } from '@typestyles/props';

const utilities = defineProperties({
  conditions: {
    mobile: { '@media': '(min-width: 768px)' },
  },
  properties: {
    display: ['flex', 'block', 'grid'],
    padding: { 0: '0', 1: '4px', 2: '8px' },
  },
  shorthands: {
    p: ['padding'],
  },
});
```

### `createProps(namespace, ...collections)`

Generate atomic utility classes from property collections.

```ts
import { createProps } from '@typestyles/props';

const atoms = createProps('atom', utilities);

atoms({
  display: 'flex',
  padding: 2,
  p: { mobile: 1 },
});
// Returns: "atom-display-flex atom-padding-2 atom-p-mobile-1"
```

---

_Last reviewed: 2026-04-03_
