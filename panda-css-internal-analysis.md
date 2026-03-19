# Panda CSS vs TypeStyles (Internal)

Internal planning notes for product/docs strategy. This file is intentionally outside public docs.

## Feature Parity Matrix

| Panda CSS concept | Panda API | TypeStyles equivalent | Status |
| --- | --- | --- | --- |
| Single class from style object | `css({...})` | `styles.class(name, {...})` or `styles.hashClass({...})` | Full |
| Variant recipes | `cva({...})` / `defineRecipe({...})` | `styles.component(name, {...})` | Full |
| Compound variants | `compoundVariants` | `compoundVariants` in `styles.component` | Full |
| Design tokens | `theme.tokens` | `tokens.create(namespace, values)` | Full |
| Theme overrides | semantic token conditions / themes | `tokens.createTheme(name, overrides)` | Partial (manual semantics) |
| Atomic utilities | generated utility props | `defineProperties` + `createProps` from `@typestyles/props` | Full |
| Conditional utilities (breakpoints/selectors) | `conditions` | `conditions` in `defineProperties` | Full |
| Global CSS | `globalCss` config | `global.style(selector, style)` | Full |
| Preflight/reset | `preflight` config | custom reset via `global.style` | Partial (no built-in preflight preset) |
| Slot recipes / multipart | `sva({...})` | `styles.component` with `slots` | Full |
| Build-time extraction | Panda CLI/codegen/extract | runtime + SSR today; extraction is planned | Gap today |
| JSX style factory (`styled-system/jsx`) | `Box`, `Stack`, `styled(...)` | standard JSX + `className` composition | Partial (no first-party JSX factory package) |
| Hashing mode config | `hash` in config | `styles.hashClass` per class | Partial (no project-wide hash mode toggle) |

## Panda Migration Plan (Internal)

1. Replace Panda `css()` usage with either `styles.class()` or `styles.create()` namespaces.
2. Convert `cva`/`defineRecipe` to `styles.component` one component at a time.
3. Move token values from `panda.config.ts` into `tokens.create()` files.
4. Translate semantic/dark token behavior into `tokens.createTheme()` theme classes.
5. Replace utility-heavy call sites with a local `@typestyles/props` atoms function.
6. For slot recipes (`sva`), split into explicit per-slot styles and compose in component code.
7. Keep Panda and TypeStyles side-by-side during rollout, then delete generated Panda output.

## Competitive Gaps to Close

1. **Build-time extraction mode (highest impact)**  
   Panda's strongest differentiator is build-time extraction and generated static CSS pipeline.
2. **First-class multipart component styling (`sva` equivalent)** ✅  
   Implemented via `styles.component(..., { slots: [...] })`.
3. **Config-driven preflight/reset defaults**  
   TypeStyles supports global CSS, but a built-in reset preset would improve migration ergonomics.
4. **Generated JSX facade and pattern primitives**  
   Panda's `styled-system/jsx` and built-in patterns (`stack`, `grid`, etc.) reduce app-level boilerplate.
5. **Project-level class/var hashing strategy**  
   TypeStyles has per-class hashing (`styles.hashClass`) but not yet a global strategy switch.

## Gap #2 Design Sketch: Multipart/Slot Styling

### The problem `sva` is solving

Complex components often have multiple parts ("slots") that need to share one variant contract.

Examples:
- Tabs: `root`, `list`, `trigger`, `content`
- Select: `root`, `control`, `icon`, `menu`, `option`
- Accordion: `root`, `item`, `trigger`, `content`

Without a slot-level abstraction, teams usually end up with:
- duplicated variant logic per slot
- inconsistent defaults between slots
- manual string composition in component code
- fragile TypeScript types for variant props

So the core problem is **coordinating one variant schema across many class outputs**.

### What TypeStyles should optimize for

1. Keep Typestyles principles: deterministic readable class names, framework-agnostic, incremental adoption.
2. Reuse existing mental model from `styles.component` (base, variants, compoundVariants, defaultVariants).
3. Avoid forcing a context/runtime pattern to style slots.
4. Work in plain JS/TS and in React/Vue/Svelte equally.
5. Preserve current SSR/runtime behavior and avoid introducing heavy runtime machinery.

### Functional requirements

- Define slots once.
- Define per-slot `base` styles.
- Define per-slot styles inside each variant option.
- Support `compoundVariants` that can target one or multiple slots.
- Keep `defaultVariants`.
- Return an ergonomic API for resolving className per slot.
- Strong typing for allowed slot names and variant selections.

### Non-goals for v1

- No JSX factory or provider/consumer API.
- No build-time extraction coupling.
- No attempt to solve every headless UI pattern in a single release.

### Decision and implementation

Chosen approach: unify on one primitive, `styles.component`.

- Single-part components keep current behavior:
  - `styles.component(name, { base, variants, compoundVariants, defaultVariants })`
  - returns a class string
- Multipart components use the same API with `slots`:
  - `styles.component(name, { slots, base, variants, compoundVariants, defaultVariants })`
  - returns a slot class map

Implemented class naming strategy:
- base: `{ns}-{slot}`
- variant: `{ns}-{slot}-{dimension}-{option}`
- compound: `{ns}-{slot}-compound-{index}`

Implemented output behavior:
- always returns every declared slot key
- slot with no matching styles resolves to `''`

### Follow-up opportunities

1. Add optional dev warning for declared-but-never-styled slots.
2. Improve docs with multipart component examples (Tabs, Accordion, Select).
3. Consider an ergonomic helper for slot lookups if users request it.
