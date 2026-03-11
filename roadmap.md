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

| Integration | Priority | Notes                                                    |
| ----------- | -------- | -------------------------------------------------------- |
| **Next.js** | High     | Critical for adoption - includes App Router, RSC support |
| **Gatsby**  | Medium   | Still widely used                                        |
| **Webpack** | Medium   | Many enterprise projects use Webpack                     |
| **Rollup**  | Medium   | For library building                                     |
| **PostCSS** | Medium   | For custom build pipelines                               |

**Status**: Next.js package exists (`packages/next`). Need to verify RSC support.

### 2. Zero-Runtime Build Option

- Add `@typestyles/build` package for build-time CSS extraction
- Generates static CSS files at build time (like vanilla-extract)
- Addresses the "runtime overhead" concern that led companies to abandon Emotion

### 3. Utils API

- Create custom CSS property shortcuts (like Stitches' `utils`)
- Example: `marginX`, `paddingY`, `size` helpers
- High-value DX improvement

---

## Medium Priority

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

1. **Next.js integration** - Verify and enhance RSC support (highest impact)
2. **Zero-runtime build option** - Address main criticism of runtime CSS-in-JS
3. **Utils API** - High-value, relatively low-effort DX improvement
