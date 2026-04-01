---
title: Style Composition
description: Combine multiple style functions and class strings with styles.compose
---

# Style Composition

The `styles.compose()` function lets you merge multiple selector functions or class name strings into a single reusable function.

## Basic Usage

Combine multiple style groups into one:

```ts
import { styles } from 'typestyles';

const base = styles.create('base', {
  root: { padding: '8px', borderRadius: '4px' },
});

const primary = styles.create('primary', {
  root: { backgroundColor: '#0066ff', color: 'white' },
});

const button = styles.compose(base, primary);

button('root'); // "base-root primary-root"
```

## Composing with Static Classes

Mix selector functions with static class strings:

```ts
const card = styles.create('card', {
  base: { padding: '16px', borderRadius: '8px' },
});

const composed = styles.compose(card, 'shadow-lg', 'hover:scale-105');

composed('base'); // "card-base shadow-lg hover:scale-105"
```

## Conditional Composition

Use falsy values for conditional composition:

```ts
const base = styles.create('base', {
  root: { padding: '8px' },
});

const elevated = styles.create('elevated', {
  root: { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
});

const isElevated = true;
const isDark = false;

const composed = styles.compose(base, isElevated && elevated, isDark && 'dark-mode');

composed('root'); // "base-root elevated-root"
```

## Overlapping Variants

When multiple style groups share the same variant names, all matching classes are applied:

```ts
const layout = styles.create('layout', {
  flex: { display: 'flex' },
  block: { display: 'block' },
});

const spacing = styles.create('spacing', {
  flex: { gap: '8px' },
  block: { marginBottom: '8px' },
});

const composed = styles.compose(layout, spacing);

composed('flex'); // "layout-flex spacing-flex"
composed('block'); // "layout-block spacing-block"
```

This is useful for layering different concerns (layout, spacing, colors) while keeping variant names semantic.

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

const card = styles.create('card', {
  base: { borderRadius: '8px', border: '1px solid #e5e5e5' },
});

// Compose component styles with atomic utilities
const flexCard = styles.compose(card, atoms({ display: 'flex', gap: 2 }));

flexCard('base'); // "card-base atom-display-flex atom-gap-2"
```

## Use Cases

### Component Inheritance

Create base components and extend them:

```ts
const baseButton = styles.create('btn-base', {
  root: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    border: 'none',
  },
});

const primaryButton = styles.compose(
  baseButton,
  styles.create('btn-primary', {
    root: { backgroundColor: '#0066ff', color: 'white' },
  }),
);

const secondaryButton = styles.compose(
  baseButton,
  styles.create('btn-secondary', {
    root: { backgroundColor: '#e5e7eb', color: '#1f2937' },
  }),
);
```

### Utility-First Patterns

Build components with a mix of custom styles and utilities:

```ts
const customCard = styles.create('custom-card', {
  feature: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
});

const featureCard = styles.compose(customCard, atoms({ padding: 3, borderRadius: 2 }));
```

### Multi-Layer Composition

Compose multiple concerns separately:

```ts
const layout = styles.create('layout', { container: { maxWidth: '1200px' } });
const spacing = styles.create('spacing', { container: { padding: '0 16px' } });
const responsive = styles.create('responsive', {
  container: {
    '@media (max-width: 768px)': { padding: '0 8px' },
  },
});

const container = styles.compose(layout, spacing, responsive);

container('container');
// "layout-container spacing-container responsive-container"
```

## Type Safety

The composed function maintains full type safety. If you compose functions with different variant names, you'll get autocomplete for all variants:

```ts
const a = styles.create('a', { variant1: { color: 'red' } });
const b = styles.create('b', { variant2: { color: 'blue' } });

const composed = styles.compose(a, b);

// Both 'variant1' and 'variant2' are valid
composed('variant1', 'variant2');
```

Note: TypeScript won't prevent you from passing variant names that don't exist in all composed functions. At runtime, each function will only generate classes for variants it knows about.
