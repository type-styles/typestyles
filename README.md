# TypeStyles

CSS-in-TypeScript that embraces CSS instead of hiding from it.

TypeStyles gives you the developer experience of type-safe styles in TypeScript while producing clean, readable, inspectable output in the DOM. No gibberish class names. No build step required. No all-or-nothing adoption. Just CSS, with types.

## Why TypeStyles?

Most CSS-in-JS libraries fall into two camps:

1. **Runtime libraries** (styled-components, Emotion) that generate unreadable class names and add runtime overhead
2. **Static extraction** (StyleX, Vanilla Extract) that impose rigid authoring constraints and require specific build tooling

TypeStyles takes a different approach: write CSS in TypeScript with full type safety, get human-readable class names, and use CSS custom properties as first-class design tokens. It works alongside your existing CSS files and can be adopted one component at a time.

## Quick Start

```bash
npm install typestyles
```

```tsx
import { styles, tokens, cx } from 'typestyles';

// Define design tokens as CSS custom properties
const color = tokens.create('color', {
  primary: '#0066ff',
  secondary: '#6b7280',
  surface: '#ffffff',
  text: '#111827',
});

// Create component styles — callable AND destructurable
const button = styles.component('button', {
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    color: color.surface,
    backgroundColor: color.primary,
    transition: 'background-color 150ms ease',

    '&:hover': {
      backgroundColor: '#0052cc',
    },

    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  variants: {
    intent: {
      primary: { backgroundColor: color.primary, color: color.surface },
      outlined: {
        backgroundColor: 'transparent',
        border: `1px solid ${color.primary}`,
        color: color.primary,
      },
    },
    size: {
      sm: { padding: '4px 12px', fontSize: '12px' },
      lg: { padding: '12px 24px', fontSize: '16px' },
    },
  },

  defaultVariants: { intent: 'primary', size: 'sm' },
});

// Use in JSX — base always included, variants are typed
function Button({ intent, size, children }) {
  return <button className={button({ intent, size })}>{children}</button>;
}

// Or destructure individual class strings
const { base } = button;

// Renders: <button class="button-base button-intent-primary button-size-sm">
```

## Core Concepts

### Readable Class Names

TypeStyles generates class names that mirror your authored style names. If you write a variant called `intent: { primary: {...} }`, you get a class name `button-intent-primary` in the DOM. What you see in your code is what you see in DevTools.

```tsx
const card = styles.component('card', {
  base: { padding: '16px', borderRadius: '8px' },
  elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
});

<div className={card()}>               {/* class="card-base" */}
<div className={card({ elevated: true })}> {/* class="card-base card-elevated" */}

// Or destructure
const { base, elevated } = card;
<div className={cx(base, isElevated && elevated)}>
```

### Design Tokens via CSS Custom Properties

CSS custom properties are first-class citizens. Define your tokens once, use them everywhere — including in plain CSS files.

```tsx
import { tokens } from 'typestyles';

// Creates CSS custom properties on :root
const spacing = tokens.create('spacing', {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
});

// Use in TypeStyles — fully typed, autocomplete works
const layout = styles.component('layout', {
  base: {
    padding: spacing.md, // var(--spacing-md)
    gap: spacing.lg, // var(--spacing-lg)
  },
});

// Use in plain CSS — same custom properties
// styles.css
// .legacy-component {
//   padding: var(--spacing-md);
//   gap: var(--spacing-lg);
// }
```

Tokens support theming through standard CSS custom property overrides:

```tsx
const theme = tokens.createTheme('dark', {
  base: {
    color: {
      surface: '#1a1a2e',
      text: '#e0e0e0',
    },
  },
});

// Apply the theme to any subtree (ThemeSurface — use .className in React)
<div className={theme.className}>{/* All children use dark theme values */}</div>;
```

### Incremental Adoption

TypeStyles works alongside existing CSS. Adopt it one component at a time.

```tsx
// Use TypeStyles and plain CSS together
import './legacy-styles.css';
import { styles, cx } from 'typestyles';

const newComponent = styles.component('new-component', {
  base: { padding: '16px', borderRadius: '8px' },
});

function MyComponent() {
  return (
    <div className="legacy-class">
      <div className={cx(newComponent(), 'extra-class')}>
        {/* New component using TypeStyles */}
      </div>
    </div>
  );
}
```

### Composing Styles

Styles compose naturally using the built-in `cx()` utility or by destructuring.

```tsx
import { styles, cx } from 'typestyles';

const text = styles.component('text', {
  base: { fontFamily: 'system-ui' },
  bold: { fontWeight: 700 },
  muted: { color: color.secondary },
  heading: { fontSize: '24px', lineHeight: 1.2 },
});

// Destructure and compose with cx()
const { base, heading, bold, muted } = text;

<h1 className={cx(base, heading, bold)}>{/* class="text-base text-heading text-bold" */}</h1>;
```

Use the built-in `cx` utility to combine classes from different sources:

```tsx
import { cx, styles } from 'typestyles';

const card = styles.class('card', { padding: '16px' });

// Combine TypeStyles classes with external classes, conditionally
<div className={cx(card, text('base', 'muted'), isActive && 'active', externalClassName)} />;
```

### Selectors and Nesting

Write CSS selectors naturally. Media queries, pseudo-classes, combinators — it all works.

```tsx
const nav = styles.component('nav', {
  base: {
    display: 'flex',
    gap: spacing.md,

    // Pseudo-classes
    '&:hover': {
      backgroundColor: color.surface,
    },

    // Media queries
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },

    // Descendant selectors
    '& a': {
      textDecoration: 'none',
      color: color.primary,
    },

    // Container queries
    '@container (min-width: 400px)': {
      gridTemplateColumns: '1fr 1fr',
    },
  },
});
```

### Single File Components (Optional)

You can colocate styles with components, but you're never forced to.

```tsx
// Button.tsx — styles and component together
import { styles, tokens } from 'typestyles';

const color = tokens.use('color'); // Reference tokens defined elsewhere

const button = styles.component('button', {
  base: {
    padding: '8px 16px',
    backgroundColor: color.primary,
  },
  variants: {
    intent: {
      primary: { backgroundColor: color.primary },
      ghost: { backgroundColor: 'transparent' },
    },
  },
  defaultVariants: { intent: 'primary' },
});

export function Button({ intent, children }) {
  return <button className={button({ intent })}>{children}</button>;
}
```

Or keep styles separate:

```tsx
// button.styles.ts
import { styles } from 'typestyles';
export const button = styles.component('button', {
  base: { padding: '8px 16px' },
  variants: {
    intent: { primary: { backgroundColor: '#0066ff' } },
  },
});

// Button.tsx
import { button } from './button.styles';
export function Button({ intent, children }) {
  return <button className={button({ intent })}>{children}</button>;
}
```

## How It Works

TypeStyles operates at runtime with minimal overhead:

1. **`styles.component()`** registers style definitions and returns a callable+destructurable object
2. **Calling the object** composes class names from the variants you select (base always included)
3. **Destructuring** gives you individual class strings for fine-grained control
4. **CSS is injected** into a `<style>` element on first use (lazy injection)
5. **Class names** are deterministic and human-readable — derived from the names you author
6. **Tokens** are CSS custom properties, so they cascade naturally and work in plain CSS

### Style Injection

Styles are injected into the document lazily when a component using them first renders. TypeStyles uses a single managed `<style>` element and batches insertions for performance.

For SSR, TypeStyles provides a `collectStyles()` API to extract the CSS during server rendering:

```tsx
import { collectStyles } from 'typestyles/server';

const { html, css } = collectStyles(() => renderToString(<App />));
// Inject `css` into the <head> of the HTML document
```

## API Reference

### `styles.component(namespace, config)`

Creates a component style and returns a callable + destructurable object.

```tsx
// Dimensioned variants
const button = styles.component('button', {
  base: { padding: '8px 16px' },
  variants: {
    intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
    size: { sm: { fontSize: '14px' }, lg: { fontSize: '18px' } },
  },
  defaultVariants: { intent: 'primary', size: 'sm' },
});

button(); // "button-base button-intent-primary button-size-sm"
button({ intent: 'ghost' }); // "button-base button-intent-ghost button-size-sm"
button.base; // "button-base"
button['intent-primary']; // "button-intent-primary"

// Flat variants (simple boolean toggles)
const card = styles.component('card', {
  base: { padding: '16px' },
  elevated: { boxShadow: '...' },
});

card(); // "card-base"
card({ elevated: true }); // "card-base card-elevated"
card.elevated; // "card-elevated"
```

### `styles.class(name, properties)`

Creates a single class with no variants. Returns the class name string.

```tsx
const card = styles.class('card', { padding: '1rem' });
// card === "card"
```

### `cx(...classes)`

Joins class strings, filtering out falsy values.

```tsx
import { cx } from 'typestyles';

cx('a', 'b', false && 'c', undefined); // "a b"
```

### `tokens.create(namespace, values)`

Creates CSS custom properties and returns typed references.

```tsx
const spacing = tokens.create('spacing', {
  sm: '8px',
  md: '16px',
});

spacing.sm; // "var(--spacing-sm)" (typed as a CSS value)
spacing.md; // "var(--spacing-md)"
```

### `tokens.createTheme(name, config)`

Creates a theme surface (class `theme-{name}`) with token overrides. Pass **`base`**, and either **`modes`** (manual `tokens.when` conditions) or **`colorMode`** (presets), not both. Returns a **`ThemeSurface`**—use **`surface.className`** where a string is required.

```tsx
const dark = tokens.createTheme('dark', {
  base: {
    color: {
      surface: '#1a1a2e',
      text: '#e0e0e0',
    },
  },
});

<div className={dark.className}>
```

See `tokens.createDarkMode`, `tokens.when`, and `tokens.colorMode` for layered light/dark/system behavior.

### `createStyles(options?)` and `createTokens(options?)`

For **libraries, design systems, or micro-frontends**, create your own instances so class names and CSS variables stay isolated—no global configuration:

```tsx
import { createStyles, createTokens } from 'typestyles';

export const styles = createStyles({ scopeId: 'my-ui', mode: 'hashed', prefix: 'ui' });
export const tokens = createTokens({ scopeId: 'my-ui' });
```

Pass optional **`utils`** on `createStyles` to attach shorthand style expanders (same idea as `styles.withUtils` on the default export) on that single instance.

The default `import { styles, tokens } from 'typestyles'` remains `createStyles()` / `createTokens()` with default options for single-app use.

### `tokens.use(namespace)`

References tokens defined elsewhere. Useful for consuming shared tokens without importing the definition file.

```tsx
const color = tokens.use('color');
color.primary; // "var(--color-primary)"
```

## Comparison

High-level tradeoffs (details and nuance: [docs — framework comparison](./docs/content/docs/framework-comparison.md)):

| Feature                    | TypeStyles                   | StyleX           | Emotion / styled-components | Panda CSS    | vanilla-extract  | CSS Modules | Tailwind        |
| -------------------------- | ---------------------------- | ---------------- | --------------------------- | ------------ | ---------------- | ----------- | --------------- |
| Readable class names       | Yes                          | No               | No                          | Utilities    | Hashed / modules | Scoped      | Utility classes |
| Type-safe                  | Yes                          | Yes              | Partial                     | Yes          | Yes              | Partial     | No              |
| No build step required     | Yes                          | No               | Yes                         | No           | No               | No          | No              |
| Works with plain CSS       | Yes                          | Difficult        | Limited                     | Moderate     | Good             | Excellent   | Yes             |
| Incremental adoption       | Yes                          | Difficult        | Yes                         | Moderate     | Moderate         | Yes         | Yes             |
| CSS custom property tokens | First-class                  | Limited          | Manual                      | First-class  | Manual           | Manual      | Via config      |
| Zero-runtime path          | Yes (opt-in build plugins)   | Compiler default | Varies                      | Build output | Always           | Always      | Build output    |
| SSR support                | Yes                          | Yes              | Yes                         | Yes          | Yes              | Yes         | Yes             |
| Runtime overhead           | Minimal (off when extracted) | None             | Moderate                    | Low–none     | None             | None        | None            |

## Installation

```bash
npm install typestyles
# or
pnpm add typestyles
# or
yarn add typestyles
```

No bundler plugin required. Works with Vite, webpack, esbuild, Parcel, or any other bundler out of the box.

Optional Vite plugin for development niceties (style HMR, dead style detection):

```bash
npm install -D @typestyles/vite
```

```ts
// vite.config.ts
import { typeStyles } from '@typestyles/vite';

export default defineConfig({
  plugins: [typeStyles()],
});
```

## Examples

- Vite build integration: `examples/vite-app`
- Rollup build integration: `examples/rollup-app`
- Rolldown build integration: `examples/rolldown-app`
- Next.js integration: `examples/next-app`

## License

MIT
