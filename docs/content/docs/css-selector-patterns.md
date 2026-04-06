---
title: CSS Class and Selector Pattern Inspiration
description: Survey of class naming and selector strategies for design systems, with typestyles feature ideas
---

# CSS Class and Selector Pattern Inspiration

This document surveys common class naming and selector patterns used in modern design systems and CSS tooling. The goal is to help `typestyles` support the full practical range of CSS authoring styles: semantic classes, utility classes, variants, slot-based parts, and state via data/ARIA attributes.

## Why this matters for typestyles

Different teams and codebases optimize for different trade-offs:

- Readable semantic class names (`.button`, `.card__title`)
- Utility-heavy authoring (`.px-4`, `.flex`, `.text-sm`)
- Type-safe variant composition (`size=sm`, `intent=primary`)
- Stateful attributes (`[data-state="open"]`, `[aria-expanded="true"]`)
- Strict scoping and collision resistance (hashed/local/atomic classes)

To maximize adoption, `typestyles` should let teams mix these approaches incrementally rather than force one methodology.

## Pattern landscape

### 1) BEM (Block Element Modifier)

- **Pattern:** `.block`, `.block__element`, `.block--modifier`
- **Strengths:** clear hierarchy, readable semantics, scalable in large teams
- **Common needs in tooling:**
  - Predictable class name templates
  - Multi-class composition (`block block--active`)
  - Optional namespace prefixes
- **References:**
  - [BEM naming](https://getbem.com/naming/)
  - [BEM methodology](https://en.bem.info/methodology/block-modification)

### 2) SUIT CSS conventions

- **Pattern:** `.ComponentName`, `.ComponentName--modifier`, `.ComponentName-descendant`, `.is-state`, `.u-utility`
- **Strengths:** component-centric naming with explicit state and utilities
- **Common needs in tooling:**
  - Enforced casing conventions (PascalCase + camelCase)
  - State utilities (`is-`) and utility namespaces (`u-`)
  - Lintable naming rules
- **References:**
  - [SUIT CSS](https://suitcss.github.io/)
  - [SUIT naming conventions](https://github.com/suitcss/suit/blob/master/doc/naming-conventions.md)

### 3) Utility-first classes (Tailwind-style)

- **Pattern:** many single-purpose classes composed at callsite
- **Strengths:** fast iteration, minimal global CSS growth, low selector coupling
- **Common needs in tooling:**
  - Token-based utility generation
  - Arbitrary values and responsive/state variants
  - Conflict resolution and deterministic merge order
- **Reference:**
  - [Tailwind utility-first docs](https://tailwindcss.com/docs/utility-first)

### 4) Variant APIs (CVA, Stitches, vanilla-extract recipes, Panda recipes)

- **Pattern:** typed config with `variants`, `compoundVariants`, `defaultVariants`
- **Strengths:** ergonomic component APIs, composable style decisions, strong TypeScript support
- **Common needs in tooling:**
  - First-class variant factory APIs
  - Compound variant matching
  - Boolean variants and multi-value conditions
  - Slot/part-aware variants for multi-part components
- **References:**
  - [CVA variants](https://cva.style/docs/getting-started/variants)
  - [Stitches variants](https://stitches.dev/docs/variants)
  - [vanilla-extract recipes](https://vanilla-extract.style/documentation/packages/recipes/)
  - [Panda slot recipes](https://panda-css.com/docs/concepts/slot-recipes)

### 5) Scoped/local classes (CSS Modules-style)

- **Pattern:** local class names compiled to unique names; optional global escape hatches
- **Strengths:** prevents collisions while keeping authoring simple
- **Common needs in tooling:**
  - Optional local scoping mode
  - Stable/deterministic class hashes
  - Explicit global selectors escape
- **Reference:**
  - [CSS Modules local scope](https://github.com/css-modules/css-modules/blob/master/docs/local-scope.md)

### 6) Atomic class generation (StyleX-style)

- **Pattern:** compile style objects into atomic (single declaration) classes
- **Strengths:** high reuse, CSS size plateauing at scale, predictable override model
- **Common needs in tooling:**
  - Atomic extraction mode
  - Deterministic precedence/layering
  - Build-time output with low runtime overhead
- **References:**
  - [StyleX introduction](https://stylexjs.com/docs/learn/)
  - [stylex.create](https://stylexjs.com/docs/api/javascript/create)

### 7) Architecture taxonomies (SMACSS, OOCSS, CUBE CSS)

- **Pattern:** categorize styles by role (base/layout/module/state/theme, structure/skin, composition/utility/block/exception)
- **Strengths:** shared mental model for large, long-lived codebases
- **Common needs in tooling:**
  - Layer/category annotations
  - Optional naming presets
  - Documentation-first conventions
- **References:**
  - [SMACSS categorizing rules](https://smacss.com/book/categorizing/)
  - [OOCSS wiki](https://github.com/stubbornella/oocss/wiki)
  - [CUBE CSS](https://cube.fyi/)

## Stateful selectors via attributes (critical)

Data and ARIA attributes are increasingly common as the primary state interface in headless and accessible component libraries.

### Common selector patterns

- **Data state:** `[data-state="open"]`, `[data-side="top"]`, `[data-disabled]`
- **Data part/slot:** `[data-part="trigger"]`, `[data-part="content"]`
- **ARIA state:** `[aria-expanded="true"]`, `[aria-pressed="true"]`, `[aria-selected="true"]`
- **Attribute matching operators:** exact (`=`), prefix (`^=`), suffix (`$=`), substring (`*=`), token (`~=`), lang-like (`|=`)

### Why it matters

- Keeps visual state tied to semantic/accessibility state
- Works across frameworks and rendering environments
- Enables styling without introducing extra class names

### References

- [Radix styling guide (data-state)](https://www.radix-ui.com/primitives/docs/guides/styling)
- [MDN attribute selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors)
- [MDN aria-expanded](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded)

## Potential typestyles features

Below is a practical feature map to support the full range of approaches.

### A) Selector expressiveness

- Support raw selectors in style objects, including:
  - `&[data-state="open"]`
  - `&[aria-expanded="true"]`
  - `& [data-part="label"]`
  - `&:has([data-state="open"])` (where supported), plus **`has` / `is` / `where`** helpers for `:has()`, `:is()`, and `:where()` keys (see [Custom selectors & at-rules](/docs/custom-at-rules))
- Ensure all CSS attribute selector operators are supported.
- Add type-safe helpers for common state selectors (optional convenience layer).

### B) Variant and component system

- First-class `styles.component` API:
  - `base`, `variants`, `compoundVariants`, `defaultVariants`
- Support boolean variants and arrays in compound matching.
- Multipart components via `slots`:
  - Ex: `slots: ['root', 'trigger', 'content']`
- Include class output introspection for tooling/debug docs.

### C) Class naming strategies

- Pluggable naming modes:
  - `semantic` (readable)
  - `scoped` (local + hash)
  - `atomic` (single declaration classes)
- Per-package or per-callsite override to allow mixed migration.
- Optional naming presets (BEM/SUIT-inspired templates).

### D) State and utility ergonomics

- `state` helpers for data/ARIA patterns:
  - Example: `state.open`, `state.disabled`, `aria.expanded`
- Utility generation from token scales:
  - spacing, typography, color, layout utilities
- Deterministic class merge utility for conflict-safe composition.

### E) Build/runtime delivery modes

- Continue supporting:
  - Runtime insertion
  - Build extraction
  - Hybrid mode
- In build mode, ensure deterministic output ordering for variant and selector-heavy styles.

### F) Governance, linting, and migration

- Optional lint rules:
  - Naming policy enforcement (BEM/SUIT/custom regex)
  - Duplicate/conflicting variant definitions
  - Invalid selector/state combinations
- Migration helpers:
  - from CVA variant config
  - from CSS Modules naming maps
  - from utility-class lists to typed component variants

## Suggested near-term roadmap for this area

1. **Selector completeness pass**: guarantee full attribute selector support in style objects.
2. **Component API v1**: ship `variants` + `compoundVariants` + `defaultVariants`.
3. **`slots` + data-part guidance**: target headless UI patterns directly.
4. **Naming strategy options**: semantic + scoped hashed + atomic prototype.
5. **Lint and migration tooling**: make adoption safe in real production codebases.

## Quick test matrix for feature validation

When implementing these features, test across:

- Frameworks: React, Vue, Svelte, no-framework
- Rendering: SSR, CSR, streaming/hydration
- State hooks: classes only, data attributes, ARIA attributes, mixed
- Naming modes: readable semantic, hashed scoped, atomic
- Authoring modes: component variants, utility composition, hand-written selectors

## Closing guidance

The strongest direction for `typestyles` is not choosing one CSS philosophy. It is providing a composable core that supports:

- semantic component classes,
- utility-style composition,
- typed component variants,
- and stateful attribute selectors,

all while preserving predictable output and excellent TypeScript ergonomics.
