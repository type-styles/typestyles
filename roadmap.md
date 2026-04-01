# TypeStyles Roadmap

This document outlines the future direction for typestyles, comparing against other styling frameworks like Emotion, Stitches, vanilla-extract, CSS Modules, and StyleX.

---

## Overview

Typestyles occupies a unique position in the CSS-in-JS landscape:

- **vs vanilla-extract/StyleX**: Runtime + human-readable class names (atomic output is not human-readable)
- **vs Emotion/styled-components**: Better SSR and no gibberish class names
- **vs Stitches**: Actively maintained and framework-agnostic

**Key differentiator**: Human-readable class names + no build step required + works alongside existing CSS = incremental adoption story.

---

## High Priority

### 1. Framework Integrations

| Integration           | Priority | Notes                                                                                                                                                                                                                                                                           |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js**           | High     | `@typestyles/next` — App Router, Pages Router, RSC documented (`packages/next` README, `examples/next-app`). Extract mode: webpack `DefinePlugin` **+** `next.config` `env` (`NEXT_PUBLIC_TYPESTYLES_RUNTIME_DISABLED`) so **Turbopack** disables client runtime injection too. |
| **Vite**              | High     | `@typestyles/vite` ships today (HMR). Zero-runtime **`mode`** / extraction evolution tracked in §2. Example: `examples/vite-app`.                                                                                                                                               |
| **Rollup / Rolldown** | Medium   | `@typestyles/rollup` ships (runtime / build / hybrid). Rolldown supported via same plugin. Example: `examples/rollup-app`, `examples/rolldown-app`.                                                                                                                             |
| **Webpack**           | Medium   | No standalone `@typestyles/webpack` yet; generic enterprise bundler integration. Next-specific webpack wiring lives under `@typestyles/next/build`.                                                                                                                             |
| **PostCSS**           | Medium   | No public PostCSS plugin today (only internal PostCSS use in `@typestyles/migrate`). Plugin would unlock CSS-pipeline adoption.                                                                                                                                                 |
| **Gatsby**            | Medium   | No package yet; still widely used for content sites.                                                                                                                                                                                                                            |
| **Remix**             | Low      | No dedicated package; SSR patterns documented in `docs/content/docs/ssr.md`.                                                                                                                                                                                                    |

**Also see** §7 for UI-layer packages (`@typestyles/react`, Vue, Svelte) — separate from bundler/framework SSR wiring.

**Status summary**: Next, Vite, and Rollup integrations exist as packages. Next RSC is **documented**; remaining Next work is mostly edge-case hardening (streaming, very large trees) and the other integrations in the table that are still missing.

### 2. Zero-Runtime Build Option

- **Goal**: Optional "no runtime CSS-in-JS" mode that still uses the same `styles`, `tokens`, and `keyframes` APIs.
- **Package**: `@typestyles/build` for build-time CSS extraction (CLI + Node API).
- **Output**:
  - Generates static CSS files at build time (like vanilla-extract).
  - Emits a manifest mapping namespaces → class name strings so application code can stay untouched.
- **Integration – Vite**
  - Extend `@typestyles/vite` with a `mode` option: `"runtime"` (default), `"build"`, `"hybrid"`.
  - In `"build"` mode, the plugin:
    - Scans modules that import `typestyles` (re-using the existing namespace extraction logic).
    - Runs a Node-side collector that imports those modules, calls `getRegisteredCss`, and writes `typestyles.css`.
    - Injects the CSS file as a virtual asset linked from the Vite bundle.
    - Ensures browser bundles use a no-op sheet implementation so there is effectively zero runtime styling cost.
- **Integration – Next.js**
  - Add a `@typestyles/next/build` entrypoint that:
    - Provides a Next.js-compatible `build` helper to generate a CSS file + manifest during `next build`.
    - Hooks into `@typestyles/next/server` utilities (like `getRegisteredCss`) to collect styles.
  - Recommended wiring:
    - Use the manifest to keep using `styles.*` APIs in components without runtime insertion on the client.
    - Inject the generated CSS via Next.js `app` directory layout (e.g. global import in `layout.tsx` or metadata styles).
- **Motivation**
  - Addresses the "runtime overhead" concern that led companies to abandon Emotion/styled-components.
  - Keeps incremental adoption: projects can start in runtime mode and later switch specific routes or the whole app to build mode.

---

## Medium Priority

### CSS Selector and Naming Strategy Initiative

Reference: `docs/content/docs/css-selector-patterns.md`

Goal: support the full range of real-world CSS authoring (semantic classes, utility composition, variants, and data/ARIA attribute-driven state) without locking users into one methodology.

#### Milestones

1. **Selector completeness (M1)**
   - Ensure full selector support in style objects for:
     - data attributes (`[data-state]`, `[data-part]`)
     - ARIA attributes (`[aria-expanded]`, `[aria-selected]`)
     - all CSS attribute operators (`=`, `~=`, `|=`, `^=`, `$=`, `*=`)
   - Add docs/examples for nested selectors with `&`.

2. **Recipe API v1 (M2)**
   - Ship first-class variant APIs: `variants`, `compoundVariants`, `defaultVariants`.
   - Support boolean variants and multi-value compound matching.
   - Keep output deterministic across runtime/build modes.

3. **Slot recipes + headless patterns (M3)**
   - Add slot/multipart recipe support (e.g. `root`, `trigger`, `content`).
   - Document styling with `data-part` and `data-state` for headless UI patterns.

4. **Class naming modes (M4)** — _in progress_
   - Shipped: `configureClassNaming({ mode: 'semantic' | 'hashed' | 'atomic', prefix?, scopeId? })` for `styles.create` / `styles.class` / `styles.component` (and slot recipes); optional `scopeId` for monorepos; `styles.hashClass` uses configured `prefix` and optional `scopeId` in the hash input.
   - Docs: `docs/content/docs/class-naming.md` (and sidebar “Class naming”); cross-links from Styles, Recipes, API Reference, Testing.
   - Still open: build/plugin integration if class names must be known at compile time, true per-property atomic splitting (see §6).

5. **Linting and migration tooling (M5)**
   - Add optional lint rules for naming conventions and selector/state pitfalls.
   - Provide migration helpers from CVA/CSS Modules/utility-heavy codebases.

### 4. Enhanced Component API

- Add `styleVariants` (vanilla-extract style) for generating variant maps
- Improve compound variant ergonomics

### 5. ESLint Plugin

- Detect duplicate class names
- Enforce naming conventions
- Warn about potential issues

### 6. Atomic CSS Output

- Optional atomic/class merging output (like StyleX)
- CSS size plateaus as codebase grows

#### 6.1 Near-term hashed class prototype

- Add `styles.hashClass(style, label?)` as an opt-in API for deterministic hashed class names.
- Goal: unlock StyleX/emotion-like ergonomics without changing `styles.create` semantics.
- Initial scope (prototype):
  - Hash full style objects into one class (not atomic splitting yet).
  - Keep compatibility with runtime and build extraction paths.
  - Optional label for debuggability in class output.
- Follow-up work:
  - Add collision tests + explicit development warnings.
  - Add HMR invalidation support in bundler plugins for hash-based keys.
  - Explore atomic decomposition as a second phase (`styles.atomic` candidate).

### 7. Framework-Specific Packages

- `@typestyles/react` - css prop, styled-like API
- `@typestyles/vue` - Vue 3 composition API integration
- `@typestyles/svelte` - Svelte integration

---

## Lower Priority

### 8. Developer Experience

- **Playground/REPL** - Interactive documentation
- **VS Code extension** - Snippets, hover previews
- **Debugging utilities** - `stylex.when` equivalent for conditional classes

### 9. Design System Tools

- Figma token sync utilities
- Theme composition helpers
- Recipe patterns documentation

---

## Documentation Gaps

| Gap              | Recommendation                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Migration guides | Add guides for: Emotion → typestyles, styled-components → typestyles, CSS modules → typestyles |
| Comparison page  | Side-by-side with Emotion, Stitches, vanilla-extract, StyleX                                   |
| Performance docs | Benchmark data, bundle size comparisons                                                        |
| Accessibility    | How to use typestyles with ARIA, focus management                                              |

---

## Suggested Next Steps

1. **Next.js integration** - RSC + extract path documented; continue edge-case hardening as issues arise
2. **Zero-runtime build option** - Address main criticism of runtime CSS-in-JS
3. **Utils API** - High-value, relatively low-effort DX improvement
