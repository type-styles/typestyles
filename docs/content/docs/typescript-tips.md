---
title: TypeScript Tips
description: TypeScript best practices and advanced types for typestyles
---

# TypeScript Tips

TypeStyles is built with TypeScript in mind. This guide covers tips for getting the most out of types.

## Basic types

### Style definitions

TypeStyles automatically infers types from your definitions:

```ts
import { styles } from 'typestyles';

// Types are inferred automatically
const button = styles.component('button', {
  base: {
    padding: '8px 16px',
    backgroundColor: '#0066ff',
  },
  primary: {
    color: 'white',
  },
});

// Calling the recipe returns a class string (base is always included)
const classes = button({ primary: true });
//     ^? string
```

### Token types

Token references are typed as strings:

```ts
import { tokens } from 'typestyles';

const color = tokens.create('color', {
  primary: '#0066ff',
  secondary: '#6b7280',
});

// color is typed with specific keys
color.primary; // string
color.secondary; // string
color.tertiary; // Error: Property 'tertiary' does not exist
```

## Strict mode compatibility

TypeStyles works great with TypeScript's strict mode. Ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

## Extending types

### Custom CSS properties

If you need custom CSS properties that aren't in the standard types:

```ts
import { CSSProperties } from 'typestyles';

// Extend the base type
interface CustomProperties extends CSSProperties {
  '--custom-property'?: string;
  '--theme-color'?: string;
}

// Use in your style definitions
const customStyles: Record<string, CustomProperties> = {
  base: {
    '--custom-property': 'value',
    '--theme-color': '#0066ff',
  },
};
```

### Custom at-rules

For custom at-rules that TypeStyles doesn't know about:

```ts
interface CustomAtRules extends CSSProperties {
  '@layer'?: Record<string, CSSProperties>;
}

const styles: Record<string, CustomAtRules> = {
  base: {
    '@layer': {
      utilities: {
        padding: '8px',
      },
    },
  },
};
```

## Component prop types

### Typed variant props

Make your component props type-safe:

```ts
import { styles } from 'typestyles';

const button = styles.component('button', {
  base: { fontWeight: 500 },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb', color: 'white' },
      secondary: { backgroundColor: '#e5e7eb', color: '#111' },
      ghost: { backgroundColor: 'transparent', color: '#111' },
    },
    size: {
      small: { fontSize: '12px', padding: '4px 8px' },
      medium: { fontSize: '14px', padding: '8px 12px' },
      large: { fontSize: '16px', padding: '10px 16px' },
    },
  },
  defaultVariants: { intent: 'primary', size: 'medium' },
});

// First argument: partial variant overrides (typed from your recipe)
type ButtonOptions = Parameters<typeof button>[0];
//   ^? { intent?: 'primary' | 'secondary' | 'ghost'; size?: 'small' | 'medium' | 'large' } | undefined

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

function Button({ variant = 'primary', size = 'medium', children }: ButtonProps) {
  return (
    <button className={button({ intent: variant, size })}>
      {children}
    </button>
  );
}
```

### Stricter object literals

You can add `as const` to **nested values** when you want literal types preserved (for example token-like maps). For `styles.component`, variant keys are inferred from the config object, and **multipart `slots` names are inferred from a `slots` array literal** (no `as const` needed when the array is written inline in the config). Use explicit component prop types when you need a narrower public API than the style keys alone.

## Utility types

### Extracting style types

```ts
import { styles } from 'typestyles';

const card = styles.component('card', {
  base: { ... },
  elevated: { ... },
});

// Optional argument is a partial of flat variant flags
type CardOptions = Parameters<typeof card>[0];
//   ^? { elevated?: boolean } | undefined

// Create a type for your component props
type CardProps = {
  elevated?: boolean;
};
```

### Token type extraction

```ts
import { tokens } from 'typestyles';

const themeTokens = {
  color: tokens.create('color', {
    primary: '#0066ff',
    secondary: '#6b7280',
  }),
  space: tokens.create('space', {
    sm: '8px',
    md: '16px',
  }),
};

// Extract specific token types
type ColorToken = keyof typeof themeTokens.color;
//   ^? 'primary' | 'secondary'

type SpaceToken = keyof typeof themeTokens.space;
//   ^? 'sm' | 'md'
```

## Type-safe themes

### Theme type definition

```ts
// types/theme.ts
export interface Theme {
  color: {
    primary: string;
    secondary: string;
    text: string;
    surface: string;
  };
  space: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Ensure your tokens match the theme
export const color = tokens.create('color', {
  primary: '#0066ff',
  secondary: '#6b7280',
  text: '#111827',
  surface: '#ffffff',
});

// TypeScript will error if you miss a key
```

### Theme-aware components

```ts
import { tokens } from 'typestyles';

const themeTokens = {
  color: tokens.create('color', {
    primary: '#0066ff',
    secondary: '#6b7280',
  }),
  space: tokens.create('space', {
    sm: '8px',
    md: '16px',
  }),
};

interface ThemedComponentProps {
  color: keyof typeof themeTokens.color;
  space: keyof typeof themeTokens.space;
}

function ThemedComponent({ color, space }: ThemedComponentProps) {
  const inline = {
    color: themeTokens.color[color],
    padding: themeTokens.space[space],
  };

  return <div style={inline}>Content</div>;
}

// Usage with autocomplete:
// <ThemedComponent color="primary" space="md" />
```

## Generic components

### Generic style components

```ts
import { styles } from 'typestyles';

const box = styles.component('box', {
  base: { padding: '16px' },
  variants: {
    tone: {
      default: {},
      elevated: { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    },
  },
  defaultVariants: { tone: 'default' },
});

function StyledBox({
  tone = 'default',
  children,
}: {
  tone?: 'default' | 'elevated';
  children: React.ReactNode;
}) {
  return <div className={box({ tone })}>{children}</div>;
}

// Usage
<StyledBox tone="elevated">Content</StyledBox>;
```

## Conditional types

### Responsive style types

```ts
type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

interface ResponsiveProps {
  padding: ResponsiveValue<string>;
  display: ResponsiveValue<'block' | 'flex' | 'grid'>;
}

// Implementation would handle responsive logic
```

### Variant combinations

```ts
// Type for all possible button combinations
type ButtonVariant =
  | { variant: 'primary'; size: 'small' | 'medium' | 'large' }
  | { variant: 'secondary'; size: 'small' | 'medium' | 'large' }
  | { variant: 'ghost'; size: 'small' | 'medium' };

function Button(props: ButtonVariant & { children: React.ReactNode }) {
  const { variant, size, children } = props;
  // Implementation
}

// TypeScript enforces valid combinations:
Button({ variant: 'primary', size: 'large', children: 'Click' }); // ✓
Button({ variant: 'ghost', size: 'large', children: 'Click' }); // ✗ Error: 'large' not assignable
```

## Module augmentation

### Extending typestyles types

If you need to add custom types to typestyles:

```ts
// types/typestyles.d.ts
declare module 'typestyles' {
  export interface CSSProperties {
    // Add custom properties
    'anchor-name'?: string;
    'position-anchor'?: string;

    // Add custom values to existing properties
    display?: 'block' | 'flex' | 'grid' | 'custom-value';
  }
}
```

## Type guards

### Safe variant checking

```ts
import { styles } from 'typestyles';

const button = styles.component('button', {
  base: { padding: '8px 12px' },
  variants: {
    intent: {
      primary: { color: 'white', backgroundColor: '#2563eb' },
      secondary: { color: '#111', backgroundColor: '#e5e7eb' },
      ghost: { color: '#111', backgroundColor: 'transparent' },
    },
  },
  defaultVariants: { intent: 'primary' },
});

function isValidVariant(
  variant: string
): variant is 'primary' | 'secondary' | 'ghost' {
  return ['primary', 'secondary', 'ghost'].includes(variant);
}

function Button({ variant }: { variant?: string }) {
  const intent = variant && isValidVariant(variant) ? variant : 'primary';

  return <button className={button({ intent })}>Click</button>;
}
```

## Configuration types

### Strict style configuration

```ts
// styles/config.ts
import { type CSSProperties, styles } from 'typestyles';

interface StyleConfig {
  namespace: string;
  base: CSSProperties;
  variants: Record<string, CSSProperties>;
}

function createStrictStyles(config: StyleConfig) {
  const { namespace, base, variants } = config;
  return styles.component(namespace, { base, ...variants });
}

// Usage with full type safety
const button = createStrictStyles({
  namespace: 'button',
  base: { padding: '8px' },
  variants: {
    primary: { backgroundColor: 'blue' },
  },
});

button({ primary: true }); // ✓ base + primary classes
```

## Type narrowing

### Narrowing with type predicates

```ts
import { styles } from 'typestyles';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

function isButtonVariant(value: string): value is ButtonVariant {
  return ['primary', 'secondary', 'ghost'].includes(value);
}

const button = styles.component('button', {
  base: { padding: '8px 12px' },
  variants: {
    intent: {
      primary: { color: 'white', backgroundColor: '#2563eb' },
      secondary: { color: '#111', backgroundColor: '#e5e7eb' },
      ghost: { color: '#111', backgroundColor: 'transparent' },
    },
  },
  defaultVariants: { intent: 'primary' },
});

function Button({ variant: variantProp }: { variant?: string }) {
  const intent: ButtonVariant = isButtonVariant(variantProp ?? '')
    ? variantProp
    : 'primary';

  return <button className={button({ intent })}>Click</button>;
}
```

## Best practices

1. **Let types be inferred** when possible
2. **Define explicit interfaces** for component props
3. **Use `as const`** on nested maps when you need literal types
4. **Extract shared types** to avoid duplication
5. **Leverage `keyof`** for token-based props
6. **Use strict mode** for best type safety
7. **Export types** that consumers might need
8. **Document complex types** with JSDoc comments

## Complex CSS values (`calc`, `clamp`, and other parentheses)

Property values are typed as **strings** (or numbers where unit conversion applies). TypeScript cannot tell whether `calc(…)`, `clamp(…)`, `min(…)`, `max(…)`, `url(…)`, or similar is syntactically valid. A single missing or extra `)` often produces **invalid CSS**; depending on where it appears, the browser may ignore one declaration or mis-parse **many rules** after it.

### Built-in helpers: `calc` and `clamp`

TypeStyles exports **`calc`** (a tagged template) and **`clamp(min, preferred, max)`** so the outer `calc(…)` / `clamp(…)` parentheses are always emitted together:

```ts
import { calc, clamp, styles } from 'typestyles';

styles.class('sidebar', {
  height: calc`100vh - 2 * ${t.space[4]}`,
  fontSize: clamp('0.875rem', '2vw', '1.125rem'),
});
```

You still need valid syntax inside the template (for example balanced parentheses in nested `min()` / `max()`), but you won’t forget the closing `)` of `calc` itself.

### Other patterns

1. **Manual template literals** — keep `calc(` and `)` in one literal and interpolate only the middle if you prefer not to use the tag:

   ```ts
   height: `calc(100vh - 2 * ${t.space[4]})`,
   ```

2. **Custom helpers** when you repeat the same shape:

   ```ts
   function calcSubtract(minuend: string, subtrahend: string) {
     return `calc(${minuend} - ${subtrahend})`;
   }
   ```

3. **Name intermediate pieces** if a value gets long—easier to review than a single huge string.

4. **Validate in the browser** (devtools → computed / rules) when you touch tricky values; there is no full compile-time substitute today.

## Nested keys: `container()`, `has()`, `is()`, `where()`

Style objects allow nested keys that start with **`&`** (pseudos, descendants), **`[`** (attributes), or **`@`** (at-rules). When you use a **computed** key next to normal longhands (`color`, `padding`, …), TypeScript must keep that key as a **narrow template literal**. If it widens to plain `string`, the object no longer matches `CSSProperties` and you might be tempted to use `as CSSProperties`.

TypeStyles narrows keys when you use the builders with **literal** inputs:

- **`styles.container({ minWidth: 400 })`**, **`styles.container('sidebar', { minWidth: 300 })`**, and **`styles.container('(min-width: 1px)')`** infer a concrete `` `@container …` `` key.
- **`styles.has('.active')`**, **`styles.is(':hover', ':focus-visible')`**, **`styles.where('.nav')`** infer a concrete `` `&:…` `` key.

So this pattern type-checks without casting:

```ts
import { styles } from 'typestyles';

styles.class('card', {
  color: 'inherit',
  [styles.container({ minWidth: 400 })]: { display: 'grid' },
  [styles.has('.expanded')]: { borderColor: 'blue' },
});
```

When the query or selector is only known as a **`string`** variable at compile time, use **`…styles.atRuleBlock(containerKey, { … })`** (or spread a one-key object) instead of `[someString]: { … }`. See [Custom selectors & at-rules](/docs/custom-at-rules).

## Common type issues

### Issue: "Type instantiation is excessively deep"

This can happen with very complex nested styles. Solution: simplify nesting or add explicit type annotations.

```ts
// If you get deep type errors, add explicit return type
const complex = styles.component('complex', {
  base: {
    // very deep nesting
  },
} as const); // or use explicit type annotation
```

### Issue: "Property does not exist"

Make sure you're importing the correct types:

```ts
// ✅ Import from typestyles
import type { CSSProperties } from 'typestyles';

// ❌ Don't use React's CSSProperties for styles
import type { CSSProperties } from 'react'; // Wrong!
```

### Issue: "Excessively deep type instantiation"

Break complex styles into smaller pieces:

```ts
// ❌ Avoid very complex single definitions
const complex = styles.component('complex', {
  base: {
    // hundreds of lines
  },
});

// ✅ Break into logical groups
const header = styles.component('header', { ... });
const content = styles.component('content', { ... });
const footer = styles.component('footer', { ... });
```

## Summary

TypeStyles provides excellent TypeScript support out of the box. Key points:

- Types are inferred automatically
- Strict mode is fully supported
- You can extend types for custom use cases
- Use explicit interfaces for component props
- Leverage TypeScript's type system for variant safety
