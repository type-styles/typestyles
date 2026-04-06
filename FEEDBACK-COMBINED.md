# TypeStyles: Combined Feedback & Prioritized Improvements

This document synthesizes three independent expert reviews into a single prioritized action plan. Items are grouped into tiers by impact and urgency. Each item includes concrete DX examples showing the current pain and the desired outcome.

---

## Tier 1: Architectural / Structural (Do These First)

These are foundational issues that affect every user and constrain the library's growth. They should be addressed before adding new features.

---

### 1.1 Unify `styles.create` and `styles.component` Into a Single API

**Problem:** Two APIs solve the same problem with different call signatures, different behavior around `base` styles, and incompatible composition. Every new user hits the "which one do I use?" question, and the design-system example bypasses both entirely.

**Current (confusing):**

```ts
// API 1: styles.create — flat varargs, base NOT auto-applied
const button = styles.create('button', {
  base: { padding: '8px 16px' },
  primary: { backgroundColor: '#0066ff' },
});
button('primary');          // BUG: missing base styles!
button('base', 'primary'); // correct, but easy to forget

// API 2: styles.component — object args, base IS auto-applied
const button = styles.component('button', {
  base: { padding: '8px 16px' },
  variants: { intent: { primary: { backgroundColor: '#0066ff' } } },
});
button({ intent: 'primary' }); // base auto-applied ✓

// API 3: what people actually do (design-system example)
const buttonBase = styles.class('ds-button', { ... });
const buttonPrimary = styles.hashClass({ ... }, 'ds-button-primary');
export const button = { base: buttonBase, primary: buttonPrimary } as const;
// ...then hand-roll a cx() to combine them
```

**Desired:**

```ts
// One API. Base always auto-applied. Variants are typed dimensions.
const button = styles.component('button', {
  base: { padding: '8px 16px', borderRadius: '6px' },
  variants: {
    intent: {
      primary: { backgroundColor: '#0066ff', color: '#fff' },
      secondary: { backgroundColor: '#e5e7eb' },
    },
    size: {
      sm: { fontSize: '14px' },
      lg: { fontSize: '18px', padding: '12px 24px' },
    },
  },
  compoundVariants: [{ intent: 'primary', size: 'lg', css: { fontWeight: 'bold' } }],
  defaultVariants: { intent: 'primary', size: 'sm' },
});

// Usage — base always included, variants are typed
button({ intent: 'primary', size: 'lg' }); // "button button-intent-primary button-size-lg"
button(); // uses defaults: "button button-intent-primary button-size-sm"

// Simple case (no variants) is still simple
const card = styles.component('card', {
  base: { padding: '16px', borderRadius: '8px' },
});
card(); // "card"
```

**Key decisions:**

- `styles.create` should absorb `styles.component`'s behavior (auto-apply base, typed variant objects, defaultVariants, compoundVariants)
- `styles.component` should be the only function, remove `styles.create`
- The old varargs `button('base', 'primary')` calling convention should be removed
- `styles.class` stays as-is for single standalone classes
- `styles.hashClass` stays as an escape hatch

---

### 1.2 Ship a Built-in `cx()` Utility

**Problem:** Every project needs a class-name joining utility. The design-system example hand-rolls one. The varargs filtering in `styles.create` goes halfway but doesn't work with `styles.class`, `styles.hashClass`, or external class strings.

**Current (hand-rolled in every project):**

```ts
// examples/design-system/src/utils.ts
export function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(' ');
}

// usage
import { cx } from './utils';
cx(button.base, button[intent], isActive && 'active', className);
```

**Desired:**

```ts
import { cx } from 'typestyles';

// Combine TypeStyles classes with external classes, conditionally
<div className={cx(
  card(),
  isActive && 'active',
  isPrimary && button({ intent: 'primary' }),
  externalClassName,
)} />
```

This is ~5 lines of code. Its absence makes the library feel incomplete disproportionate to the effort.

---

### 1.3 Make the Token System Support Nested Objects

**Problem:** Real design systems have hierarchically structured tokens. The current flat `Record<string, string>` forces users to build infrastructure the library should provide. The design-system example had to build `buildColorRefs` and `flattenColorValues` as workarounds.

**Current (flat only):**

```ts
// Can only do flat tokens
tokens.create('color', { primary: '#0066ff', secondary: '#6b7280' });
// → --color-primary, --color-secondary

// For nested structures, you must manually flatten:
function buildColorRefs(obj, prefix) {
  /* 20+ lines of manual flattening */
}
function flattenColorValues(obj, prefix) {
  /* another 20+ lines */
}
```

**Desired:**

```ts
const color = tokens.create('color', {
  text: { primary: '#111827', secondary: '#6b7280', disabled: '#9ca3af' },
  background: { surface: '#ffffff', subtle: '#f9fafb', inverse: '#111827' },
  border: { default: '#e5e7eb', focus: '#3b82f6' },
  brand: { primary: '#0066ff', hover: '#0052cc' },
});

// Nested proxy access works naturally
color.text.primary; // → "var(--color-text-primary)"
color.background.surface; // → "var(--color-background-surface)"
color.brand.hover; // → "var(--color-brand-hover)"

// Generated CSS:
// :root {
//   --color-text-primary: #111827;
//   --color-text-secondary: #6b7280;
//   --color-background-surface: #ffffff;
//   ...
// }
```

---

### 1.4 Make `createTheme` Accept the Same Nested Structure as `tokens.create`

**Problem:** `tokens.createTheme` only accepts `Record<namespace, Record<key, value>>` — flat two levels. If tokens are nested (as they should be per 1.3), you can't use `createTheme` without a manual flattening bridge.

**Current (inconsistent):**

```ts
// Tokens are structured
const color = tokens.create('color', {
  text: { primary: '#111', secondary: '#6b7280' },
});

// But createTheme only accepts flat overrides — won't work with nesting
tokens.createTheme('dark', {
  color: { primary: '#e0e0e0' }, // ← only flat namespace-level keys
});

// Must manually flatten nested tokens before passing to createTheme
const flatDark = flattenColorValues({ text: { primary: '#e0e0e0' } });
tokens.createTheme('dark', { color: flatDark });
```

**Desired:**

```ts
tokens.createTheme('dark', {
  color: {
    text: { primary: '#e0e0e0', secondary: '#a1a1aa' },
    background: { surface: '#1a1a2e', subtle: '#262640' },
  },
});
// → .theme-dark { --color-text-primary: #e0e0e0; --color-background-surface: #1a1a2e; ... }
```

---

### 1.5 Add First-Class Dark Mode / Media-Query Theme Support

**Problem:** The design-system example had to import `insertRules` (an internal API) to support `@media (prefers-color-scheme: dark)`. Dark mode via OS preference is table stakes, not an advanced feature.

**Current (requires internal API):**

```ts
import { insertRules, tokens } from 'typestyles'; // ← insertRules is internal!

insertRules([
  {
    key: `theme:${config.name}:dark-media`,
    css: `@media (prefers-color-scheme: dark) { .${className} { ${darkDecls} } }`,
  },
]);
```

**Desired:**

```ts
// Option A: media-query theme
tokens.createTheme(
  'dark',
  {
    color: { text: { primary: '#e0e0e0' } },
  },
  {
    media: '(prefers-color-scheme: dark)', // applies via @media, no class needed
  },
);

// Option B: separate API
tokens.createMediaTheme('@media (prefers-color-scheme: dark)', {
  color: { text: { primary: '#e0e0e0' } },
});

// Option C: convenience shorthand
tokens.createDarkMode({
  color: { text: { primary: '#e0e0e0' } },
});
```

---

### 1.6 Make the API Instanceable, Not Global Singleton

**Problem:** `configureClassNaming()` is a global mutable singleton. This breaks library authors shipping TypeStyles-based packages, micro-frontends sharing a page, and testing (requires `resetClassNaming()` cleanup).

**Current (global mutation):**

```ts
// Package A
configureClassNaming({ scopeId: 'design-system' });

// Package B — oops, this overwrites Package A's config
configureClassNaming({ scopeId: 'my-app' });

// Testing — need manual cleanup
afterEach(() => resetClassNaming());
```

**Desired:**

```ts
// Each package creates its own scoped instance
import { createTypeStyles, createStyles, createTokens } from 'typestyles';

// design-system package — prefer one factory so scopeId (and later: layers, @property) cannot drift
export const { styles, tokens } = createTypeStyles({ scopeId: 'ds', mode: 'semantic' });

// Equivalent when you only need one of the two APIs
export const stylesOnly = createStyles({ scopeId: 'ds', mode: 'semantic' });
export const tokensOnly = createTokens({ scopeId: 'ds' });

// app package — independent, no collision
const { styles } = createTypeStyles({ scopeId: 'app' });

// The default `styles` and `tokens` imports still work for simple cases
// (they're just a pre-created default instance)
import { styles, tokens } from 'typestyles';
```

---

### 1.7 Zero-Runtime Should Be the Default (or at Least Equal)

**Problem:** Runtime CSS injection is the default and only working mode. Zero-runtime extraction is on the roadmap but not shipped. This is leading with the library's weakest foot — runtime injection bypasses browser CSS caching, parallel parsing, and is exactly what CSS-platform advocates are trying to escape.

**Current:** Runtime-only. `@typestyles/build` is mentioned in the roadmap but not implemented.

**Desired:** Ship zero-runtime extraction as a first-class mode in `@typestyles/vite` and `@typestyles/next`. The API stays identical — only the output changes:

```ts
// vite.config.ts
import typestyles from '@typestyles/vite';

export default {
  plugins: [
    typestyles({ mode: 'build' }), // extracts to .css file, zero runtime cost
    // typestyles({ mode: 'runtime' }),  // current behavior, opt-in
    // typestyles({ mode: 'hybrid' }),   // static extraction + runtime for dynamic values
  ],
};
```

This is already acknowledged as high priority in the roadmap. Elevating it here because all three reviewers flagged it.

---

## Tier 2: Modern CSS Support (Critical for 2025+ Relevance)

These features are essential for a library that claims to embrace the web platform.

---

### 2.1 `@layer` (Cascade Layers) Support

**Problem:** All TypeStyles-generated classes compete at 0-1-0 specificity. There's no way to declare base vs. component vs. utility layers, and runtime injection can't guarantee layer declaration order across code-split bundles.

**Why it matters:** `@layer` is the platform-native answer to specificity management. Without it, TypeStyles forces users into specificity wars when integrating with existing CSS.

**Desired (revised DX):** Layer order should be declared once, at the same place the style API is constructed — not via a separate `layers.declare()` that is easy to misplace, duplicate, or call in the wrong order relative to imports. **Default:** if `layers` is omitted, TypeStyles emits **no** `@layer` rules (flat cascade, same as today). Opting in is explicit: pass a `layers` tuple and get **literal-union typing** for every `layer` option on `styles.create` / `styles.component`.

**Why consider `createTypeStyles`:** Today `createStyles` and `createTokens` are separate entry points; authors repeat `scopeId` (and any future cross-cutting options like layers, `@property` defaults, or build targets). Tokens that compile to CSS (`:root`, `@property`, global base styles) may need to live in a specific layer (e.g. `tokens`) so utilities and components can override them predictably. A single factory keeps **one config object**, guarantees **one scope**, and lets the runtime/build plugin emit **one ordered `@layer` preamble** that covers both token CSS and class rules.

```ts
import { createTypeStyles } from 'typestyles';

const { styles, tokens } = createTypeStyles({
  scopeId: 'ds',
  mode: 'semantic',
  layers: ['reset', 'tokens', 'components', 'utilities'] as const,
  // Optional: where token/theme CSS is emitted when layers are enabled
  tokenLayer: 'tokens',
});

// With layers enabled, `layer` is required on each style (typed union from the tuple).
const reset = styles.create('reset', { base: { margin: 0, padding: 0 } }, { layer: 'reset' });

const button = styles.create(
  'button',
  {
    base: { padding: '8px 16px' },
    variants: { intent: { primary: { backgroundColor: '#0066ff' } } },
  },
  { layer: 'components' },
);

// Generated CSS (conceptual):
// @layer reset, tokens, components, utilities;
// @layer tokens { :root { /* custom properties */ } }
// @layer reset { .ds-reset { margin: 0; padding: 0; } }
// @layer components { .ds-button { padding: 8px 16px; } }
```

`createStyles` / `createTokens` can remain as **narrow constructors** for styles-only or tokens-only use cases (no layers, or layers only where the implementation can still apply). Alternatively they become **thin aliases** over the same internal builder as `createTypeStyles` so behavior never diverges.

```ts
// Explicitly no cascade layers: omit `layers` — no @layer in output, no `layer` on styles.create
const { styles, tokens } = createTypeStyles({ scopeId: 'ds', mode: 'semantic' });
```

**Design notes:**

- **Multiple instances:** Each `createTypeStyles({ layers })` (or `createStyles({ layers })`) owns its stack. Micro-frontends or nested design systems can pass different tuples; the bundler/runtime still needs a single emitted order **per CSS output**, so document whether layers are namespaced (e.g. prefixed by `scopeId`) or merged by the build plugin.
- **Omitting `layers`:** **No cascade layers** — no `@layer` wrappers, no `layer` option on style APIs (TypeScript should not suggest it). This is the default; Panda-style opinionated layer stacks are not implied.
- **External CSS:** Optional escape hatch such as `layers: { order: [...], prependFrameworkLayers: ['bootstrap'] }` so TypeStyles can emit `@layer bootstrap, reset, …` when integrating legacy stacks.
- **Unified factory tradeoffs:** Pros — no duplicated `scopeId`, tokens and classes share layer semantics, one place for `@property` / theme injection. Cons — larger conceptual API surface, migration from two imports to one; mitigate with `createTypeStyles` returning `{ styles, tokens }` with the same `StylesApi` / `TokensApi` shapes authors already know, and keep standalone `createStyles` / `createTokens` for minimal or library-internal usage.

**Prior art (how others handle cascade layers):**

| Project             | Approach                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **StyleX**          | Primarily a **build/PostCSS** concern: plugins expose options like `useCSSLayers` / `useLayer` so generated rules sit inside layers; authors do not usually declare layer order in application TypeScript. Polyfill story often goes through `@csstools/postcss-cascade-layers`. See [StyleX PostCSS docs](https://stylexjs.com/docs/learn/installation/postcss) and [discussion on layer usage in bundlers](https://github.com/facebook/stylex/issues/138). |
| **Panda CSS**       | **Config-first:** fixed conceptual layers (`reset`, `base`, `tokens`, `recipes`, `utilities`) with documented precedence; generated CSS includes `@layer reset, base, tokens, recipes, utilities` (customizable via `layers` in config). Authors choose the layer implicitly by feature (utilities vs recipes, etc.), not per-call `layer: '…'` on every style. See [Panda — Cascade layers](https://panda-css.com/docs/concepts/cascade-layers).            |
| **Stitches**        | **No first-class `@layer` API.** Precedence is handled via the runtime composition model (`css` prop, variants, token scales), not platform cascade layers. Integrating with layered global CSS is a manual concern.                                                                                                                                                                                                                                         |
| **Vanilla Extract** | **Explicit layer handles:** `layer()` (scoped names) / patterns for nesting; styles opt in with an `@layer` key mapping a layer reference to declarations. Order emerges from how layer files are imported and composed; see [VE `layer` API](https://vanilla-extract.style/documentation/api/layer/).                                                                                                                                                       |

TypeStyles can sit between Panda’s “layers by convention” and Vanilla Extract’s “layer as first-class value”: **one ordered tuple on the factory** (`createTypeStyles` or `createStyles`), then **per-style `layer`** with full type inference from that tuple when layers are enabled.

**Challenges:** Layer declaration ordering must be deterministic across chunks (build plugin may need to hoist a single `@layer a, b, c;` preamble). Runtime-only injection must define where the preamble is inserted relative to dynamically loaded style blocks. If layer names collide with third-party global layers, prefer namespacing or explicit `prependFrameworkLayers`-style configuration rather than ad hoc `declare()` calls scattered in modules.

---

### 2.2 `@property` Registration for Typed Custom Properties

**Problem:** Tokens are plain custom properties — you can't animate them, they don't have type safety in CSS, and they inherit by default. `@property` solves all of this and is the natural companion to a token system built on custom properties.

**Additional requirements (not obvious from `@property` alone):**

1. **Reference-based property names in styles** — Authors must not hand-write `'--color-primary'` (or any scoped `--{scopeId}-…` name) in style objects. That duplicates the token definition, breaks refactors, and drifts from the actual emitted name when `scopeId` is set. Each **leaf token** (and each `styles.property` handle) should expose:
   - **`.var`** (or the ref coerces to this string) — `var(--…)` for anywhere a _value_ is required (`backgroundColor`, `padding`, etc.).
   - **`.name`** — the raw custom property identifier (`--…`) for computed keys in style objects and for `transition` / `animation` timelines, where CSS expects the registered property _name_, not `var()`.

2. **`styles.property` for non-token usage** — Not every registered custom property belongs in the token/theme system (one-off component variables, experiments, third-party bridges). **`styles.property(options)`** registers `@property` + optional initial `:root` (or layer) value on the same `scopeId` as the style API, returns the same `{ name, var }` ref shape, and keeps naming consistent without `tokens.create`.

**Desired:**

```ts
const color = tokens.create('color', {
  primary: { value: '#0066ff', syntax: '<color>', inherits: true },
});

const space = tokens.create('space', {
  md: { value: '16px', syntax: '<length>', inherits: false },
});

// Generated CSS (with scopeId: 'ds' → names are --ds-color-primary, etc.):
// @property --ds-color-primary {
//   syntax: '<color>';
//   inherits: true;
//   initial-value: #0066ff;
// }
// @property --ds-space-md { syntax: '<length>'; inherits: false; initial-value: 16px; }
// :root { --ds-color-primary: #0066ff; --ds-space-md: 16px; }

// Value contexts: use .var (or string coercion to var()) — unchanged mental model.
// backgroundColor: color.primary.var

// Declaration / transition contexts: use .name — never repeat the string literal.
const card = styles.create('card', {
  base: {
    [color.primary.name]: '#0066ff',
    transition: `${color.primary.name} 0.3s ease`,
    '&:hover': { [color.primary.name]: '#0052cc' },
  },
});

// Ad-hoc registered property (no token namespace, still scoped with the styles instance):
const lift = styles.property({
  id: 'lift',
  syntax: '<length>',
  inherits: false,
  initialValue: '0px',
});
// lift.name → e.g. '--{scope}-lift' (stable id, no collision across packages when scopeId is set)
const surface = styles.create('surface', {
  base: {
    [lift.name]: '4px',
    transition: `${lift.name} 0.2s ease`,
    '&:hover': { [lift.name]: '12px' },
  },
});
```

**Type / runtime note:** Today token refs are plain `var(--…)` strings, so they cannot serve as declaration keys. This item implies upgrading leaf refs to a small branded object (or tuple) with `toString()` → `var` for backward compatibility, plus explicit `.name` / `.var` for clarity.

#### 2.2.1 Component-internal custom properties (`styles.component` sugar)

**Problem:** Variant blocks often repeat the same longhand declarations (`color`, `borderColor`, `background`, …). For a badge, every `tone` variant might restate text and border colors. It is easier to define **internal custom properties** on the component (e.g. scoped equivalents of `--badge-text-color`, `--badge-border-color`), set those **only in variants**, and keep **`base` consuming `var(…)` once**. That matches plain CSS and reduces drift when adding variants.

**Requirements:**

- Names must be **scoped to the component** (and to `scopeId` / hashed class prefix when used) so two components or packages never collide.
- Authors should use **refs** (same `.name` / `.var` model as §2.2), not hand-written `--…` strings.
- Optional: **`syntax` / `inherits`** per internal var when `@property` is desired.

**Invariant for API design:** Whether the author passes a **plain object** or a **function**, the **returned config shape stays the same** — `base`, `variants`, `defaultVariants`, `compoundVariants`, etc. — so types, docs, and mental models do not fork. The function form only exists to create a scope where **internal vars are declared before** that same object is assembled.

---

##### DX option A — **Function config** (recommended direction)

`styles.component(name, (ctx) => ComponentConfig)` — the callback returns **exactly** the same object type as the current second argument, but `ctx` exposes helpers to register internal properties and get `{ name, var }` refs.

```ts
const badge = styles.component('badge', (c) => {
  const textColor = c.var('textColor', { syntax: '<color>', inherits: false });
  const borderColor = c.var('borderColor', { syntax: '<color>', inherits: false });

  return {
    base: {
      color: textColor.var,
      borderColor: borderColor.var,
      borderWidth: '1px',
      borderStyle: 'solid',
    },
    variants: {
      tone: {
        neutral: {
          [textColor.name]: tokens.textSecondary.var,
          [borderColor.name]: tokens.borderDefault.var,
        },
        danger: {
          [textColor.name]: tokens.dangerText.var,
          [borderColor.name]: tokens.dangerBorder.var,
        },
      },
    },
    defaultVariants: { tone: 'neutral' },
  };
});
```

**Pros:** One call site; return type matches today’s config; easy migration from object → wrap in `(c) => ({ ... })` and add `c.var` lines; declaration order is obvious. **Cons:** Slightly noisier for components with **no** internal vars (still fine as `() => ({ base: … })` or keep object overload — see below).

**Batch sugar on `ctx`:** `c.vars({ textColor: { syntax: '<color>' }, borderColor: { syntax: '<color>' } })` returning `{ textColor, borderColor }` reduces repetition vs many `c.var` calls.

---

##### DX option B — **Plain object** (no internal vars, or global/tokens only)

Unchanged from today:

```ts
const card = styles.component('card', {
  base: { padding: '16px' },
  elevated: { boxShadow: '…' },
});
```

**Overload:** `styles.component(name, config: ComponentConfig | ((ctx: Ctx) => ComponentConfig))` — object form stays zero-cost for simple components.

---

##### DX option C — **Declarative `vars` + nested `build`**

Top-level `vars` schema and a `build` function that receives resolved refs (previous sketch). The **outer** object is no longer the same shape as `ComponentConfig`; tooling must special-case `build`.

```ts
const badge = styles.component('badge', {
  vars: { textColor: { syntax: '<color>' }, borderColor: { syntax: '<color>' } },
  build: ({ vars }) => ({
    base: { color: vars.textColor.var, … },
    variants: { … },
  }),
});
```

**Pros:** Vars are visibly grouped at the top. **Cons:** **Two** shapes (`vars` + `build` vs flat `ComponentConfig`); authors learn a second layout; harder to document as “the same object, plus…”.

---

##### DX option D — **Hoisted var factory** + plain `ComponentConfig`

Internal vars created **outside** `styles.component`, passed in as refs (still component-scoped if the factory is bound to `name` / `scopeId`).

```ts
const badgeVars = styles.componentVars('badge', {
  textColor: { syntax: '<color>' },
  borderColor: { syntax: '<color>' },
});

const badge = styles.component('badge', {
  base: {
    color: badgeVars.textColor.var,
    borderColor: badgeVars.borderColor.var,
    …
  },
  variants: {
    tone: {
      neutral: {
        [badgeVars.textColor.name]: tokens.textSecondary.var,
        …
      },
    },
  },
});
```

**Pros:** Pure object config; vars reusable if multiple components share a bundle-private contract (rare). **Cons:** Two identifiers (`badgeVars` + `badge`); easy to **mismatch** factory name vs component name; ordering bugs if `componentVars` is called after styles are evaluated.

---

##### Comparison (short)

| Option                 | Same `ComponentConfig` return shape | Internal vars colocated with component | Low ceremony when no vars                        |
| ---------------------- | ----------------------------------- | -------------------------------------- | ------------------------------------------------ |
| **A** Function         | Yes (return value)                  | Yes                                    | Accept `(c) => ({ … })` or object overload **B** |
| **B** Object only      | Yes                                 | No (use tokens / `styles.property`)    | Best                                             |
| **C** `vars` + `build` | Only inside `build`                 | Yes                                    | Extra nesting always                             |
| **D** Hoisted factory  | Yes                                 | Split across calls                     | Two calls                                        |

---

##### Recommendation

Prefer **overload A + B**: default **object** config for simple cases; **function** config when internal custom properties are needed, returning the **identical** `ComponentConfig` type. Optionally add **`c.vars({ … })`** batch helper on the callback context.

**Runtime:** On the function branch, invoke the callback once at registration time with a fresh `ctx` that allocates scoped `--…` names and registers optional `@property` rules tied to the component’s root/variant classes.

---

### 2.3 First-Class Container Queries

**Problem:** `@container` queries are fully supported in all browsers and are the preferred way to write responsive components. They're not mentioned in docs or examples.

**Desired:**

```ts
const card = styles.create('card', {
  base: {
    containerType: 'inline-size',
    padding: '16px',
    '@container (min-width: 400px)': {
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    },
  },
});

// Named containers
const sidebar = styles.create('sidebar', {
  base: {
    containerType: 'inline-size',
    containerName: 'sidebar',
  },
});

const sidebarItem = styles.create('sidebar-item', {
  base: {
    '@container sidebar (min-width: 300px)': {
      flexDirection: 'row',
    },
  },
});
```

If `@container` already works via raw nested `@` keys (like `@media` does), this needs documentation and typed support in the CSS properties interface.

---

### 2.4 `:has()`, `:is()`, `:where()` Support and Documentation

**Problem:** `:where()` is particularly important for libraries — it provides zero-specificity selectors that let consumers override without fighting. `:has()` is transformative for parent selectors. Neither is documented or actively encouraged.

**Desired:**

```ts
const nav = styles.create('nav', {
  base: {
    // :where() for low-specificity library defaults (easy to override)
    '&:where(.nav)': { display: 'flex', gap: '8px' },

    // :has() for parent-aware styling
    '&:has(.active)': { borderBottom: '2px solid blue' },

    // :is() for grouping
    '&:is(:hover, :focus-visible)': { outline: '2px solid blue' },
  },
});
```

At minimum, document that these work with `&` nesting. Ideally, add typed autocomplete for pseudo-classes.

---

### 2.5 `@scope` Support (Forward-Looking)

**Problem:** `@scope` is the native solution to style encapsulation — the very problem CSS-in-JS exists to solve. A library that embraces the web platform should have a story for it.

**Desired (at minimum):** Documentation acknowledging `@scope` and showing how to use it with TypeStyles' `@` nesting:

```ts
const card = styles.create('card', {
  base: {
    '@scope (.card) to (.card-content)': {
      color: 'gray',
    },
  },
});
```

---

## Tier 3: API Cleanup & Type Safety

These fix sharp edges in the current API that erode developer trust.

---

### 3.1 Fix `styles.compose` Type Safety

**Problem:** `compose` is silently lossy. Invalid variant names produce no type error and no runtime warning — just a missing class.

**Current (unsafe):**

```ts
const layout = styles.create('layout', { flex: { display: 'flex' } });
const spacing = styles.create('spacing', { padded: { padding: '16px' } });

const composed = styles.compose(layout, spacing);
composed('flex', 'padded', 'typo'); // 'typo' silently produces nothing — no error!
```

**Additionally:** `styles.component` results (object args) can't be composed with `styles.create` results (varargs). The two API branches are fundamentally incompatible in composition. Unifying the API (Tier 1.1) would also fix this.

**Desired (after API unification):**

```ts
const composed = styles.compose(layout, spacing);
// TypeScript: only accepts keys from the union of both functions
// Runtime: warns in dev mode if an unknown variant is passed
```

---

### 3.2 Fix `tokens.use` Type Safety

**Problem:** `tokens.use` defaults to `Record<string, string>`, requiring manual type annotation. This defeats the purpose of a typed token system and will silently rot as token definitions change.

**Current (unsafe):**

```ts
// In package A
export const color = tokens.create('color', { primary: '#0066ff', secondary: '#6b7280' });

// In package B — must manually sync the type
const color = tokens.use<{ primary: string; secondary: string }>('color');
// If package A adds 'tertiary', package B's type is stale — no error
```

**Desired:**

```ts
// In package A — export the token definition
export const colorTokens = tokens.create('color', { primary: '#0066ff', secondary: '#6b7280' });
export type ColorTokens = typeof colorTokens;

// In package B — import the type, get full safety
import type { ColorTokens } from 'design-system';
const color = tokens.use<ColorTokens>('color');
// Now TS errors if you access color.nonExistent

// Bonus: tokens.use warning should fire even if no tokens.create has been called yet
```

---

### 3.3 Improve Slots API Typing

**Problem:** `slots: ['root', 'trigger']` requires `as const` and returns `Record<string, string>` instead of a precisely typed object.

**Current:**

```ts
const dialog = styles.component('dialog', {
  slots: ['root', 'trigger', 'content'] as const,
  // ...
});

dialog.root; // TS type: string ✓ (but only because of as const)
dialog.missing; // TS type: string ← should be a type error!
```

**Desired:**

```ts
const dialog = styles.create('dialog', {
  slots: ['root', 'trigger', 'content'],
  // ...
});

dialog.root; // string ✓
dialog.missing; // TS error: Property 'missing' does not exist ✓
```

---

### 3.4 Namespace Collision Should Be an Error, Not a Warning

**Problem:** Duplicate `styles.create('button', ...)` in different files produces a `console.warn` in dev. Warnings get ignored. This becomes a production bug.

**Current:**

```ts
// file-a.ts
styles.create('button', { base: { color: 'red' } });

// file-b.ts
styles.create('button', { base: { color: 'blue' } }); // console.warn — easily missed
```

**Desired:**

- In development: throw an error (not a warning) for duplicate namespaces
- In production: silently deduplicate (same as today, for safety)
- Better: automatic scoping by file path by default (like CSS Modules), with opt-in semantic naming
- The `scopeId` config should be prominently documented and easy to set up, not a post-collision discovery

---

### 3.5 Silent Failure on Invalid Variants

**Problem:** Passing a variant name that doesn't exist silently returns an empty class string. No compile-time or runtime feedback.

**Current:**

```ts
const button = styles.create('button', { base: { color: 'red' }, primary: { color: 'blue' } });
button('primry'); // typo → returns "" silently. No error, no warning.
```

**Desired:**

```ts
button('primry'); // TypeScript error: Argument of type '"primry"' is not assignable to '"base" | "primary"'
// Runtime dev mode: console.error('Unknown variant "primry" for namespace "button"')
```

---

## Tier 4: Developer Experience

These aren't blockers but significantly improve daily usage.

---

### 4.1 Remove or Rethink the Color API

**Problem:** `color.rgb()`, `color.hsl()`, `color.oklch()` are string factories with no benefit over string literals. `color.alpha()` uses `color-mix(in srgb, ..., transparent)` which is a hack — CSS has native alpha channels.

**Current (no value added):**

```ts
color.rgb(0, 102, 255); // → "rgb(0 102 255)" — you could just write this
color.alpha('#0066ff', 0.5); // → "color-mix(in srgb, #0066ff, transparent 50%)" — wrong abstraction
```

**Desired — either remove or make it genuinely useful:**

```ts
// Option A: Remove. Let people write CSS color values directly.

// Option B: Add actual value — things JS can do that CSS can't
import { color } from 'typestyles';
color.lighten('#0066ff', 20); // computed at build time
color.darken('#0066ff', 10); // computed at build time
color.contrastRatio('#0066ff', '#fff'); // → 4.5 (accessibility check)
color.ensureContrast('#0066ff', '#fff', 'AA'); // → adjusted color meeting WCAG AA
```

---

### 4.2 Clean Up `styles.withUtils` — Register Utils Globally

**Problem:** `styles.withUtils` creates a parallel API universe. You end up with two `create` functions in your codebase and utils-aware styles don't compose with regular styles.

**Current (parallel universe):**

```ts
const s = styles.withUtils({ marginX: (v) => ({ marginLeft: v, marginRight: v }) });

// Now you must choose: use `s.create` (has utils) or `styles.create` (no utils)
s.create('card', { base: { marginX: '16px' } }); // ✓ works
styles.create('card', { base: { marginX: '16px' } }); // ✗ marginX not recognized
```

**Desired:**

```ts
// Register utils once, globally (or per-instance if using createStyles)
import { styles, registerUtils } from 'typestyles';

registerUtils({
  marginX: (v) => ({ marginLeft: v, marginRight: v }),
  marginY: (v) => ({ marginTop: v, marginBottom: v }),
  size: (v) => ({ width: v, height: v }),
});

// Now all styles.create calls have access to utils
styles.create('card', { base: { marginX: '16px' } }); // ✓ just works
```

---

### 4.3 Allow Custom CSS Variable Name Control

**Problem:** Token namespace prefix is always auto-prepended. Existing design systems with established CSS variable naming conventions can't migrate without renaming all their variables.

**Current:**

```ts
tokens.create('color', { primary: '#0066ff' });
// Always → --color-primary

// What if your existing system uses --brand-color-primary-500?
// No way to control the generated name.
```

**Desired:**

```ts
tokens.create(
  'color',
  { primary: '#0066ff' },
  {
    prefix: 'brand', // → --brand-color-primary
    // or full control:
    nameTemplate: (namespace, key) => `brand-${namespace}-${key}-500`,
  },
);
```

---

### 4.4 Getting Started Docs Need a Complete Working Example

**Problem:** The getting started guide shows `styles.create` but stops at `// In your component:`. The reader never sees a complete file-to-component flow.

**Current docs:**

```ts
const button = styles.create('button', {
  base: { padding: '8px 16px', borderRadius: '6px' },
  primary: { backgroundColor: '#0066ff', color: '#fff' },
});

// In your component: className={button('base', 'primary')}
```

**Desired docs (show the complete flow):**

```ts
// styles/button.ts
import { styles } from 'typestyles';

export const button = styles.create('button', {
  base: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' },
  variants: {
    intent: {
      primary: { backgroundColor: '#0066ff', color: '#fff' },
      secondary: { backgroundColor: '#e5e7eb', color: '#111' },
    },
  },
  defaultVariants: { intent: 'primary' },
});
```

```tsx
// components/Button.tsx
import { button } from '../styles/button';

export function Button({ intent, children, ...props }) {
  return (
    <button className={button({ intent })} {...props}>
      {children}
    </button>
  );
}
```

```tsx
// App.tsx
import { Button } from './components/Button';

export function App() {
  return (
    <div>
      <Button>Primary (default)</Button>
      <Button intent="secondary">Secondary</Button>
    </div>
  );
}
```

---

### 4.5 SSR: Consolidate to One API

**Problem:** `collectStyles(renderFn)` and `getRegisteredCss()` are two APIs for the same thing. Integration packages each re-implement SSR wiring separately.

**Desired:** One canonical SSR API. The lower-level `getRegisteredCss()` can stay as an escape hatch but shouldn't be the recommended path. With zero-runtime extraction (Tier 1.7), most of this complexity disappears.

---

### 4.6 `global.style()` Needs Guardrails

**Problem:** `global.style(selector, properties)` bypasses all library safety guarantees — no namespace, no deduplication, no semantic naming. It's positioned as equivalent to `styles.create` but is fundamentally different. It will be overused because it's the only way to do reset styles and third-party overrides.

**Desired:**

- Docs should clearly mark `global.style()` as an escape hatch, not a primary API
- Provide `global.reset()` or a reset/normalize recipe so users don't need `global.style()` for the most common case
- When `@layer` is supported, `global.style()` should default to the lowest layer

---

## Tier 5: Nice-to-Have Features

Lower priority but would round out the library for production design systems.

---

### 5.1 `@typestyles/react` — `css` Prop and `styled()` API

A `css` prop and `styled(Component)` API would remove migration friction from Emotion/styled-components:

```tsx
// css prop
<div css={{ color: 'red', '&:hover': { color: 'blue' } }}>Hello</div>;

// styled API
const StyledButton = styled('button', {
  base: { padding: '8px 16px' },
  variants: { intent: { primary: { backgroundColor: '#0066ff' } } },
});

<StyledButton intent="primary">Click me</StyledButton>;
```

---

### 5.2 Responsive Object Syntax

Shorthand for breakpoint-based responsive styles:

```ts
// Instead of nested @media queries:
const card = styles.create('card', {
  base: {
    padding: '8px',
    '@media (min-width: 768px)': { padding: '16px' },
    '@media (min-width: 1024px)': { padding: '24px' },
  },
});

// Optionally support a responsive shorthand:
const card = styles.create('card', {
  base: {
    padding: { base: '8px', md: '16px', lg: '24px' },
  },
});
```

This requires a breakpoint configuration step. Lower priority than the structural items.

---

### 5.3 Developer Tooling

- **Browser DevTools integration:** Inspect which TypeStyles definition generated a class
- **VS Code extension:** Autocomplete for variant names, hover previews of generated CSS, go-to-definition for token references
- **TypeScript language plugin:** Enhanced IntelliSense for pseudo-classes and at-rules

---

### 5.4 Built-in Reset/Normalize

```ts
import { global } from 'typestyles';

global.reset(); // injects a sensible CSS reset (à la modern-normalize)
global.reset('minimal'); // just box-sizing + margin reset
```

---

## What's Good — Don't Change These

All three reviewers agreed on what works well:

- **CSS custom properties for tokens** — cascade-friendly, DevTools-inspectable, interoperable with plain CSS
- **Object-based CSS with `&` nesting** — type-safe, refactorable, no template literals
- **Human-readable class names by default** — `button-intent-primary` beats `css-1a2b3c` in DevTools
- **Zero dependencies except `csstype`** — rare and valuable
- **No build step required** — removes the #1 objection to adoption
- **`styles.class` for single standalone classes** — clean, direct, no over-engineering
- **`styles.component` variant/compoundVariant/defaultVariant design** — this is what CVA should have been (keep this design, just unify it into `styles.create`)

---

## Summary: Prioritized Action Order

| Priority | Item                                                                                                      | Effort    | Impact                                              |
| -------- | --------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------- |
| **1**    | 1.1 Unify `styles.create` / `styles.component`                                                            | High      | Critical — everything builds on this                |
| **2**    | 1.2 Ship built-in `cx()`                                                                                  | Low       | High — 5 lines, disproportionate DX impact          |
| **3**    | 1.3 Nested token objects                                                                                  | Medium    | Critical — unblocks real design systems             |
| **4**    | 1.4 `createTheme` accepts nested structure                                                                | Medium    | Critical — paired with 1.3                          |
| **5**    | 1.5 Dark mode / media-query themes                                                                        | Medium    | High — table stakes for design systems              |
| **6**    | 3.4 Namespace collision → error                                                                           | Low       | Medium — prevents silent production bugs            |
| **7**    | 3.5 Invalid variant feedback                                                                              | Low       | Medium — prevents silent failures                   |
| **8**    | 2.1 `@layer` support                                                                                      | High      | High — essential for cascade management             |
| **9**    | 1.6 Instanceable API                                                                                      | High      | High — unblocks library authors and micro-frontends |
| **10**   | 1.7 Zero-runtime extraction                                                                               | Very High | High — already on roadmap, elevate priority         |
| **11**   | 4.4 Complete getting-started docs                                                                         | Low       | Medium — first 5 minutes experience                 |
| **12**   | 3.1 Fix `compose` type safety                                                                             | Medium    | Medium                                              |
| **13**   | 3.2 Fix `tokens.use` type safety                                                                          | Low       | Medium                                              |
| **14**   | 4.1 Rethink color API                                                                                     | Low       | Low-Medium                                          |
| **15**   | 4.2 Global utils registration                                                                             | Medium    | Medium                                              |
| **16**   | 2.2 `@property`, `.name`/`.var`, `styles.property`, component internal vars (fn config + object overload) | Medium    | Medium                                              |
| **17**   | 2.3 Container queries                                                                                     | Low       | Medium — may already work, needs docs               |
| **18**   | 2.4 `:has()/:is()/:where()` docs                                                                          | Low       | Low-Medium                                          |
| **19**   | 4.3 Custom CSS variable names                                                                             | Low       | Low — migration convenience                         |
| **20**   | 3.3 Slots API typing                                                                                      | Low       | Low                                                 |
| **21**   | 4.5 SSR API consolidation                                                                                 | Low       | Low — disappears with zero-runtime                  |
| **22**   | 4.6 `global.style()` guardrails                                                                           | Low       | Low                                                 |
| **23**   | 5.1 React `css` prop / `styled()`                                                                         | High      | Medium — migration convenience                      |
| **24**   | 5.2 Responsive object syntax                                                                              | Medium    | Low                                                 |
| **25**   | 5.3 Developer tooling                                                                                     | High      | Medium                                              |
| **26**   | 5.4 Built-in reset                                                                                        | Low       | Low                                                 |
| **27**   | 2.5 `@scope` support                                                                                      | Low       | Low — forward-looking                               |
