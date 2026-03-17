---
title: Migration Guide
description: Migrate to typestyles from other CSS-in-JS libraries
---

# Migration Guide

Switching to typestyles from other styling solutions is straightforward. This guide covers the most common migration paths.

If you are adopting the new variant API, start with [Recipes](/docs/recipes).

## From styled-components

### Component structure

**Before (styled-components):**

```tsx
import styled from 'styled-components';

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  background-color: ${(props) => (props.primary ? '#0066ff' : '#6b7280')};
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

<Button primary>Click me</Button>;
```

**After (typestyles):**

```tsx
import { styles, tokens } from 'typestyles';

const color = tokens.use('color');

const button = styles.create('button', {
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    color: 'white',
    '&:hover': { opacity: 0.9 },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
  primary: {
    backgroundColor: color.primary,
  },
  secondary: {
    backgroundColor: color.secondary,
  },
});

function Button({ primary, children }) {
  return <button className={button('base', primary && 'primary')}>{children}</button>;
}
```

### Key differences

1. **No component wrapper** - typestyles returns class names, not React components
2. **Explicit props handling** - Logic moves from template literals to regular JavaScript
3. **Static styles** - Dynamic values become explicit variants or are passed via inline styles
4. **CSS nesting** - Use `&` prefix for pseudo-classes like `&:hover`

### Dynamic values

**Before:**

```tsx
const Box = styled.div`
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
`;
```

**After:**

```tsx
const box = styles.create('box', {
  base: {
    display: 'inline-block',
  },
});

function Box({ width, height, children }) {
  return (
    <div className={box('base')} style={{ width, height }}>
      {children}
    </div>
  );
}
```

Dynamic values that change frequently should use inline styles. Static styles should use typestyles variants.

## From Emotion

Emotion's API is similar to styled-components, so the migration path is nearly identical.

### css prop

**Before (Emotion):**

```tsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

function Button({ children }) {
  return (
    <button
      css={css`
        padding: 8px 16px;
        background-color: #0066ff;
        color: white;
        &:hover {
          background-color: #0052cc;
        }
      `}
    >
      {children}
    </button>
  );
}
```

**After (typestyles):**

```tsx
import { styles } from 'typestyles';

const button = styles.create('button', {
  base: {
    padding: '8px 16px',
    backgroundColor: '#0066ff',
    color: 'white',
    '&:hover': {
      backgroundColor: '#0052cc',
    },
  },
});

function Button({ children }) {
  return <button className={button('base')}>{children}</button>;
}
```

### cx utility

**Before:**

```tsx
import { css, cx } from '@emotion/css';

const base = css`padding: 8px;`;
const primary = css`background: blue;`;
const large = css`font-size: 18px;`;

className={cx(base, isPrimary && primary, isLarge && large)}
```

**After:**

```tsx
import { styles } from 'typestyles';

const button = styles.create('button', {
  base: { padding: '8px' },
  primary: { backgroundColor: 'blue' },
  large: { fontSize: '18px' },
});

className={button('base', isPrimary && 'primary', isLarge && 'large')}
```

typestyles' selector function already handles conditional class names, so you don't need a separate `cx` utility.

## From CVA (Class Variance Authority)

`styles.recipe` maps closely to CVA's mental model:

- `variants`
- `compoundVariants`
- `defaultVariants`

### Basic mapping

**Before (CVA):**

```ts
import { cva } from 'class-variance-authority';

export const button = cva('inline-flex rounded font-medium', {
  variants: {
    intent: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent text-gray-900',
    },
    size: {
      sm: 'px-2 py-1 text-sm',
      lg: 'px-4 py-2 text-base',
    },
  },
  compoundVariants: [
    {
      intent: ['primary', 'ghost'],
      size: 'lg',
      class: 'uppercase',
    },
  ],
  defaultVariants: {
    intent: 'primary',
    size: 'sm',
  },
});
```

**After (typestyles):**

```ts
import { styles } from 'typestyles';

export const button = styles.recipe('button', {
  base: {
    display: 'inline-flex',
    borderRadius: '8px',
    fontWeight: 500,
  },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb', color: 'white' },
      ghost: { backgroundColor: 'transparent', color: '#111827' },
    },
    size: {
      sm: { padding: '4px 8px', fontSize: '14px' },
      lg: { padding: '8px 16px', fontSize: '16px' },
    },
  },
  compoundVariants: [
    {
      variants: {
        intent: ['primary', 'ghost'],
        size: 'lg',
      },
      style: {
        textTransform: 'uppercase',
      },
    },
  ],
  defaultVariants: {
    intent: 'primary',
    size: 'sm',
  },
});
```

### Key differences

1. CVA returns composed class strings from existing class tokens; typestyles generates and injects CSS from style objects.
2. CVA `class` in `compoundVariants` becomes typestyles `style`.
3. You can keep readable deterministic class output (`button-intent-primary`, etc.).

## From Stitches variants

### Variant migration

**Before (Stitches):**

```ts
import { styled } from '@stitches/react';

const Button = styled('button', {
  padding: '8px 12px',
  variants: {
    intent: {
      primary: { backgroundColor: 'dodgerblue', color: 'white' },
      ghost: { backgroundColor: 'transparent' },
    },
    outlined: {
      true: { border: '1px solid currentColor' },
    },
  },
  compoundVariants: [
    {
      intent: 'primary',
      outlined: true,
      css: { borderColor: 'blue' },
    },
  ],
  defaultVariants: {
    intent: 'primary',
  },
});
```

**After (typestyles):**

```ts
import { styles } from 'typestyles';

const button = styles.recipe('button', {
  base: {
    padding: '8px 12px',
  },
  variants: {
    intent: {
      primary: { backgroundColor: 'dodgerblue', color: 'white' },
      ghost: { backgroundColor: 'transparent' },
    },
    outlined: {
      true: { border: '1px solid currentColor' },
      false: { border: 'none' },
    },
  },
  compoundVariants: [
    {
      variants: {
        intent: 'primary',
        outlined: true,
      },
      style: {
        borderColor: 'blue',
      },
    },
  ],
  defaultVariants: {
    intent: 'primary',
    outlined: false,
  },
});
```

## From vanilla-extract recipes

### Recipe migration

**Before (vanilla-extract recipes):**

```ts
import { recipe } from '@vanilla-extract/recipes';

export const button = recipe({
  base: {
    borderRadius: 6,
  },
  variants: {
    tone: {
      neutral: { background: 'white' },
      brand: { background: 'blue', color: 'white' },
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});
```

**After (typestyles):**

```ts
import { styles } from 'typestyles';

export const button = styles.recipe('button', {
  base: {
    borderRadius: '6px',
  },
  variants: {
    tone: {
      neutral: { backgroundColor: 'white' },
      brand: { backgroundColor: 'blue', color: 'white' },
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});
```

Main trade-off:

- vanilla-extract is build-time only
- typestyles supports runtime + SSR today, with build-mode work in progress

## From typestyles `styles.component`

If you already use `styles.component`, migration is mostly a rename to align with recipe terminology:

```ts
// Before
const button = styles.component('button', {
  base: { padding: '8px 12px' },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb' },
      ghost: { backgroundColor: 'transparent' },
    },
  },
  defaultVariants: { intent: 'primary' },
});

// After
const button = styles.recipe('button', {
  base: { padding: '8px 12px' },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb' },
      ghost: { backgroundColor: 'transparent' },
    },
  },
  defaultVariants: { intent: 'primary' },
});
```

For API details and advanced patterns, see [Recipes](/docs/recipes).

## From Tailwind CSS

### Class-based to object-based

**Before (Tailwind):**

```tsx
function Button({ primary, children }) {
  return (
    <button
      className={`
        px-4 py-2 rounded
        font-medium transition-colors
        ${
          primary
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }
      `}
    >
      {children}
    </button>
  );
}
```

**After (typestyles):**

```tsx
import { styles, tokens } from 'typestyles';

const color = tokens.create('color', {
  primary: '#0066ff',
  primaryHover: '#0052cc',
  secondary: '#6b7280',
  secondaryHover: '#4b5563',
});

const button = styles.create('button', {
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 500,
    transition: 'background-color 150ms ease',
  },
  primary: {
    backgroundColor: color.primary,
    color: '#fff',
    '&:hover': {
      backgroundColor: color.primaryHover,
    },
  },
  secondary: {
    backgroundColor: color.secondary,
    color: '#fff',
    '&:hover': {
      backgroundColor: color.secondaryHover,
    },
  },
});

function Button({ primary, children }) {
  return <button className={button('base', primary ? 'primary' : 'secondary')}>{children}</button>;
}
```

### Design tokens

Tailwind's configuration becomes typestyles tokens:

**Before (tailwind.config.js):**

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#0066ff',
        secondary: '#6b7280',
      },
      spacing: {
        4: '16px',
        6: '24px',
      },
    },
  },
};
```

**After (tokens.ts):**

```ts
import { tokens } from 'typestyles';

export const color = tokens.create('color', {
  primary: '#0066ff',
  secondary: '#6b7280',
});

export const space = tokens.create('space', {
  4: '16px',
  6: '24px',
});
```

### Gradual migration

You can use Tailwind and typestyles together during migration:

```tsx
import { styles } from 'typestyles';

const card = styles.create('card', {
  base: {
    // New styles with typestyles
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
});

function Card({ children }) {
  return (
    <div className={card('base') + ' p-4 bg-white rounded'}>
      {/*                 ^ Tailwind classes still work */}
      {children}
    </div>
  );
}
```

## From CSS Modules

### File organization

**Before (Button.module.css):**

```css
.button {
  padding: 8px 16px;
  border-radius: 6px;
}

.primary {
  background-color: #0066ff;
  color: white;
}

.secondary {
  background-color: #6b7280;
  color: white;
}
```

**Before (Button.tsx):**

```tsx
import styles from './Button.module.css';

function Button({ variant, children }) {
  return <button className={`${styles.button} ${styles[variant]}`}>{children}</button>;
}
```

**After (button.styles.ts):**

```ts
import { styles } from 'typestyles';

export const button = styles.create('button', {
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
  },
  primary: {
    backgroundColor: '#0066ff',
    color: 'white',
  },
  secondary: {
    backgroundColor: '#6b7280',
    color: 'white',
  },
});
```

**After (Button.tsx):**

```tsx
import { button } from './button.styles';

function Button({ variant, children }) {
  return <button className={button('base', variant)}>{children}</button>;
}
```

### Global styles

CSS Modules `:global` becomes typestyles without nesting:

**Before:**

```css
:global(.tooltip) {
  position: absolute;
}
```

**After:**

```ts
const tooltip = styles.create('tooltip', {
  base: {
    position: 'absolute',
  },
});

// Use: tooltip('base')
```

## From plain CSS

Migrating from plain CSS gives you type safety and better organization.

### Step-by-step

1. **Identify components** - Start with your most reused components (buttons, inputs, cards)

2. **Extract tokens** - Move hardcoded values to tokens:

   ```ts
   // Before: colors scattered in CSS files
   // After:
   export const color = tokens.create('color', {
     primary: '#0066ff',
     secondary: '#6b7280',
   });
   ```

3. **Create style definitions** - Convert CSS rules to typestyles:

   ```css
   /* Before */
   .btn {
     padding: 8px 16px;
     background: #0066ff;
   }
   .btn:hover {
     background: #0052cc;
   }
   ```

   ```ts
   // After
   const button = styles.create('button', {
     base: {
       padding: '8px 16px',
       backgroundColor: color.primary,
       '&:hover': {
         backgroundColor: color.primaryHover,
       },
     },
   });
   ```

4. **Update components** - Replace className strings with selector calls

5. **Remove old CSS** - Once fully migrated, delete the CSS files

## General migration tips

### 1. Start small

Don't migrate everything at once. Pick one component or one page and convert it. typestyles works alongside your existing styles during the transition.

### 2. Keep the same names

If you have `.button-primary` in CSS, create a `button` style with a `primary` variant. This makes the migration easier to follow.

### 3. Use tokens early

Define your design tokens before converting components. This ensures consistency and makes the component migration smoother.

### 4. Test class names

In your tests, you may need to update selectors:

**Before:**

```ts
expect(screen.getByRole('button')).toHaveClass('button-primary');
```

**After:**

```ts
expect(screen.getByRole('button')).toHaveClass('button-base', 'button-primary');
```

### 5. DevTools familiarity

Your generated class names will be human-readable (`button-primary`), so DevTools inspection stays familiar—actually more readable than hashed class names from other CSS-in-JS libraries.

### 6. Bundle size check

After migration, your JavaScript bundle may be slightly smaller (no CSS parsing runtime) but you'll have a small runtime addition from typestyles itself. Overall size should be similar or smaller.

## Common patterns comparison

| Pattern            | styled-components            | Emotion                   | Tailwind            | typestyles            |
| ------------------ | ---------------------------- | ------------------------- | ------------------- | --------------------- |
| **Basic styling**  | `styled.div`...`             | `css`...`                 | `className="p-4"`   | `styles.create()`     |
| **Variants**       | Props + template literals    | Props + template literals | Conditional strings | Multiple variant args |
| **Pseudo-classes** | `&:hover` in template        | `&:hover` in template     | `hover:` prefix     | `&hover` in object    |
| **Media queries**  | `@media` in template         | `@media` in template      | Responsive prefixes | `@media` in object    |
| **Theme values**   | `${props => props.theme...}` | `${theme...}`             | Config-based        | Token references      |
| **Dynamic values** | Template literals            | Template literals         | Arbitrary values    | Inline styles         |

## Migration CLI (MVP)

The `@typestyles/migrate` package includes an early CLI to help with static migrations from styled-components and Emotion.

### Scope in this first version

- Converts static tagged templates (`styled.*`, `styled(...)`, and `css\`...\``) into `styles.class(...)`.
- Rewrites JSX usage for safely transformable styled components.
- Skips dynamic template interpolations and emits warnings instead of doing unsafe rewrites.

### Usage

```bash
pnpm --filter @typestyles/migrate typestyles-migrate src
```

By default the command is **dry-run** and prints patch output. Use `--write` to apply changes:

```bash
pnpm --filter @typestyles/migrate typestyles-migrate src --write
```

Useful options:

- `--include <glob>`: only process matching files (repeatable)
- `--exclude <glob>`: ignore matching files (repeatable)
- `--extensions .ts,.tsx`: customize scanned extensions
- `--report migration-report.json`: write a JSON summary and warning report

### Current limitations

- Dynamic interpolations (for example `${(props) => ...}`) are intentionally not auto-migrated.
- Exported styled components are skipped to avoid accidental API-shape changes.
- Complex non-JSX references to styled component variables are skipped.

## Troubleshooting migration issues

### Styles not applying

- Check that the namespace in `styles.create()` is unique
- Verify the component is being rendered (lazy injection means CSS only appears when used)
- Use DevTools to confirm class names are being applied

### Type errors

- Ensure you're importing from `'typestyles'`
- Check that TypeScript knows about the CSS property types (should work out of the box)
- For custom properties, use type assertions: `{ ['--custom' as string]: 'value' }`

### Performance concerns

- Don't create styles inside components (define them at module level)
- Use tokens instead of recreating values
- Static styles only—dynamic values should use inline styles

If you hit any issues during migration, check the [troubleshooting guide](./troubleshooting) or [open an issue](https://github.com/yourusername/typestyles/issues).
