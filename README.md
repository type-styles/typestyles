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
import { styles, tokens } from 'typestyles';

// Define design tokens as CSS custom properties
const color = tokens.create('color', {
  primary: '#0066ff',
  secondary: '#6b7280',
  surface: '#ffffff',
  text: '#111827',
});

// Create styles — class names match what you write
const button = styles.create('button', {
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

  outlined: {
    backgroundColor: 'transparent',
    border: `1px solid ${color.primary}`,
    color: color.primary,
  },

  small: {
    padding: '4px 12px',
    fontSize: '12px',
  },
});

// Use in JSX — clean, readable class names in the DOM
function Button({ variant, size, children }) {
  return <button className={button('base', variant, size)}>{children}</button>;
}

// Renders: <button class="button-base button-outlined button-small">
```

## Core Concepts

### Readable Class Names

TypeStyles generates class names that mirror your authored style names. If you write a style called `card.header`, you get a class name `card-header` in the DOM. What you see in your code is what you see in DevTools.

```tsx
const card = styles.create('card', {
  root: { /* ... */ },
  header: { /* ... */ },
  body: { /* ... */ },
});

<div className={card('root')}>         {/* class="card-root" */}
  <div className={card('header')}>     {/* class="card-header" */}
  <div className={card('body')}>       {/* class="card-body" */}
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
const layout = styles.create('layout', {
  container: {
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
  color: {
    surface: '#1a1a2e',
    text: '#e0e0e0',
  },
});

// Apply the theme to any subtree
<div className={theme}>{/* All children use dark theme values */}</div>;
```

### Incremental Adoption

TypeStyles works alongside existing CSS. Adopt it one component at a time.

```tsx
// Use TypeStyles and plain CSS together
import './legacy-styles.css';
import { styles } from 'typestyles';

const newComponent = styles.create('new-component', {
  root: {
    /* ... */
  },
});

function MyComponent() {
  return (
    <div className="legacy-class">
      <div className={newComponent('root')}>{/* New component using TypeStyles */}</div>
    </div>
  );
}
```

### Composing Styles

Styles compose naturally through multiple arguments or with plain CSS classes.

```tsx
const text = styles.create('text', {
  base: { fontFamily: 'system-ui' },
  bold: { fontWeight: 700 },
  muted: { color: color.secondary },
  heading: { fontSize: '24px', lineHeight: 1.2 },
});

// Compose multiple variants
<h1 className={text('base', 'heading', 'bold')}>
  {/* class="text-base text-heading text-bold" */}
</h1>

// Mix with plain CSS classes
<p className={text('base', 'muted') + ' legacy-margin'}>
  {/* class="text-base text-muted legacy-margin" */}
</p>
```

### Selectors and Nesting

Write CSS selectors naturally. Media queries, pseudo-classes, combinators — it all works.

```tsx
const nav = styles.create('nav', {
  root: {
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

const button = styles.create('button', {
  base: {
    padding: '8px 16px',
    backgroundColor: color.primary,
  },
});

export function Button({ children }) {
  return <button className={button('base')}>{children}</button>;
}
```

Or keep styles separate:

```tsx
// button.styles.ts
import { styles } from 'typestyles';
export const button = styles.create('button', {
  /* ... */
});

// Button.tsx
import { button } from './button.styles';
export function Button({ children }) {
  return <button className={button('base')}>{children}</button>;
}
```

## How It Works

TypeStyles operates at runtime with minimal overhead:

1. **`styles.create()`** registers style definitions and returns a selector function
2. **The selector function** composes class names from the variants you pass in
3. **CSS is injected** into a `<style>` element on first use (lazy injection)
4. **Class names** are deterministic and human-readable — derived from the names you author
5. **Tokens** are CSS custom properties, so they cascade naturally and work in plain CSS

### Style Injection

Styles are injected into the document lazily when a component using them first renders. TypeStyles uses a single managed `<style>` element and batches insertions for performance.

For SSR, TypeStyles provides a `collectStyles()` API to extract the CSS during server rendering:

```tsx
import { collectStyles } from 'typestyles/server';

const { html, css } = collectStyles(() => renderToString(<App />));
// Inject `css` into the <head> of the HTML document
```

## API Reference

### `styles.create(namespace, definitions)`

Creates a style group and returns a selector function.

```tsx
const card = styles.create('card', {
  root: {
    /* CSSProperties */
  },
  title: {
    /* CSSProperties */
  },
});

card('root'); // "card-root"
card('root', 'title'); // "card-root card-title"
card('root', condition && 'title'); // conditional application
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

### `tokens.createTheme(name, overrides)`

Creates a theme class that overrides token values.

```tsx
const dark = tokens.createTheme('dark', {
  color: {
    surface: '#1a1a2e',
    text: '#e0e0e0',
  },
});

<div className={dark}>   {/* class="theme-dark" */}
```

### `tokens.use(namespace)`

References tokens defined elsewhere. Useful for consuming shared tokens without importing the definition file.

```tsx
const color = tokens.use('color');
color.primary; // "var(--color-primary)"
```

## Comparison

| Feature                    | TypeStyles  | StyleX    | styled-components | Tailwind        |
| -------------------------- | ----------- | --------- | ----------------- | --------------- |
| Readable class names       | Yes         | No        | No                | Utility classes |
| Type-safe                  | Yes         | Yes       | Partial           | No              |
| No build step required     | Yes         | No        | Yes               | No              |
| Works with plain CSS       | Yes         | Limited   | Limited           | Yes             |
| Incremental adoption       | Yes         | Difficult | Yes               | Yes             |
| CSS custom property tokens | First-class | Limited   | Manual            | Via config      |
| SSR support                | Yes         | Yes       | Yes               | Yes             |
| Runtime overhead           | Minimal     | None      | Moderate          | None            |

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
