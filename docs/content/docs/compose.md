---
title: Style Composition
description: Combine multiple style functions and class strings with styles.compose
---

# Style Composition

The `styles.compose()` function lets you merge multiple component style functions or class name strings into a single reusable function.

## Basic Usage

Combine multiple style groups into one:

```ts
import { styles } from 'typestyles';

const base = styles.component('base', {
  base: { padding: '8px', borderRadius: '4px' },
});

const primary = styles.component('primary', {
  base: { backgroundColor: '#0066ff', color: 'white' },
});

const button = styles.compose(base, primary);
```

## Composing with Static Classes

Mix component style functions with static class strings:

```ts
const card = styles.component('card', {
  base: { padding: '16px', borderRadius: '8px' },
});

const composed = styles.compose(card, 'shadow-lg', 'hover:scale-105');
```

## Conditional Composition

Use falsy values for conditional composition:

```ts
import { cx } from 'typestyles';

const base = styles.component('base', {
  base: { padding: '8px' },
});

const elevated = styles.component('elevated', {
  base: { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
});

const isElevated = true;
const isDark = false;

const composed = styles.compose(base, isElevated && elevated, isDark && 'dark-mode');
```

You can also use `cx()` to conditionally join class strings from destructured components:

```ts
const { base } = styles.component('card', {
  base: { padding: '16px' },
  elevated: { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
});

cx(base, isElevated && elevated);
```

## Overlapping Variants

When multiple style groups share the same base styles, all matching classes are applied:

```ts
const layout = styles.component('layout', {
  base: { display: 'flex' },
});

const spacing = styles.component('spacing', {
  base: { gap: '8px' },
});

const composed = styles.compose(layout, spacing);
```

This is useful for layering different concerns (layout, spacing, colors) while keeping styles semantic.

## Composition with Atomic Utilities

Combine component styles with atomic utilities from `@typestyles/props`:

```ts
import { styles } from 'typestyles';
import { createProps, defineProperties } from '@typestyles/props';

const atoms = createProps(
  'atom',
  defineProperties({
    properties: {
      display: ['flex', 'block', 'grid'],
      gap: { 0: '0', 1: '4px', 2: '8px', 3: '16px' },
    },
  }),
);

const card = styles.component('card', {
  base: { borderRadius: '8px', border: '1px solid #e5e5e5' },
});

// Compose component styles with atomic utilities
const flexCard = styles.compose(card, atoms({ display: 'flex', gap: 2 }));
```

## Use Cases

### Component Inheritance

Create base components and extend them:

```ts
const baseButton = styles.component('btn-base', {
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    border: 'none',
  },
});

const primaryButton = styles.compose(
  baseButton,
  styles.component('btn-primary', {
    base: { backgroundColor: '#0066ff', color: 'white' },
  }),
);

const secondaryButton = styles.compose(
  baseButton,
  styles.component('btn-secondary', {
    base: { backgroundColor: '#e5e7eb', color: '#1f2937' },
  }),
);
```

### Utility-First Patterns

Build components with a mix of custom styles and utilities:

```ts
const customCard = styles.component('custom-card', {
  base: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
});

const featureCard = styles.compose(customCard, atoms({ padding: 3, borderRadius: 2 }));
```

### Multi-Layer Composition

Compose multiple concerns separately:

```ts
const layout = styles.component('layout', { base: { maxWidth: '1200px' } });
const spacing = styles.component('spacing', { base: { padding: '0 16px' } });
const responsive = styles.component('responsive', {
  base: {
    '@media (max-width: 768px)': { padding: '0 8px' },
  },
});

const container = styles.compose(layout, spacing, responsive);
```

## Type Safety

The composed function maintains full type safety. The return from `styles.compose` works with the new `styles.component` returns that are both callable and destructurable.

```ts
const a = styles.component('a', {
  base: { color: 'red' },
});

const b = styles.component('b', {
  base: { color: 'blue' },
});

const composed = styles.compose(a, b);
```

Note: TypeScript won't prevent you from passing variant names that don't exist in all composed functions. At runtime, each function will only generate classes for variants it knows about.
