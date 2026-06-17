# Architecture

## Overview

TypeStyles is a CSS-in-TypeScript library that supports both runtime injection and zero-runtime build extraction. It has four core subsystems:

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Public API                                  │
│  styles.component()  tokens.create()   createTypeStyles()            │
│  styles.class()      tokens.createTheme()  createVar() / assignVars()│
│  cx()  compose()     tokens.when / colorMode   container()           │
│  global.style()      has() / is() / where()    keyframes.create()    │
└──────┬─────────────────────┬──────────────────────┬──────────────────┘
       │                     │                      │
┌──────▼──────┐  ┌───────────▼──────┐  ┌────────────▼────────────┐
│   Style     │  │   Token          │  │   Theme                 │
│   Registry  │  │   Registry       │  │   Engine                │
│             │  │                  │  │   (conditions, modes)   │
└──────┬──────┘  └───────────┬──────┘  └────────────┬────────────┘
       │                     │                      │
┌──────▼─────────────────────▼──────────────────────▼──────────────┐
│                     CSS Emission                                  │
│   Runtime: StyleSheet Manager (sheet.ts)                          │
│   Build:   collectStylesFromModules (build.ts → build-runner)     │
│   SSR:     collectStyles / getRegisteredCss (server.ts)           │
└──────────────────────────────────────────────────────────────────┘
```

## Repository Structure

```
typestyles/                         # monorepo root
├── packages/
│   ├── typestyles/                 # Core library (npm: typestyles)
│   │   └── src/
│   │       ├── index.ts            # Public API exports
│   │       ├── styles.ts           # styles.class(), hashClass(), compose, withUtils, createStyles
│   │       ├── component.ts        # styles.component() — CVA-style component API
│   │       ├── component-config-context.ts  # ctx.var / ctx.vars for component-internal properties
│   │       ├── tokens.ts           # tokens.create(), tokens.use() — CSS custom properties
│   │       ├── theme.ts            # createTheme, createDarkMode, when, colorMode
│   │       ├── create-type-styles.ts  # createTypeStyles() — unified factory (styles + tokens + layers)
│   │       ├── create-global.ts    # createGlobal() — global style API factory
│   │       ├── sheet.ts            # StyleSheet manager — runtime CSS injection and batching
│   │       ├── sheet-context.ts    # AsyncLocalStorage isolation for concurrent SSR
│   │       ├── sheet-node.ts       # Node.js sheet shim (no DOM)
│   │       ├── css.ts              # CSS serialization — style object → CSS string
│   │       ├── class-naming.ts     # Class name generation (semantic, hashed, compact, atomic)
│   │       ├── atomic-decompose.ts # Per-declaration decomposition for atomic mode
│   │       ├── layers.ts           # @layer cascade layer support
│   │       ├── container.ts        # Container query helpers
│   │       ├── relational-pseudo.ts # has(), is(), where() helpers
│   │       ├── at-rule-block.ts    # Generic at-rule block helper
│   │       ├── cx.ts              # cx() class name joining utility
│   │       ├── vars.ts            # createVar(), assignVars() — dynamic CSS variables
│   │       ├── keyframes.ts       # keyframes.create()
│   │       ├── global.ts          # globalStyle(), globalFontFace(), globalApply()
│   │       ├── globals.ts         # Built-in global style recipes (resets, etc.)
│   │       ├── css-math.ts        # calc(), clamp() typed helpers
│   │       ├── css-content.ts     # content() helper
│   │       ├── color.ts           # Color function helpers (subpath: typestyles/color)
│   │       ├── color-entry.ts     # Subpath entry for typestyles/color
│   │       ├── server.ts          # SSR: collectStyles, streaming helpers
│   │       ├── build.ts           # Build-time: collectStylesFromModules
│   │       ├── registry.ts        # Namespace duplicate detection
│   │       ├── hmr.ts             # HMR invalidation helpers
│   │       └── types.ts           # TypeScript type definitions
│   ├── vite/                      # @typestyles/vite — Vite plugin (HMR + extraction)
│   ├── next/                      # @typestyles/next — Next.js integration (App Router, RSC)
│   ├── astro/                     # @typestyles/astro — Astro integration
│   ├── rollup/                    # @typestyles/rollup — Rollup/Rolldown plugin
│   ├── esbuild/                   # @typestyles/esbuild — esbuild plugin
│   ├── webpack/                   # @typestyles/webpack — webpack plugin
│   ├── build-runner/              # @typestyles/build-runner — shared extraction engine
│   ├── props/                     # @typestyles/props — atomic CSS utility props
│   ├── open-props/                # @typestyles/open-props — Open Props token integration
│   ├── eslint-plugin/             # @typestyles/eslint-plugin — lint rules
│   └── migrate/                   # @typestyles/migrate — codemod from styled-components/Emotion
├── examples/
│   ├── next-app/                  # Next.js App Router example
│   ├── vite-app/                  # Vite example
│   ├── rollup-app/                # Rollup example
│   ├── rolldown-app/              # Rolldown example
│   └── design-system/             # Design system example
└── docs/                          # Astro docs site
```

## Core Subsystems

### 1. Component API (`component.ts`)

The primary API for creating styled components. Returns a CVA-style object that is both callable and destructurable.

**`styles.component(namespace, config)`**

Supports three config forms:

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

button(); // "button-base button-intent-primary button-size-sm"
button({ intent: 'ghost' }); // "button-base button-intent-ghost button-size-sm"
button.base; // "button-base"
```

**Flat variants** (boolean toggles):

```ts
const card = styles.component('card', {
  base: { padding: '16px' },
  elevated: { boxShadow: '...' },
});

card({ elevated: true }); // "card-base card-elevated"
```

**Function config** (component-internal custom properties):

```ts
const badge = styles.component('badge', (c) => {
  const textColor = c.var('textColor', { syntax: '<color>' });
  return {
    base: { color: textColor.var },
    variants: {
      tone: { danger: { [textColor.name]: 'red' } },
    },
  };
});
```

**Implementation:**

- Detects config type (dimensioned vs flat vs slot) by presence of `variants`/`slots` keys
- Function configs receive a `ComponentConfigContext` for registering scoped `@property` vars
- Generates class names via `buildComponentClassName()`
- Serializes CSS and injects via the sheet
- Returns a callable object with class map properties (via `Object.defineProperties`)

### 2. Style Utilities (`styles.ts`, `cx.ts`)

**`styles.class(name, properties)`** — Single class, no variants. Returns class name string.

**`styles.hashClass(properties, label?)`** — Deterministic hashed class from style object.

**`cx(...classes)`** — Built-in class name joining utility. Filters falsy values.

**`styles.compose(...fns)`** — Compose multiple component functions or strings.

**`createStyles({ scopeId, mode, utils, layers })`** — Create an isolated styles instance. Preferred for packages and micro-frontends.

**`styles.withUtils(utils)`** — Attach shorthand expanders to the default instance.

### 3. Token System (`tokens.ts`, `theme.ts`)

Manages CSS custom properties as typed design tokens.

**`tokens.create(namespace, values)`**

- Accepts flat or nested value maps
- Generates CSS custom properties: `--{scopeId}-{namespace}-{key}: {value}`
- Injects a `:root` rule via the sheet
- Returns a proxy where property access yields `var(--{namespace}-{key})`

**`tokens.use(namespace)`** — References tokens defined elsewhere (no CSS injection).

**`tokens.createTheme(name, config)`** — Creates a theme surface (`.theme-{name}`) with `base` overrides and optional `modes` or `colorMode` layers. Returns a `ThemeSurface` with `className`, `name`, and `toString()`.

**`tokens.createDarkMode(name, overrides)`** — Shorthand for a single media-query dark mode.

**`tokens.when`** — Condition builders: `.media()`, `.attr()`, `.className()`, `.selector()`, `.and()`, `.or()`, `.not()`, `.prefersDark`, `.prefersLight`.

**`tokens.colorMode`** — Presets: `.mediaOnly()`, `.attributeOnly()`, `.mediaOrAttribute()`, `.systemWithLightDarkOverride()`.

### 4. Unified Factory (`create-type-styles.ts`)

**`createTypeStyles({ scopeId, mode, layers, tokenLayer })`** — Single factory that returns `{ styles, tokens, global }` sharing one `scopeId` and cascade layer configuration. Preferred for design systems where tokens and styles must share layer semantics.

### 5. StyleSheet Manager (`sheet.ts`, `sheet-context.ts`)

Handles CSS injection at runtime and collection for SSR/build.

**Runtime responsibilities:**

- Maintains a single `<style>` element in the document `<head>`
- Batches CSS rule insertions using microtasks
- Deduplicates rules by key
- Supports HMR invalidation

**SSR/build responsibilities:**

- `sheet-context.ts` uses `AsyncLocalStorage` for request-isolated CSS collection
- `server.ts` exports `collectStyles()`, `typestylesStyleHtml()`, `injectStylesIntoHtml()`, `streamingDocumentShell()` for SSR
- `build.ts` exports `collectStylesFromModules()` for zero-runtime extraction

**Insertion strategy (runtime):**

```
1. styles.component() or tokens.create() called
2. CSS string generated by css.ts
3. Rule queued in insertion buffer with a stable string key
4. On next microtask: all queued rules inserted via CSSStyleSheet.insertRule()
```

### 6. CSS Serialization (`css.ts`)

Converts style objects to CSS strings.

- camelCase → kebab-case property conversion
- Unitless property detection (with up-to-date allowlist)
- Nested selectors (`'&:hover'`, `'& .child'`, `'[data-state]'`)
- At-rules (`@media`, `@container`, `@supports`, `@layer`)
- Selector lists (`'&[data-state="open"], [aria-expanded="true"]'`)

### 7. Class Naming (`class-naming.ts`, `atomic-decompose.ts`)

Four naming modes:

- **Semantic** (default): `button-intent-primary` — human-readable, debuggable
- **Hashed**: `ts-button-a1b2c3d` — collision-safe with readable slug
- **Compact**: `ts-a1b2c3d` — hash-only for whole style objects (shortest single-class output)
- **Atomic**: per-declaration classes with cross-component dedup (like StyleX); identical `color: red` declarations across the codebase share one class

### 8. Cascade Layers (`layers.ts`)

Opt-in `@layer` support. When `layers` is passed to a factory (`createTypeStyles`, `createStyles`), the API gains typed `layer` options on `styles.class`, `styles.hashClass`, and `styles.component`. Layer order is declared once on the factory and emitted as a single `@layer` preamble.

### 9. Build Extraction (`build-runner/`)

The `@typestyles/build-runner` package provides shared infrastructure for zero-runtime CSS extraction used by all bundler plugins (Vite, Next, Rollup, esbuild, webpack). It discovers convention entry files, executes them in Node to collect CSS, and writes static `.css` output. A `verifyTypestylesBuild()` API checks that extracted CSS covers all registered styles.

## Data Flow

### Runtime Path

```
1. Module loads → styles.component('card', { ... }) called
2. CSS generated via css.ts; class name map built via class-naming.ts
3. CSS rules queued in StyleSheet Manager with stable dedupe keys
4. Component renders → card() or card({ elevated: true }) called
5. Returns composed class string: "card-base card-elevated"
6. On next microtask, StyleSheet Manager inserts all queued CSS rules
```

### Build Extraction Path

```
1. Build tool (Vite/Next/Rollup/esbuild/webpack) invokes build-runner
2. build-runner discovers convention entry files
3. Entries are executed in Node — styles/tokens register CSS via sheet
4. collectStylesFromModules() captures all generated CSS
5. CSS written to static file(s); runtime injection disabled in production
6. App code still calls card() etc. — returns class strings as usual
```

### Token Path

```
1. Module loads → tokens.create('color', { primary: '#0066ff' }) called
2. Token Registry generates :root CSS rule with custom properties
3. CSS queued in StyleSheet Manager (or collected by build extraction)
4. Other modules use color.primary → resolves to "var(--color-primary)"
5. This string is embedded in style definitions or used directly
```

## Design Decisions

### Why runtime AND build extraction?

TypeStyles started as a runtime library prioritizing DX and flexibility. Static extraction (StyleX, Vanilla Extract) offers zero-runtime cost but imposes authoring constraints. TypeStyles provides both: the same authoring APIs work in runtime mode (dev, prototyping, dynamic styles) and build mode (production, zero-runtime). The build plugins extract CSS at compile time and disable client-side injection, giving teams a migration path without changing application code.

### Why readable class names?

Hashed/minified class names make debugging painful. TypeStyles uses authored names by default (`button-intent-primary`). The tradeoff is potential name collisions, handled by `scopeId` prefixing, namespace duplicate detection (dev-mode errors at runtime, build-time errors in bundler plugins), and optional hashed/compact/atomic modes.

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
- **Atomic dedup**: in atomic mode, identical declarations share one class across all components
- **Build extraction**: in production, CSS is a static file — no runtime injection cost at all
