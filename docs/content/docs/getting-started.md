---
title: Getting Started
description: Install and use typestyles in your project
---

# Getting Started

typestyles is **CSS-in-TypeScript** that embraces CSS instead of hiding from it. You define styles and tokens in TypeScript and get predictable, scoped class names and design tokens as CSS custom properties.

## Installation

```bash
pnpm add typestyles
# or
npm install typestyles
```

## Basic usage

Create styles with `styles.component()` and apply them by calling the returned function or destructuring it:

```ts
import { styles } from 'typestyles';

const button = styles.component('button', {
  base: { padding: '8px 16px', borderRadius: '6px' },
  variants: {
    intent: {
      primary: { backgroundColor: '#0066ff', color: '#fff' },
      secondary: { backgroundColor: '#6b7280', color: '#fff' },
    },
  },
  defaultVariants: { intent: 'primary' },
});

// Call as a function (base styles are auto-applied):
button(); // base + primary (default)
button({ intent: 'secondary' }); // base + secondary

// Or destructure for direct access:
const { base } = button;
```

For simple flat configs (no variant dimensions), use the flat form:

```ts
const card = styles.component('card', {
  base: { padding: '16px', borderRadius: '8px' },
  elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
});

card(); // base styles auto-applied
const { base, elevated } = card;
```

## Which API should I use?

| You want to...                                                                        | Use                                     | Why                                                                          |
| ------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------- |
| Style a component with base + flat named variants (`elevated`, `compact`)             | `styles.component` (flat config)        | Simple, readable class output with auto-applied base                         |
| Build typed variant dimensions (`intent`, `size`, `tone`) with defaults and compounds | `styles.component` (dimensioned config) | First-class variant model: `variants`, `compoundVariants`, `defaultVariants` |
| Make one standalone class from one style object                                       | `styles.class`                          | Best for one-off reusable classes                                            |
| Compose multiple selectors/classes together                                           | `styles.compose`                        | Reuse and merge style groups cleanly                                         |
| Join class strings conditionally                                                      | `cx()`                                  | Built-in utility for conditional class joining                               |

Quick rule of thumb:

- Use `styles.component` for all component styles (both flat and dimensioned).
- Use `styles.class` for single utility-like classes.
- Use `cx()` to conditionally join class strings.

See also:

- [Styles](/docs/styles)
- [Components](/docs/components)
- [Class naming](/docs/class-naming) -- semantic vs hashed output for `styles.component`
- [Migration Guide](/docs/migration)

Create design tokens with `tokens.create()` and use them in styles:

```ts
import { tokens } from 'typestyles';

const color = tokens.create('color', {
  primary: '#0066ff',
});

// Use in styles: backgroundColor: color.primary
// Renders as: var(--color-primary)
```

You stay in control of the CSS; typestyles just generates the class names and custom properties.

When you want **one constructor** that returns matching `styles`, `tokens`, and `global` instances (shared `scopeId` and optional **cascade layers**), use `createTypeStyles` — see the [API reference](/docs/api-reference). The documentation site and `examples/design-system` both use this pattern.

For Vite and Next.js, you can ship **zero-runtime CSS in production** while keeping the runtime during development — see [Zero-runtime extraction](/docs/zero-runtime) and the [Vite plugin](/docs/vite-plugin).
