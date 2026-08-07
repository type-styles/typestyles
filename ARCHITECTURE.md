# Architecture

## Overview

TypeStyles is a CSS-in-TypeScript library that supports both runtime injection and zero-runtime build extraction. It has four core subsystems:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Public API                                      │
│  styles.component()  styles.class()  styles.hashClass()  styles.compose()    │
│  styles.override()   styles.scope()  styles.withUtils()  createStyles()      │
│  tokens.create()     tokens.declare()  tokens.use()    createTokens()        │
│  tokens.createTheme()  tokens.when / colorMode   createTypeStyles()          │
│  createVar() / assignVars()   global.style()   keyframes.create()            │
│  cx()  container()  supports()  has() / is() / where()  atProperty()         │
│  mediaQueries  colorModes  breakpoints   conditional()                       │
└──────┬─────────────────────┬──────────────────────┬──────────────────────────┘
       │                     │                      │
┌──────▼──────┐  ┌───────────▼──────┐  ┌────────────▼────────────┐
│   Style     │  │   Token          │  │   Theme                 │
│   Registry  │  │   Registry       │  │   Engine                │
│             │  │                  │  │   (conditions, modes,   │
│             │  │                  │  │    overrides, @scope)   │
└──────┬──────┘  └───────────┬──────┘  └────────────┬────────────┘
       │                     │                      │
┌──────▼─────────────────────▼──────────────────────▼──────────────┐
│                     CSS Emission                                      │
│   Runtime: StyleSheet Manager (sheet.ts)                            │
│   Build:   collectStylesFromModules (build.ts → build-runner)       │
│   SSR:     collectStyles / getRegisteredCss (server.ts, sheet.ts)   │
└──────────────────────────────────────────────────────────────────────┘
```

## Repository Structure

```
typestyles/                         # monorepo root
├── packages/
│   ├── typestyles/                 # Core library (npm: typestyles)
│   │   └── src/
│   │       ├── index.ts            # Public API exports
│   │       ├── styles.ts           # styles.class/hashClass/component/compose/override/scope
│   │       ├── component.ts        # styles.component() — CVA-style component API
│   │       ├── component-config-context.ts  # ctx.var / ctx.vars for component-internal properties
│   │       ├── component-meta.ts   # Component metadata introspection (getComponentMeta)
│   │       ├── component-var-overrides.ts   # Variant-driven @property overrides
│   │       ├── tokens.ts           # tokens.create/declare/use — CSS custom properties
│   │       ├── token-schema.ts     # Schema validation for tokens.declare()
│   │       ├── token-naming.ts     # Scoped --* custom property name templates
│   │       ├── token-color-modes.ts # Theme merge helpers, light-dark() token support
│   │       ├── theme.ts            # createTheme, createDarkMode, when, colorMode
│   │       ├── condition-compile.ts # Theme condition → selector/CSS compilation
│   │       ├── create-type-styles.ts  # createTypeStyles() — unified factory
│   │       ├── create-global.ts    # createGlobal() — global style API factory
│   │       ├── sheet.ts            # StyleSheet manager — runtime CSS injection and batching
│   │       ├── sheet-context.ts    # AsyncLocalStorage isolation for concurrent SSR/build
│   │       ├── sheet-node.ts       # Node.js sheet shim (no DOM)
│   │       ├── serialize-style.ts  # Style object → CSS rules (selectors, responsive, color modes)
│   │       ├── css.ts              # Low-level CSS helpers (typestyles/css subpath)
│   │       ├── class-naming.ts     # Class name generation (semantic, hashed, compact, atomic, bem, template, attribute)
│   │       ├── atomic-decompose.ts # Per-declaration decomposition for atomic mode
│   │       ├── layers.ts           # @layer cascade layer support
│   │       ├── breakpoints.ts      # Responsive { base, md, lg } value shorthand
│   │       ├── color-modes.ts      # { light, dark } value shorthand → light-dark()
│   │       ├── media.ts            # Breakpoint-aware media query helpers
│   │       ├── media-queries.ts    # mediaQueries preset map
│   │       ├── container.ts        # Container query helpers
│   │       ├── supports.ts         # @supports query helpers
│   │       ├── relational-pseudo.ts # has(), is(), where() helpers
│   │       ├── at-rule-block.ts    # Generic at-rule block helper
│   │       ├── at-property.ts      # @property registration helper
│   │       ├── registered-property.ts / custom-properties.ts
│   │       ├── cx.ts               # cx() class name joining utility
│   │       ├── vars.ts             # createVar(), assignVars() — dynamic CSS variables
│   │       ├── keyframes.ts        # keyframes.create()
│   │       ├── global.ts           # globalStyle(), globalFontFace(), globalApply()
│   │       ├── globals.ts          # Built-in global style recipes (resets, etc.)
│   │       ├── override.ts         # styles.override() — theme/context variant overrides
│   │       ├── scope.ts            # styles.scope() — proximity overrides via CSS @scope
│   │       ├── css-math.ts         # calc(), clamp() typed helpers
│   │       ├── css-content.ts      # content() helper
│   │       ├── color.ts            # Color function helpers (subpath: typestyles/color)
│   │       ├── color-scale.ts      # Color scale helpers (subpath: typestyles/color-scale)
│   │       ├── token-scale.ts      # Token scale helpers (subpath: typestyles/token-scale)
│   │       ├── server.ts           # SSR: collectStyles, streaming helpers
│   │       ├── build.ts            # Build-time: collectStylesFromModules
│   │       ├── registry.ts         # Namespace duplicate detection
│   │       ├── hmr.ts              # HMR invalidation helpers
│   │       ├── testing.ts          # Test helpers (subpath: typestyles/testing)
│   │       └── types.ts            # TypeScript type definitions
│   ├── vite/                      # @typestyles/vite — Vite plugin (HMR + extraction)
│   ├── next/                      # @typestyles/next — Next.js integration (App Router, RSC)
│   ├── astro/                     # @typestyles/astro — Astro integration
│   ├── rollup/                    # @typestyles/rollup — Rollup/Rolldown plugin
│   ├── esbuild/                   # @typestyles/esbuild — esbuild plugin
│   ├── webpack/                   # @typestyles/webpack — webpack plugin
│   ├── build-runner/              # @typestyles/build-runner — shared extraction engine
│   ├── react/                     # @typestyles/react — styled API, css prop, JSX runtime
│   ├── props/                     # @typestyles/props — atomic CSS utility props
│   ├── open-props/                # @typestyles/open-props — Open Props token integration
│   ├── eslint-plugin/             # @typestyles/eslint-plugin — lint rules
│   ├── migrate/                   # @typestyles/migrate — codemod from styled-components/Emotion
│   └── cli/                       # @typestyles/cli — snapshot / semver tooling
├── examples/
│   ├── vite-app/                  # React + Vite (HMR + extraction)
│   ├── next-app/                  # Next.js App Router + build extraction
│   ├── vue-app/                   # Vue 3 + Vite extraction
│   ├── svelte-app/                # Svelte 5 + Vite extraction
│   ├── esbuild-app/               # esbuild extraction
│   ├── rollup-app/                # Rollup extraction
│   ├── rolldown-app/              # Rolldown extraction
│   ├── parcel-app/                # Runtime-only (no bundler plugin)
│   ├── typewind/                  # Tailwind-style utilities via styles.class
│   ├── design-system/             # Framework-agnostic tokens and recipes (shared library)
│   └── react-design-system/       # React components on the design system
└── docs/                          # Astro docs site
```

### Core subpath exports

The `typestyles` package also publishes focused entry points: `typestyles/server`, `typestyles/build`, `typestyles/hmr`, `typestyles/globals`, `typestyles/css`, `typestyles/color`, `typestyles/color-scale`, `typestyles/token-scale`, and `typestyles/testing`.

## Core Subsystems

### 1. Component API (`component.ts`)

The primary API for creating styled components. Returns a CVA-style object that is both callable and destructurable.

**`styles.component(namespace, config)`**

Supports four config forms:

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

**Slot recipes** (multi-part components):

```ts
const dialog = styles.component('dialog', {
  slots: ['overlay', 'content'] as const,
  base: { overlay: { position: 'fixed' }, content: { padding: '1rem' } },
  variants: {
    size: { sm: { content: { maxWidth: '24rem' } }, lg: { content: { maxWidth: '48rem' } } },
  },
});

dialog().content; // class string for the content slot
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
- Generates class names via `buildComponentClassName()` (mode-dependent — see Class Naming)
- Serializes CSS via `serialize-style.ts` and injects via the sheet
- Returns a callable object with class map properties (via `Object.defineProperties`)
- With `mode: 'attribute'`, dimensioned and slot components return `{ className, attrs, props }` instead of class strings

### 2. Style Utilities (`styles.ts`, `cx.ts`)

**`styles.class(name, properties)`** — Single class, no variants. Returns class name string.

**`styles.hashClass(properties, label?)`** — Deterministic hashed class from style object.

**`cx(...classes)`** — Built-in class name joining utility. Filters falsy values.

**`styles.compose(...fns)`** — Compose multiple component functions or strings. Forwards variant selections to composed components.

**`styles.override(component, config)`** — Emit context-scoped variant overrides (e.g. under `.theme-acme`) without redefining the component. Supports `conditional()` for theme conditions.

**`styles.scope(opts, className, overrides)`** — Proximity-correct overrides via CSS `@scope`.

**`createStyles({ scopeId, mode, prefix, layers, breakpoints, colorModes, utils })`** — Create an isolated styles instance. Preferred for packages and micro-frontends.

**`styles.withUtils(utils)`** — Attach shorthand expanders to a styles instance.

### 3. Token System (`tokens.ts`, `theme.ts`)

Manages CSS custom properties as typed design tokens.

**`tokens.create(namespace, values)`**

- Accepts flat or nested value maps (or values inferred from a prior `declare()` schema)
- Generates CSS custom properties: `--{scopeId}-{namespace}-{key}` (or unscoped `--{key}` when no `scopeId`)
- Injects a `:root` rule via the sheet
- Returns a proxy where property access yields `var(--…)` references

**`tokens.declare(namespace, schema)`** — Schema-first token namespaces with typed leaves, optional `@property` syntax metadata, and `tokens.use()` refs before `create()` runs.

**`tokens.use(namespace)`** — References tokens defined elsewhere (no CSS injection).

**`tokens.createTheme(name, config)`** — Creates a theme surface (`.theme-{name}`) with `base` overrides and optional `modes` or `colorMode` layers. Returns a `ThemeSurface` with `className`, `name`, and `toString()`.

**`tokens.createDarkMode(name, overrides)`** — Shorthand for a single media-query dark mode.

**`tokens.when`** — Condition builders: `.media()`, `.attr()`, `.className()`, `.selector()`, `.and()`, `.or()`, `.not()`, `.prefersDark`, `.prefersLight`.

**`tokens.colorMode`** — Presets: `.mediaOnly()`, `.attributeOnly()`, `.mediaOrAttribute()`, `.systemWithLightDarkOverride()`.

`createTheme`, `createDarkMode`, `when`, and `colorMode` are also exported from the package root for direct import.

### 4. Unified Factory (`create-type-styles.ts`)

**`createTypeStyles({ scopeId, mode, layers, tokenLayer, breakpoints, colorModes, utils, globalLayer })`** — Single factory that returns `{ styles, tokens, global }` sharing one `scopeId` and cascade layer configuration. Preferred for design systems where tokens and styles must share layer semantics. Supports `mode: 'attribute'` and `withUtils` on the returned `styles` API.

### 5. StyleSheet Manager (`sheet.ts`, `sheet-context.ts`)

Handles CSS injection at runtime and collection for SSR/build.

**Runtime responsibilities:**

- Maintains a managed `<style>` element in the document `<head>` (`id="typestyles"`)
- Uses a separate fallback `<style>` element for rules the CSSOM rejects via `insertRule`
- Batches CSS rule insertions using microtasks
- Deduplicates rules by key
- Supports HMR invalidation
- Can disable DOM insertion when `__TYPESTYLES_RUNTIME_DISABLED__` or `NEXT_PUBLIC_TYPESTYLES_RUNTIME_DISABLED` is set (build extraction / production)

**SSR/build responsibilities:**

- `sheet-context.ts` uses `AsyncLocalStorage` for request-isolated CSS collection
- `server.ts` exports `collectStyles()`, `typestylesStyleHtml()`, `injectStylesIntoHtml()`, `streamingDocumentShell()` for SSR
- `getRegisteredCss()` and `subscribeRegisteredCss()` are exported from the main entry for SSR and `useSyncExternalStore`
- `build.ts` exports `collectStylesFromModules()` for zero-runtime extraction

**Insertion strategy (runtime):**

```
1. styles.component() or tokens.create() called
2. CSS string generated by serialize-style.ts (and related helpers)
3. Rule queued in insertion buffer with a stable string key
4. On next microtask: all queued rules inserted via CSSStyleSheet.insertRule()
   (rejected rules fall back to the dedicated text-based style element)
```

### 6. CSS Serialization (`serialize-style.ts`, `css.ts`)

**`serialize-style.ts`** converts style objects to CSS rule strings:

- camelCase → kebab-case property conversion
- Unitless property detection (with up-to-date allowlist)
- Nested selectors (`'&:hover'`, `'& .child'`, `'[data-state]'`)
- At-rules (`@media`, `@container`, `@supports`, `@layer`)
- Selector lists (`'&[data-state="open"], [aria-expanded="true"]'`)
- Responsive `{ base, md, lg }` expansion when `breakpoints` are configured
- `{ light, dark }` color-mode expansion via `light-dark()` when `colorModes` are configured

**`css.ts`** (`typestyles/css` subpath) exposes lower-level helpers: `css.atProperty()`, `css.customProperty()`, `css.customProperties()`, `css.var()`.

### 7. Class Naming (`class-naming.ts`, `atomic-decompose.ts`)

Seven naming modes (configured via `createStyles({ mode })`):

- **Semantic** (default): `button-intent-primary` — human-readable, debuggable; prefixed with sanitized `scopeId` when set
- **Hashed**: `ts-button-a1b2c3d` — collision-safe with readable slug
- **Compact**: `ts-a1b2c3d` — hash-only for whole style objects (shortest single-class output)
- **Atomic**: per-declaration classes with cross-component dedup (like StyleX); identical `color: red` declarations across the codebase share one class
- **BEM**: `block--modifier` / `block__element--modifier` for dimensioned and slot components
- **Template**: user-supplied `classNameTemplate(ctx)` instead of fixed BEM conventions
- **Attribute**: dimensioned/slot variants compile to `data-*` attribute selectors; returns `{ className, attrs, props }`

### 8. Cascade Layers (`layers.ts`)

Opt-in `@layer` support. When `layers` is passed to a factory (`createTypeStyles`, `createStyles`), the API gains typed `layer` options on `styles.class`, `styles.hashClass`, `styles.component`, `styles.override`, `styles.scope`, and token/theme emission. Layer order is declared once on the factory and emitted as a single `@layer` preamble.

### 9. Build Extraction (`build-runner/`)

The `@typestyles/build-runner` package provides shared infrastructure for zero-runtime CSS extraction used by all bundler plugins (Vite, Next, Rollup, esbuild, webpack). It discovers convention entry files, bundles and executes them in Node via esbuild (`runTypestylesBuild`), collects CSS, and writes static `.css` output. It also supports route-level CSS manifests (v2), Next.js App Router route discovery, and `verifyTypestylesBuild()` to check that extracted CSS covers all registered styles.

## Data Flow

### Runtime Path

```
1. Module loads → styles.component('card', { ... }) called
2. CSS generated via serialize-style.ts; class name map built via class-naming.ts
3. CSS rules queued in StyleSheet Manager with stable dedupe keys
4. Component renders → card() or card({ elevated: true }) called
5. Returns composed class string: "card-base card-elevated"
6. On next microtask, StyleSheet Manager inserts all queued CSS rules
```

### Build Extraction Path

```
1. Build tool (Vite/Next/Rollup/esbuild/webpack) invokes build-runner
2. build-runner discovers convention entry files
3. Entries are bundled and executed in Node — styles/tokens register CSS via sheet
4. collectStylesFromModules() (or runTypestylesBuild) captures all generated CSS
5. CSS written to static file(s); runtime injection disabled in production
6. App code still calls card() etc. — returns class strings (or attrs in attribute mode) as usual
```

### Token Path

```
1. Module loads → tokens.create('color', { primary: '#0066ff' }) called
2. Token Registry generates :root CSS rule with custom properties
3. CSS queued in StyleSheet Manager (or collected by build extraction)
4. Other modules use color.primary → resolves to "var(--color-primary)" (scoped when scopeId is set)
5. This string is embedded in style definitions or used directly
```

## Design Decisions

### Why runtime AND build extraction?

TypeStyles started as a runtime library prioritizing DX and flexibility. Static extraction (StyleX, Vanilla Extract) offers zero-runtime cost but imposes authoring constraints. TypeStyles provides both: the same authoring APIs work in runtime mode (dev, prototyping, dynamic styles) and build mode (production, zero-runtime). The build plugins extract CSS at compile time and disable client-side injection, giving teams a migration path without changing application code.

### Why readable class names?

Hashed/minified class names make debugging painful. TypeStyles uses authored names by default (`button-intent-primary`). The tradeoff is potential name collisions, handled by `scopeId` prefixing, namespace duplicate detection (dev-mode errors at runtime, build-time errors in bundler plugins), and optional hashed/compact/atomic/BEM/template/attribute modes.

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
