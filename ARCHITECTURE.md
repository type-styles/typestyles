# Architecture

## Overview

TypeStyles is a runtime CSS-in-TypeScript library. It has three core subsystems:

```
┌─────────────────────────────────────────────────┐
│                  Public API                      │
│  styles.create()  tokens.create()  tokens.use()  │
└──────┬────────────────┬─────────────────┬────────┘
       │                │                 │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   Style     │  │   Token     │  │   Theme     │
│   Registry  │  │   Registry  │  │   Engine    │
└──────┬──────┘  └──────┬──────┘  └─────────────┘
       │                │
┌──────▼────────────────▼──────┐
│        CSS Injection         │
│   (StyleSheet Manager)       │
└──────────────────────────────┘
```

## Package Structure

```
typestyles/
├── src/
│   ├── index.ts              # Public API exports
│   ├── styles.ts             # styles.create() — style registration and selector functions
│   ├── tokens.ts             # tokens.create(), tokens.use() — CSS custom properties
│   ├── theme.ts              # tokens.createTheme() — theme class generation
│   ├── sheet.ts              # StyleSheet manager — CSS injection and batching
│   ├── css.ts                # CSS serialization — object → CSS string
│   ├── types.ts              # TypeScript type definitions for CSS properties
│   └── server.ts             # SSR support — collectStyles()
├── packages/
│   └── vite/                 # @typestyles/vite — optional Vite plugin
│       ├── src/
│       │   └── index.ts
│       └── package.json
├── package.json
├── tsconfig.json
└── README.md
```

## Core Subsystems

### 1. Style Registry (`styles.ts`)

Responsible for registering style definitions and returning selector functions.

**`styles.create(namespace, definitions)`**

- Takes a namespace string and a map of variant names → CSS property objects
- Generates deterministic class names: `{namespace}-{variant}`
- Lazily serializes CSS and hands it to the StyleSheet Manager
- Returns a selector function that composes class names

```
Input:  styles.create('button', { base: { color: 'red' }, large: { fontSize: '18px' } })
Output: function(...variants) → "button-base button-large"

Generated CSS:
  .button-base { color: red; }
  .button-large { font-size: 18px; }
```

**Selector function behavior:**

```ts
type SelectorFn = (...variants: (string | false | null | undefined)[]) => string;
```

- Accepts variant names as arguments
- Falsy values are filtered out (enables conditional application)
- Returns a space-separated class name string

**Duplicate detection:**

If `styles.create()` is called with the same namespace twice, it warns in development and appends a suffix to avoid collisions. The developer should fix this — human-readable names only work if they're unique.

### 2. Token Registry (`tokens.ts`)

Manages CSS custom properties as typed design tokens.

**`tokens.create(namespace, values)`**

- Takes a namespace and flat key-value map
- Generates CSS custom properties: `--{namespace}-{key}: {value}`
- Injects a `:root` rule via the StyleSheet Manager
- Returns a proxy object where property access yields `var(--{namespace}-{key})`

```
Input:  tokens.create('color', { primary: '#0066ff' })
Output: { primary: 'var(--color-primary)' }  (typed as CSSTokenValue)

Generated CSS:
  :root { --color-primary: #0066ff; }
```

**`tokens.use(namespace)`**

- Returns a proxy that produces `var(--{namespace}-{key})` references
- Does NOT inject CSS — assumes the tokens are defined elsewhere
- Useful for consuming shared tokens from a different entry point

**Type generation:**

Token objects are typed so that:

- Property access returns `string` (the `var()` reference)
- Only defined keys are accessible (typos caught at compile time)
- Values are usable anywhere a CSS string value is expected

### 3. Theme Engine (`theme.ts`)

Handles theme variations via CSS custom property overrides.

**`tokens.createTheme(name, overrides)`**

- Takes a theme name and a map of `{ tokenNamespace: { key: newValue } }`
- Generates a CSS rule with a class selector that overrides custom properties
- Returns the class name string

```
Input:  tokens.createTheme('dark', { color: { primary: '#66b3ff' } })
Output: "theme-dark"

Generated CSS:
  .theme-dark { --color-primary: #66b3ff; }
```

Themes cascade naturally because they use CSS custom properties. Apply a theme class to any element and all descendants pick up the overrides.

### 4. StyleSheet Manager (`sheet.ts`)

Handles CSS injection into the document.

**Responsibilities:**

- Maintains a single `<style>` element in the document `<head>`
- Batches CSS rule insertions using `requestAnimationFrame` (or microtask)
- Deduplicates rules (same namespace + variant = skip)
- Provides hooks for SSR collection
- In development, supports replacing rules for HMR

**Insertion strategy:**

```
1. styles.create() or tokens.create() called
2. CSS string generated by css.ts
3. Rule queued in insertion buffer
4. On next frame: all queued rules inserted via CSSStyleSheet.insertRule()
```

Using `insertRule()` rather than textContent manipulation is important for performance — it avoids reparsing the entire stylesheet on each insertion.

**SSR mode:**

When `collectStyles()` wraps a render, the StyleSheet Manager switches to collection mode — rules are captured to a string buffer instead of injected into the DOM.

### 5. CSS Serialization (`css.ts`)

Converts style objects to CSS strings.

**Handles:**

- camelCase → kebab-case property conversion (`fontSize` → `font-size`)
- Nested selectors (`'&:hover'`, `'& .child'`)
- At-rules (`@media`, `@container`, `@supports`)
- Vendor prefixes (minimal — only where still needed)

```
Input:
{
  fontSize: '14px',
  '&:hover': { color: 'blue' },
  '@media (max-width: 768px)': { display: 'none' }
}

Output:
.button-base { font-size: 14px; }
.button-base:hover { color: blue; }
@media (max-width: 768px) { .button-base { display: none; } }
```

### 6. Type Definitions (`types.ts`)

Provides TypeScript types for CSS properties. This is a key part of the DX.

**Approach:**

- Use `csstype` as the base for CSS property types (widely maintained, tracks the spec)
- Extend with token-aware types — any property that accepts a string also accepts a token reference
- Style definition type: `Record<string, CSSProperties>` where `CSSProperties` allows nested selectors

```ts
interface CSSProperties extends CSS.Properties<string | number> {
  [selector: `&${string}`]: CSSProperties;
  [atRule: `@${string}`]: CSSProperties;
}
```

## Data Flow

### Render Path

```
1. Module loads → styles.create('card', { root: { ... } }) called
2. Style Registry stores definitions, generates CSS via css.ts
3. CSS queued in StyleSheet Manager
4. Component renders → card('root') called
5. Selector function returns "card-root" (string)
6. React sets className="card-root" on DOM element
7. On next frame, StyleSheet Manager inserts all queued CSS rules
```

### Token Path

```
1. Module loads → tokens.create('color', { primary: '#0066ff' }) called
2. Token Registry generates :root CSS rule
3. CSS queued in StyleSheet Manager
4. Other modules use color.primary → resolves to "var(--color-primary)"
5. This string is embedded in style definitions or used directly
```

## Design Decisions

### Why runtime?

Static extraction (StyleX, Vanilla Extract) offers zero-runtime cost but imposes authoring constraints: no dynamic values, specific import patterns, build plugin required. TypeStyles prioritizes DX and flexibility. The runtime cost is minimal — class name composition is string concatenation, and CSS injection happens once per style definition.

### Why readable class names?

Hashed/minified class names make debugging painful. TypeStyles uses authored names directly. The tradeoff is potential name collisions, which we handle with:

- Namespace prefixing (the first arg to `styles.create`)
- Development-mode duplicate detection and warnings
- Convention: namespace = component/file name

### Why CSS custom properties for tokens?

- They cascade through the DOM (theming for free)
- They work in plain CSS files (interop)
- They're inspectable in DevTools
- No runtime JS needed to resolve values
- They bridge the gap between TypeStyles and non-TypeStyles code

### Why not tagged template literals?

Template literal APIs (`css\`color: red\``) lose type safety. Object syntax enables autocomplete, type checking, and refactoring support from TypeScript without any editor plugins.

## Performance Considerations

- **Style injection is lazy**: CSS isn't generated or injected until a component using it renders
- **Selector functions are fast**: they do string concatenation and filtering of falsy values
- **CSS rules are inserted once**: duplicate calls to `styles.create` with the same namespace are deduplicated
- **Batch insertion**: multiple rules are batched into a single DOM operation per frame
- **No CSSOM reads**: TypeStyles only writes to the CSSOM, never reads, avoiding forced style recalculation

## SSR Strategy

```tsx
// server.ts
import { collectStyles } from 'typestyles/server';
import { renderToString } from 'react-dom/server';

const { html, css } = collectStyles(() => renderToString(<App />));

const fullHtml = `
  <html>
    <head><style id="typestyles">${css}</style></head>
    <body>${html}</body>
  </html>
`;
```

On the client, TypeStyles detects the existing `<style id="typestyles">` element and reuses it, avoiding duplicate injection.

## Vite Plugin (Optional)

The `@typestyles/vite` plugin provides:

- **HMR**: When a style file changes, only the affected CSS rules are replaced (no full page reload)
- **Dead style detection**: Warns when styles are defined but never used (dev mode)
- **Extraction (future)**: Optional build-time extraction of static styles to a CSS file for production

The plugin is optional. TypeStyles works without it.
