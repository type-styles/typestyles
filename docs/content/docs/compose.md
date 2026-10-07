---
title: Style Composition
description: Combine multiple style functions and class strings with compose
---

The `compose()` function lets you merge multiple component style functions or class name strings into a single reusable function.

## Basic Usage

Combine multiple style groups into one:

```ts
import { createTypeStyles } from 'typestyles';

const { recipe, compose } = createTypeStyles({ scopeId: 'app' });

const base = recipe('base', {
  base: { padding: '8px', borderRadius: '4px' },
});

const primary = recipe('primary', {
  base: { backgroundColor: '#0066ff', color: 'white' },
});

const button = compose(base, primary);
```

## Composing with Static Classes

Mix component style functions with static class strings:

```ts
const card = recipe('card', {
  base: { padding: '16px', borderRadius: '8px' },
});

const composed = compose(card, 'shadow-lg', 'hover:scale-105');
```

## Conditional Composition

Use falsy values for conditional composition:

```ts
import { cx } from 'typestyles';

const base = recipe('base', {
  base: { padding: '8px' },
});

const elevated = recipe('elevated', {
  base: { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
});

const isElevated = true;
const isDark = false;

const composed = compose(base, isElevated && elevated, isDark && 'dark-mode');
```

You can also use `cx()` to conditionally join class strings from destructured components:

```ts
const card = recipe('card', {
  base: { padding: '16px' },
  elevated: { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
});
const { base, elevated } = card;

cx(base, isElevated && elevated);
```

## Overlapping Variants

When multiple style groups share the same base styles, all matching classes are applied:

```ts
const layout = recipe('layout', {
  base: { display: 'flex' },
});

const spacing = recipe('spacing', {
  base: { gap: '8px' },
});

const composed = compose(layout, spacing);
```

This is useful for layering different concerns (layout, spacing, colors) while keeping styles semantic.

## Composition with Atomic Utilities

Combine component styles with atomic utilities from `@typestyles/props`:

```ts
import { createTypeStyles } from 'typestyles';
import { createProps, defineProperties } from '@typestyles/props';

const { recipe, compose } = createTypeStyles({ scopeId: 'app' });

const atoms = createProps(
  'atom',
  defineProperties({
    properties: {
      display: ['flex', 'block', 'grid'],
      gap: { 0: '0', 1: '4px', 2: '8px', 3: '16px' },
    },
  }),
);

const card = recipe('card', {
  base: { borderRadius: '8px', border: '1px solid #e5e5e5' },
});

// Compose component styles with atomic utilities
const flexCard = compose(card, atoms({ display: 'flex', gap: 2 }));
```

## Use Cases

### Component Inheritance

Create base components and extend them:

```ts
const baseButton = recipe('btn-base', {
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    border: 'none',
  },
});

const primaryButton = compose(
  baseButton,
  recipe('btn-primary', {
    base: { backgroundColor: '#0066ff', color: 'white' },
  }),
);

const secondaryButton = compose(
  baseButton,
  recipe('btn-secondary', {
    base: { backgroundColor: '#e5e7eb', color: '#1f2937' },
  }),
);
```

### Utility-First Patterns

Build components with a mix of custom styles and utilities:

```ts
const customCard = recipe('custom-card', {
  base: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
});

const featureCard = compose(customCard, atoms({ padding: 3, borderRadius: 2 }));
```

### Multi-Layer Composition

Compose multiple concerns separately:

```ts
const layout = recipe('layout', { base: { maxWidth: '1200px' } });
const spacing = recipe('spacing', { base: { padding: '0 16px' } });
const responsive = recipe('responsive', {
  base: {
    '@media (max-width: 768px)': { padding: '0 8px' },
  },
});

const container = compose(layout, spacing, responsive);
```

## Type Safety

`compose()` infers a merged variant selection type from all composed component functions. TypeScript autocomplete and excess-property checks apply to the composed function's argument.

```ts
const size = recipe('size', {
  variants: {
    size: { sm: { fontSize: '12px' }, lg: { fontSize: '18px' } },
  },
});

const intent = recipe('intent', {
  variants: {
    intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
  },
});

const button = compose(size, intent);

// OK — both dimensions are known
button({ size: 'lg', intent: 'ghost' });

// TypeScript error — unknown variant key
button({ typo: true });
```

In development, `compose()` also logs a `console.error` when a runtime selection object includes keys that none of the composed functions accept. Individual component functions still warn when a key is valid for one composed function but not another.
