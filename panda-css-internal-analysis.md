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
| Build-time extraction | Panda CLI/codegen/extract | Vite/Rollup/Rolldown plugins, `@typestyles/build` CLI, `@typestyles/next/build` | Partial (CSS file + v1 manifest; rich class map not yet) |
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

1. ~~Add optional dev warning for declared-but-never-styled slots.~~ Done: warns whenever `NODE_ENV !== 'production'` (dev, test, etc.); opt out with `TYPESTYLES_SILENT_UNUSED_SLOTS=1`.
2. ~~Improve docs with multipart component examples (Tabs, Accordion, Select).~~ Done in [Recipes](/docs/content/docs/recipes.md) (“Multipart components (slots)”).
3. ~~Ergonomic helper for slot lookups~~ — Shipped as `slotClass(component, slot, selections?)` from `typestyles`.

---

## Rich extract manifest (design)

**Goal.** Match (in spirit) Panda’s codegen story: after extraction, tooling and optional “virtual” runtimes can know **which concrete `class` string** belongs to which **logical style** (namespace, variant dimension, option, slot) without executing component code in the browser. Today’s v1 manifest only records `{ version, css }` — enough to wire a static stylesheet, not enough to remap APIs to precomputed classes.

### Why it is non-trivial

1. **Names depend on `configureClassNaming`.** Semantic vs hashed vs atomic changes every emitted class. The extract process must use the **same** naming config as the app build (same entry order, same `scopeId` / `prefix` / mode) or the manifest and CSS diverge.

2. **`styles.component` is a function, not a table.** At runtime, class strings are produced by calling the component function with variant props. A full manifest is either:
   - **Exhaustive:** enumerate the Cartesian product of variant dimensions (blows up for large recipes), or
   - **Partial + fallback:** manifest only “registered” or statically analyzable combinations, or
   - **Lazy:** no manifest; keep a tiny runtime that only resolves classes (defeats “zero runtime” for that layer).

3. **`styles.hashClass` and dynamic patterns** have no stable logical key unless we define one (e.g. hash of serialized properties, or an explicit user-provided id).

4. **Multipart / slots.** Manifest entries need a **slot dimension**: e.g. `tabs.root`, `tabs.trigger`, not just `tabs`.

5. **Second process (build-runner).** Extraction runs in a separate Node process with `getRegisteredCss()`. Any manifest must be populated from the **same registration pass** that emits CSS (same singleton state), or derived deterministically from shared inputs.

### Shape options (illustrative)

**Option A — Namespace-centric (good for `styles.create` / simple components)**

```json
{
  "version": 2,
  "css": "dist/typestyles.css",
  "namespaces": {
    "button": {
      "base": "button-base",
      "variants": { "intent": { "primary": "button-intent-primary" } }
    }
  }
}
```

**Option B — Selector-keyed (closer to internal `insertRule` keys)**

Mirror the dedupe keys already passed to `insertRule` / `insertRules`, mapped to final class names. Pros: one code path; cons: keys must stay stable and documented.

**Option C — Slot recipes**

```json
{
  "tabs": {
    "slots": {
      "root": { "base": "tabs-root", "variants": { ... } },
      "trigger": { ... }
    }
  }
}
```

### Implementation phases (suggested)

| Phase | Scope | Enabling work |
| --- | --- | --- |
| **M1** | Tokens, themes, keyframes, global prefixes | Already have logical ids (`tokens:ns`, `theme:name`, etc.); map to first class or `:root` / selector string in manifest |
| **M2** | `styles.create` / two-arg `create` | Record each variant segment as registered; tie to `buildRecipeClassName` outputs |
| **M3** | `styles.component` single-part | Emit base + per-dimension options; optional cap on compound explosion (document “partial manifest”) |
| **M4** | `styles.component` + `slots` | Extend M3 with slot axis; compound variants that target subsets of slots |
| **M5** | `hashClass` / atomic | Opt-in `id:` parameter or require manifest only in semantic mode unless we hash the same payload as the class generator |

### Core hooks (where to record)

- **Central choke point:** `insertRules` / `insertRule` already receive a **dedupe `key`** and the **CSS string**. Parsing CSS back to class names is fragile; better to record **`key → className`** at the call site where the class string is known (`styles.ts`, `component.ts`, `tokens.ts`, etc.).
- **Registry:** extend beyond duplicate detection (`registeredNamespaces`) to an optional **`ManifestCollector`** interface: `recordEntry({ kind, logicalId, className, slot? })`, no-op unless `process.env.TYPESTYLES_MANIFEST` or explicit API.
- **Public API:** `getExtractManifest(): ManifestV2` used by `@typestyles/build-runner` child process to `JSON.stringify` next to the CSS file.

### Product stance

- **Full Panda parity** (every combination codegen’d) is only realistic for **bounded** variant sets; document limits and offer **“manifest coverage”** warnings in CI when call sites use props outside the emitted set.
- **Pragmatic v2:** ship **M1–M3** for design systems with stable recipes; treat **hashClass** and ad-hoc `styles.class` as manifest-excluded unless labeled.

### Relation to roadmap

This sits under “Zero-Runtime Build Option” and the bullet *“Emits a manifest mapping namespaces → class name strings”*: v1 delivers **path to CSS**; **v2+** delivers **logical → class** as above.
