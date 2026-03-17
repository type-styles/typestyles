---
title: Custom Selectors & At-Rules
description: Using @container, @supports, and other CSS features
---

# Custom Selectors & At-Rules

TypeStyles supports all CSS at-rules and advanced selectors through special key prefixes.

## Pseudo-classes and pseudo-elements

Use the `&` prefix for pseudo-classes:

```ts
const button = styles.create('button', {
  base: {
    padding: '8px 16px',
    backgroundColor: '#0066ff',
    color: 'white',

    // Hover state
    '&:hover': {
      backgroundColor: '#0052cc',
    },

    // Focus state
    '&:focus': {
      outline: '2px solid #0066ff',
      outlineOffset: '2px',
    },

    // Active/pressed state
    '&:active': {
      transform: 'scale(0.98)',
    },

    // Disabled state
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },

    // Pseudo-elements
    '&::before': {
      content: '""',
      display: 'inline-block',
      width: '16px',
      height: '16px',
    },

    '&::after': {
      content: '" →"',
    },
  },
});
```

### Form-related pseudo-classes

```ts
const input = styles.create('input', {
  base: {
    border: '1px solid #e5e7eb',

    // Checked state (checkboxes, radios)
    '&:checked': {
      backgroundColor: '#0066ff',
    },

    // Placeholder text
    '&::placeholder': {
      color: '#9ca3af',
    },

    // Invalid state
    '&:invalid': {
      borderColor: '#ef4444',
    },

    // Valid state
    '&:valid': {
      borderColor: '#10b981',
    },

    // Required field
    '&:required': {
      borderColor: '#f59e0b',
    },
  },
});
```

### Structural pseudo-classes

```ts
const list = styles.create('list', {
  item: {
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',

    // First child
    '&:first-child': {
      paddingTop: 0,
    },

    // Last child
    '&:last-child': {
      paddingBottom: 0,
      borderBottom: 'none',
    },

    // Every other item
    '&:nth-child(even)': {
      backgroundColor: '#f9fafb',
    },

    // First 3 items
    '&:nth-child(-n+3)': {
      fontWeight: 600,
    },

    // Only child
    '&:only-child': {
      border: 'none',
    },
  },
});
```

## Descendant and sibling selectors

### Child selectors

```ts
const card = styles.create('card', {
  base: {
    padding: '16px',
  },

  // Direct children
  '& > header': {
    marginBottom: '12px',
    fontWeight: 600,
  },

  // Any descendant
  '& .content': {
    lineHeight: 1.6,
  },

  // Descendant with specific element
  '& p': {
    marginBottom: '8px',
  },

  // Multiple selectors
  '& h1, & h2, & h3': {
    marginTop: 0,
  },
});
```

### Sibling selectors

```ts
const form = styles.create('form', {
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  // Adjacent sibling
  '& > * + *': {
    // Adds margin between consecutive children (owl selector)
    marginTop: '16px',
  },

  // General sibling
  '& input ~ .error': {
    display: 'none',
  },

  '& input:invalid ~ .error': {
    display: 'block',
    color: '#ef4444',
  },
});
```

## Attribute selectors

```ts
const link = styles.create('link', {
  base: {
    color: '#0066ff',
    textDecoration: 'none',

    // External links
    '&[href^="http"]': {
      '&::after': {
        content: '" ↗"',
      },
    },

    // Download links
    '&[download]': {
      '&::after': {
        content: '" ↓"',
      },
    },

    // Links with specific target
    '&[target="_blank"]': {
      '&::after': {
        content: '" (opens in new tab)"',
      },
    },

    // Selector list support (both selectors scoped to .link-base)
    '[data-state="open"], [aria-expanded="true"]': {
      fontWeight: 600,
    },
  },
});
```

All CSS attribute selector operators are supported:

- exact match: `[attr="value"]`
- contains token: `[attr~="token"]`
- starts with / language: `[attr|="en"]`
- starts with: `[attr^="prefix"]`
- ends with: `[attr$="suffix"]`
- contains substring: `[attr*="part"]`

## Media queries

Use the `@` prefix for media queries:

```ts
const layout = styles.create('layout', {
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',

    // Tablet
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },

    // Desktop
    '@media (min-width: 1024px)': {
      gridTemplateColumns: 'repeat(3, 1fr)',
    },

    // Wide screens
    '@media (min-width: 1440px)': {
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px',
    },
  },
});
```

### Complex media queries

```ts
const hero = styles.create('hero', {
  base: {
    padding: '48px 16px',

    // High DPI screens
    '@media (min-resolution: 192dpi)': {
      backgroundImage: 'url(hero@2x.jpg)',
    },

    // Dark mode preference
    '@media (prefers-color-scheme: dark)': {
      backgroundColor: '#1a1a2e',
      color: '#e0e0e0',
    },

    // Reduced motion preference
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      transition: 'none',
    },

    // Print styles
    '@media print': {
      background: 'none',
      color: 'black',
    },
  },
});
```

### Combining media queries with pseudo-classes

```ts
const button = styles.create('button', {
  base: {
    padding: '8px 16px',

    // Hover only on devices that support it
    '@media (hover: hover)': {
      '&:hover': {
        backgroundColor: '#0052cc',
      },
    },

    // Touch device adjustments
    '@media (pointer: coarse)': {
      padding: '12px 20px', // Larger touch target
    },
  },
});
```

## Container queries

Container queries respond to the size of a container, not the viewport:

```ts
const card = styles.create('card', {
  base: {
    // Establish this element as a container
    containerType: 'inline-size',
    containerName: 'card',
  },

  content: {
    padding: '12px',

    // When container is at least 400px wide
    '@container (min-width: 400px)': {
      padding: '24px',
      display: 'flex',
      gap: '16px',
    },

    // When container is at least 600px wide
    '@container (min-width: 600px)': {
      padding: '32px',
    },
  },
});
```

### Named container queries

```ts
const sidebar = styles.create('sidebar', {
  base: {
    containerName: 'sidebar',
    containerType: 'inline-size',
    width: '280px',
  },

  content: {
    // Styles that respond to sidebar width
    '@container sidebar (min-width: 250px)': {
      display: 'block',
    },
  },
});
```

## Supports queries

Feature detection with `@supports`:

```ts
const backdrop = styles.create('backdrop', {
  base: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',

    // Use backdrop-filter if supported
    '@supports (backdrop-filter: blur(4px))': {
      backdropFilter: 'blur(4px)',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
  },
});
```

### Complex supports queries

```ts
const grid = styles.create('grid', {
  base: {
    // Fallback layout
    display: 'flex',
    flexWrap: 'wrap',

    // Use grid if supported
    '@supports (display: grid)': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    },

    // Use subgrid if supported
    '@supports (grid-template-columns: subgrid)': {
      gridTemplateColumns: 'subgrid',
    },
  },
});
```

## Layer (cascade layers)

CSS cascade layers for organizing styles:

```ts
const reset = styles.create('reset', {
  base: {
    // Apply to @layer reset
    '@layer reset': {
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
    },
  },
});

const components = styles.create('components', {
  button: {
    '@layer components': {
      padding: '8px 16px',
      backgroundColor: '#0066ff',
    },
  },
});
```

## Nesting depth

While typestyles supports deep nesting, it's best to keep it shallow:

```ts
// ✅ Good - 2-3 levels deep
const nav = styles.create('nav', {
  base: {
    display: 'flex',

    '& li': {
      position: 'relative',

      '&:hover > ul': {
        display: 'block', // 3 levels, acceptable
      },
    },
  },
});

// ❌ Avoid - too deep, hard to maintain
const deep = styles.create('deep', {
  base: {
    '& div': {
      '& span': {
        '& a': {
          '&:hover': {
            color: 'red', // 5 levels, problematic
          },
        },
      },
    },
  },
});
```

## Complex real-world example

```ts
const dataTable = styles.create('data-table', {
  container: {
    overflowX: 'auto',
    containerType: 'inline-size',
    containerName: 'data-table',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',

    // Responsive adjustments
    '@container (max-width: 600px)': {
      fontSize: '14px',
    },

    // Sticky header
    '& thead': {
      position: 'sticky',
      top: 0,
      backgroundColor: '#f9fafb',

      '& th': {
        padding: '12px',
        textAlign: 'left',
        fontWeight: 600,

        '&:hover': {
          backgroundColor: '#e5e7eb',
          cursor: 'pointer',
        },
      },
    },

    // Body rows
    '& tbody tr': {
      borderBottom: '1px solid #e5e7eb',

      '&:last-child': {
        borderBottom: 'none',
      },

      '&:hover': {
        backgroundColor: '#f9fafb',
      },

      '& td': {
        padding: '12px',
      },

      // Selected row
      '&[data-selected="true"]': {
        backgroundColor: '#eff6ff',
      },
    },
  },

  // Print styles
  '@media print': {
    container: {
      overflow: 'visible',
    },

    table: {
      '& thead': {
        position: 'static',
      },
    },
  },
});
```

## Generated CSS

TypeStyles converts these nested objects to flat CSS:

**Input:**

```ts
const button = styles.create('button', {
  base: {
    padding: '8px',
    '&:hover': {
      backgroundColor: 'blue',
    },
    '@media (min-width: 768px)': {
      padding: '12px',
    },
  },
});
```

**Generated CSS:**

```css
.button-base {
  padding: 8px;
}

.button-base:hover {
  background-color: blue;
}

@media (min-width: 768px) {
  .button-base {
    padding: 12px;
  }
}
```

## Best practices

1. **Keep nesting shallow** - Max 3 levels deep
2. **Use container queries** - For component-level responsiveness
3. **Use media queries** - For viewport-level changes
4. **Combine selectors wisely** - Avoid overly complex selectors
5. **Test in real browsers** - Some selectors have varying support
6. **Consider progressive enhancement** - Use `@supports` for new features
