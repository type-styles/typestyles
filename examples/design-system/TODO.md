# Design System TODO

This checklist focuses on making `@examples/design-system` complete enough to power the docs site and serve as a framework-agnostic reference implementation.

## Phase 1 - Docs-first components

- [ ] **CodeBlock (core)**
  - [x] Add container, header, filename, language badge, and scrollable body styles.
  - [x] Add variants: `default`, `inline`, `diff`, `terminal`.
  - [x] Add line-number and highlighted-line styles.
  - [x] Add long-line wrapping and horizontal-scroll options.
- [ ] **CodeBlock copy UX**
  - [x] Add copy button recipe with states: idle, hover, copied, error.
  - [x] Provide accessible labels (`Copy code`, `Copied`).
  - [x] Add feedback slot styles (toast/inline status).
  - [x] Provide framework-agnostic helper pattern docs for clipboard integration.
- [x] **Syntax highlighting themes**
  - [x] Define semantic tokens for code syntax categories (keyword, string, comment, etc).
  - [x] Add light and dark code themes aligned with docs brand colors.
  - [x] Add diff tokens (`addition`, `deletion`, backgrounds).
  - [x] Document integration pattern with `highlight.js` output classes.
- [x] **Alert / Callout block**
  - [x] Add alert recipe with variants: `info`, `success`, `warning`, `danger`, `tip`.
  - [x] Add optional title, icon slot, and action link styles.
  - [x] Add subtle and solid visual modes.
  - [x] Ensure readable contrast in both light and dark themes.
- [x] **Docs content primitives**
  - [x] Add styles for: blockquote, kbd, badge, table, divider, anchor heading links.
  - [x] Add "admonition-like" markdown mapping examples.
  - [x] Add responsive spacing scale for prose content.

## Phase 2 - Theming and tokens

- [ ] **Token architecture hardening**
  - [ ] Split tokens into `primitive`, `semantic`, and `component` groups.
  - [ ] Add docs-specific semantic token set (prose, code, nav, callout, table).
  - [ ] Add standardized motion tokens (duration/easing) for interaction feedback.
- [ ] **Theme system**
  - [ ] Add first-class light/dark theme exports (not just dark override class).
  - [ ] Add high-contrast theme variant.
  - [ ] Add per-component token override support (e.g. code block palette).
  - [ ] Add theme switching guidance for Astro without React context dependency.
- [ ] **Theming ergonomics**
  - [ ] Provide helper APIs for creating custom themes from partial overrides.
  - [ ] Add docs examples for brand theming and "single-accent override".
  - [ ] Add migration guide for extending tokens safely.

## Phase 3 - Accessibility and quality

- [ ] **A11y baseline**
  - [ ] Define required contrast targets for all variants.
  - [ ] Add focus-visible styles to all interactive recipes.
  - [ ] Add reduced-motion friendly alternatives.
- [ ] **Testing**
  - [ ] Add visual snapshots for light/dark/high-contrast states.
  - [ ] Add token-level tests to prevent accidental breaking changes.
  - [ ] Add interaction tests for copy button states.
- [ ] **Performance**
  - [ ] Audit generated CSS size for docs bundle.
  - [ ] Deduplicate shared recipe fragments across components.
  - [ ] Add guidance for tree-shakable imports from package entrypoints.

## Phase 4 - Packaging and docs

- [ ] **Package structure**
  - [ ] Add clear entrypoints for `tokens`, `recipes`, and `docs-components`.
  - [ ] Keep React wrappers in `@examples/react-design-system` only.
  - [ ] Ensure non-React examples consume `@examples/design-system` directly.
- [ ] **Documentation**
  - [ ] Add usage docs for each recipe with Astro examples.
  - [ ] Add "how to build markdown renderers with these recipes" guide.
  - [ ] Add copy/paste starter snippets for docs pages.
  - [ ] Add changelog section tracking design-system token changes.

## Stretch goals

- [ ] Add MDX-aware component recipes (tabs in docs, expandable sections).
- [ ] Add "Playground" styles for interactive API demos.
- [ ] Add print-friendly docs theme.
