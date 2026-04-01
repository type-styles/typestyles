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

Create styles with `styles.create()` and apply them with the returned selector function:

```ts
import { styles } from 'typestyles';

const button = styles.create('button', {
  base: { padding: '8px 16px', borderRadius: '6px' },
  primary: { backgroundColor: '#0066ff', color: '#fff' },
});

// In your component: className={button('base', 'primary')}
```

## Which API should I use?

| You want to...                                                                        | Use                | Why                                                                          |
| ------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| Create a simple named style group (`base`, `primary`, `large`)                        | `styles.create`    | Lowest ceremony and very readable class output                               |
| Build typed variant dimensions (`intent`, `size`, `tone`) with defaults and compounds | `styles.component` | First-class variant model: `variants`, `compoundVariants`, `defaultVariants` |
| Make one standalone class from one style object                                       | `styles.class`     | Best for one-off reusable classes                                            |
| Compose multiple selectors/classes together                                           | `styles.compose`   | Reuse and merge style groups cleanly                                         |

Quick rule of thumb:

- Start with `styles.create` for straightforward component styles.
- Use `styles.component` when your API has variant dimensions.
- Use `styles.class` for single utility-like classes.

See also:

- [Styles](/docs/styles)
- [Components](/docs/components)
- [Class naming](/docs/class-naming) — semantic vs hashed output for `styles.create` / `styles.component`
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
