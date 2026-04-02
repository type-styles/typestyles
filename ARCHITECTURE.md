# Architecture

## Overview

TypeStyles is a runtime CSS-in-TypeScript library. It has three core subsystems:

```
┌─────────────────────────────────────────────────────┐
│                   Public API                        │
│  styles.component()  tokens.create()  tokens.use()  │
│  styles.class()      cx()                           │
└──────┬────────────────────┬─────────────────┬───────┘
       │                    │                 │
┌──────▼──────┐  ┌──────────▼──────┐  ┌──────▼──────┐
│   Style     │  │   Token         │  │   Theme     │
│   Registry  │  │   Registry      │  │   Engine    │
└──────┬──────┘  └──────────┬──────┘  └─────────────┘
       │                    │
┌──────▼────────────────────▼──────┐
│        CSS Injection             │
│   (StyleSheet Manager)           │
└──────────────────────────────────┘
```

## Package Structure

```
typestyles/
├── src/
│   ├── index.ts              # Public API exports
│   ├── styles.ts             # styles.class(), styles.hashClass(), cx(), compose, withUtils
│   ├── component.ts          # styles.component() — unified CVA-style component API
│   ├── tokens.ts             # tokens.create(), tokens.use() — CSS custom properties
│   ├── sheet.ts              # StyleSheet manager — CSS injection and batching
│   ├── css.ts                # CSS serialization — object → CSS string
│   ├── class-naming.ts       # Class name generation (semantic, hashed, atomic modes)
│   ├── types.ts              # TypeScript type definitions
│   ├── server.ts             # SSR support — collectStyles()
│   ├── global.ts             # global.style(), global.fontFace()
│   ├── keyframes.ts          # keyframes.create()
│   ├── vars.ts               # createVar(), assignVars()
│   ├── color.ts              # Color function helpers
│   ├── registry.ts           # Shared namespace duplicate detection
│   └── hmr.ts                # HMR invalidation helpers
├── packages/
│   ├── vite/                 # @typestyles/vite — Vite plugin (HMR + extraction)
│   ├── next/                 # @typestyles/next — Next.js integration
│   ├── astro/                # @typestyles/astro — Astro integration
│   ├── rollup/               # @typestyles/rollup — Rollup/Rolldown plugin
│   ├── props/                # @typestyles/props — Atomic CSS utilities
│   └── build-runner/         # @typestyles/build-runner — Build-time CSS extraction
├── package.json
├── tsconfig.json
└── README.md
```

## Core Subsystems

### 1. Component API (`component.ts`)

The unified API for creating styled components. Returns a **CVA-style** object that is both callable and destructurable.

**`styles.component(namespace, config)`**

Supports two config forms:

**Dimensioned variants** (multi-axis):

```ts
const button = styles.component('button', {
  base: { padding: '8px 16px' },
  variants: {
    intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
    size: { sm: { fontSize: '14px' }, lg: { fontSize: '18px' } },
  },
  compoundVariants: [{ variants: { intent: 'primary', size: 'lg' }, style: { fontWeight: 700 } }],
  defaultVariants: { intent: 'primary', size: 'sm' },
});

// Call as function — base always auto-applied
button(); // "button-base button-intent-primary button-size-sm"
button({ intent: 'ghost' }); // "button-base button-intent-ghost button-size-sm"

// Destructure individual class strings
button.base; // "button-base"
button['intent-primary']; // "button-intent-primary"
```

**Flat variants** (boolean toggles):

```ts
const card = styles.component('card', {
  base: { padding: '16px' },
  elevated: { boxShadow: '...' },
});

card(); // "card-base"
card({ elevated: true }); // "card-base card-elevated"
card.elevated; // "card-elevated"
```

**Implementation:**

- Detects config type (dimensioned vs flat vs slot) by presence of `variants`/`slots` keys
- Generates class names via `buildComponentClassName()`
- Serializes CSS and injects via StyleSheet Manager
- Returns a function with class map properties (via `Object.defineProperties`)

### 2. Style Utilities (`styles.ts`)

**`styles.class(name, properties)`** — Single class, no variants. Returns class name string.

**`styles.hashClass(properties, label?)`** — Deterministic hashed class from style object.

**`cx(...classes)`** — Built-in class name joining utility. Filters falsy values.

**`styles.compose(...fns)`** — Compose multiple component functions or strings.

**`styles.withUtils(utils)`** — Create utility-aware styles API (like Stitches' utils).

### 3. Token Registry (`tokens.ts`)

Manages CSS custom properties as typed design tokens.

**`tokens.create(namespace, values)`**

- Takes a namespace and flat key-value map
- Generates CSS custom properties: `--{namespace}-{key}: {value}`
- Injects a `:root` rule via the StyleSheet Manager
- Returns a proxy object where property access yields `var(--{namespace}-{key})`

**`tokens.use(namespace)`** — References tokens defined elsewhere (no CSS injection).

**`tokens.createTheme(name, overrides)`** — Creates theme class with overridden custom properties.

### 4. StyleSheet Manager (`sheet.ts`)

Handles CSS injection into the document.

**Responsibilities:**

- Maintains a single `<style>` element in the document `<head>`
- Batches CSS rule insertions using microtasks
- Deduplicates rules by key
- Provides hooks for SSR collection
- Supports HMR invalidation

**Insertion strategy:**

```
1. styles.component() or tokens.create() called
2. CSS string generated by css.ts
3. Rule queued in insertion buffer
4. On next microtask: all queued rules inserted via CSSStyleSheet.insertRule()
```

### 5. CSS Serialization (`css.ts`)

Converts style objects to CSS strings.

- camelCase → kebab-case property conversion
- Nested selectors (`'&:hover'`, `'& .child'`, `'[data-state]'`)
- At-rules (`@media`, `@container`, `@supports`)
- Selector lists (`'&[data-state="open"], [aria-expanded="true"]'`)

### 6. Class Naming (`class-naming.ts`)

Three naming modes:

- **Semantic** (default): `button-intent-primary` — human-readable
- **Hashed**: `ts-button-a1b2c3d` — collision-safe with readable slug
- **Atomic**: `ts-a1b2c3d` — shortest, best for heavy reuse

## Data Flow

### Render Path

```
1. Module loads → styles.component('card', { base: {...}, ... }) called
2. Component module generates CSS via css.ts, builds class name map
3. CSS rules queued in StyleSheet Manager
4. Component renders → card() or card({ elevated: true }) called
5. Returns composed class string: "card-base card-elevated"
6. On next microtask, StyleSheet Manager inserts all queued CSS rules
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

### Why a unified component API?

Previous versions had `styles.create()` (varargs) and `styles.component()` (object args) as separate APIs. This caused confusion: different calling conventions, different `base` behavior, incompatible composition. The unified `styles.component()` provides one mental model: callable + destructurable, base always auto-applied, typed variants.

### Why runtime?

Static extraction (StyleX, Vanilla Extract) offers zero-runtime cost but imposes authoring constraints. TypeStyles prioritizes DX and flexibility. The runtime cost is minimal — class name composition is string concatenation, and CSS injection happens once per style definition.

### Why readable class names?

Hashed/minified class names make debugging painful. TypeStyles uses authored names directly. The tradeoff is potential name collisions, handled by namespace prefixing and development-mode duplicate detection.

### Why CSS custom properties for tokens?

- They cascade through the DOM (theming for free)
- They work in plain CSS files (interop)
- They're inspectable in DevTools
- No runtime JS needed to resolve values

### Why not tagged template literals?

Template literal APIs (`css\`color: red\``) lose type safety. Object syntax enables autocomplete, type checking, and refactoring support from TypeScript without any editor plugins.

## Performance Considerations

- **Style injection is lazy**: CSS isn't generated or injected until a module is loaded
- **Callable objects are fast**: class name composition is string concatenation and map lookups
- **CSS rules are inserted once**: duplicate calls with the same namespace are deduplicated
- **Batch insertion**: multiple rules are batched into a single DOM operation per microtask
- **No CSSOM reads**: TypeStyles only writes to the CSSOM, never reads
