---
title: API Reference
description: Complete API reference for typestyles
---

# API Reference

Auto-generated documentation for all typestyles APIs.

## Core Exports

### `styles`

Style creation and composition API.

**Methods:**

- `styles.create(namespace, definitions)`: Creates style variants
- `styles.withUtils(utils)`: Returns utility-aware `create`, `class`, and `hashClass` helpers
- `styles.compose(...selectors)`: Combines multiple selector functions or class strings
- `styles.component(namespace, config)`: Creates variant-based component styles


### `tokens`

Design token API using CSS custom properties.

**Methods:**

- `tokens.create(namespace, values)`: Creates CSS custom properties
- `tokens.use(namespace)`: References existing tokens
- `tokens.createTheme(name, overrides)`: Creates theme class

### `keyframes`

Keyframe animation API.

**Methods:**

- `keyframes.create(name, stops)`: Creates @keyframes animation

## Usage Examples

### Creating Styles

```ts
import { styles } from 'typestyles';

const button = styles.create('button', {
  base: { padding: '8px 16px' },
  primary: { backgroundColor: '#0066ff' },
});

button('base', 'primary'); // "button-base button-primary"
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
animation: `${fadeIn} 300ms ease`
```

### Composing Styles

```ts
import { styles } from 'typestyles';

const base = styles.create('base', {
  root: { padding: '8px' },
});

const primary = styles.create('primary', {
  root: { color: 'blue' },
});

const button = styles.compose(base, primary);
button('root'); // "base-root primary-root"
```

### Creating Variant Components

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

*This API reference was auto-generated from source code.*
*Last updated: 2026-02-15*
