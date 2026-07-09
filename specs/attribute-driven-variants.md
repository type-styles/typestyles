# Attribute-Driven Variants (`variantStrategy: 'attribute'`) — Design Spec

## The actual problem

Some design systems want variant state expressed on the DOM as `data-*`
attributes rather than as discrete classes — e.g.

```html
<button class="btn" data-variant="primary" data-size="small"></button>
```

This is the convention headless/primitive libraries (Radix, Ark, native
`<details>`/`popover` polyfills) already use for interaction state
(`data-state="open"`), and some design systems want to extend it to their own
authored variants too: one stable base class, variant selection legible
directly in the markup and DOM inspector, and (per this repo's testing
philosophy) trivially assertable in browser tests via `toHaveAttribute(...)`
without depending on generated class name internals.

`styles.component()` already supports attribute selectors — `'&[data-state="open"]'`
inside `base` compiles correctly today (`docs/content/docs/components.md`,
"Data and ARIA selectors"). What's missing is the _typed, variant-shaped_
authoring/consumption path: today, `variants` always compiles each option to a
discrete class chosen by the JS call (`packages/typestyles/src/component.ts`,
`variantClassByKey` in `createDimensionedComponent`). There is no way to author
a `variants`-shaped config and get attribute selectors + a resolved attrs bag
out the other end — you'd have to hand-build the nested-selector keys yourself
and manage the DOM attributes with no help from the type system or
`defaultVariants` resolution.

This spec adds `variantStrategy: 'attribute'` as an opt-in compilation mode for
the plain dimensioned `styles.component()` config, plus a matching
`defaultVariantStrategy` global default on `createStyles`/`createTypeStyles`.

---

## Scope (v1)

- Applies **only** to the plain dimensioned config shape (`base` /
  `variants` / `compoundVariants` / `defaultVariants`) — the "recommended for
  multi-axis variants" shape in `docs/content/docs/components.md`.
- **Not supported in v1:** the flat config shape (`FlatComponentConfig`) and
  multi-slot components (`slots: [...]`). Both are excluded at the type level
  (the option doesn't exist on those config types), not just at runtime.
  Slots are a plausible fast-follow once this ships and gets real usage — see
  "Explicitly out of scope."

---

## Public API

### Per-component opt-in

```ts
export type ComponentConfig<V extends VariantDefinitions> = {
  base?: CSSProperties;
  variants?: V;
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: VariantOptionStyle;
  }>;
  defaultVariants?: ComponentSelections<V>;
  variantStrategy?: 'class' | 'attribute'; // NEW — default 'class'
};
```

```ts
const button = styles.component('button', {
  base: { padding: '8px 16px', borderRadius: '6px' },
  variants: {
    variant: {
      primary: { backgroundColor: '#0066ff', color: '#fff' },
      secondary: { backgroundColor: '#6b7280', color: '#fff' },
    },
    size: {
      small: { fontSize: '14px' },
      large: { fontSize: '18px' },
    },
    disabled: {
      true: { opacity: 0.5, cursor: 'not-allowed' },
      false: {},
    },
  },
  defaultVariants: { variant: 'primary', size: 'small', disabled: false },
  variantStrategy: 'attribute',
});

const b = button({ variant: 'primary', size: 'small', disabled: true });

String(b);      // "button-base"
b.className;    // "button-base"
b.attrs;        // { 'data-variant': 'primary', 'data-size': 'small', 'data-disabled': '' }
b.props;        // { className: 'button-base', 'data-variant': 'primary', 'data-size': 'small', 'data-disabled': '' }

<button {...b.props}>...</button>
// <button class="button-base" data-variant="primary" data-size="small" data-disabled>
```

Authoring shape of `variants`/`compoundVariants`/`defaultVariants` is
**unchanged** — the only difference from a normal component is the one added
field. This matters: it means design systems can flip a component between
class-based and attribute-based variants without restructuring the style
objects themselves.

### Global default: `defaultVariantStrategy`

`ClassNamingConfig` (the config threaded through `createStyles`/
`createTypeStyles` into every `styles.component()` call via
`createComponent(classNaming, ...)`) gets one new optional field, mirroring
how `mode`/`prefix`/`scopeId`/`breakpoints` already act as global defaults:

```ts
export type ClassNamingConfig = {
  mode: ClassNamingMode;
  prefix: string;
  scopeId: string;
  cascadeLayers?: ResolvedCascadeLayers;
  breakpoints?: Record<string, string>;
  defaultVariantStrategy?: 'class' | 'attribute'; // NEW — default 'class'
};
```

```ts
const { styles } = createStyles({
  defaultVariantStrategy: 'attribute',
});

// inherits 'attribute' — no per-call variantStrategy needed
const button = styles.component('button', {
  base: { padding: '8px 16px' },
  variants: { variant: {...}, size: {...} },
});

// per-component override back to class-based when needed
const badge = styles.component('badge', {
  base: {...},
  variants: {...},
  variantStrategy: 'class',
});
```

Resolution order inside `createComponent`:

```
effectiveStrategy = config.variantStrategy ?? classNaming.defaultVariantStrategy ?? 'class'
```

Because `createTypeStyles`'s `NamingPartial` already spreads straight into
`createStyles` (`create-type-styles.ts`), `defaultVariantStrategy` is
available there automatically with no additional plumbing.

---

## Compilation & runtime semantics

### Attribute naming

Attribute name is `data-${dimension}`, **passed through verbatim — no
kebab-casing.**

- CSS attribute-selector _names_ match case-insensitively in HTML documents,
  so a camelCase dimension name produces a working selector regardless of how
  the browser normalizes the attribute name on the actual DOM node (via
  `setAttribute`/JSX rendering, which lowercases HTML attribute names on
  write). There's no selector-matching bug either way.
- The one real caveat, worth documenting rather than solving: for a
  **multi-word camelCase dimension** (e.g. `fontWeight`), the attribute that
  actually lands in the DOM is the browser-lowercased `data-fontweight` (no
  inserted hyphen) — which does not round-trip through the native
  `element.dataset.fontWeight` accessor (that requires the kebab form
  `data-font-weight`). In practice this doesn't matter for the common case
  (dimension names are single words: `variant`, `size`, `tone`, `intent`,
  `disabled`); call it out in the docs rather than adding a case-conversion
  utility for it.

### Boolean dimensions are presence-based

For a dimension whose options are exactly `{ true: {...}, false: {...} }`:

- `true` → attribute present with an empty string value in `attrs`/`props`
  (`{ 'data-disabled': '' }`, renders as bare `data-disabled`).
- `false` → the key is omitted from `attrs`/`props` entirely.
- CSS is authored/emitted against the presence selector `&[data-disabled]`,
  not a value match — matching native HTML boolean-attribute convention and
  how Radix/Ark emit equivalent state.

### CSS generation reuses the existing nested-selector pipeline

Rather than adding a parallel "kind" of rule emission, each variant option's
style block is folded into `base` as a synthetic nested-selector key _before_
the single existing `classNamesAndRulesForProperties(...)` call that already
handles `base`:

- option `variant.primary` → merged as `'&[data-variant="primary"]': { backgroundColor: '#0066ff', color: '#fff' }`
- boolean option `disabled.true` → merged as `'&[data-disabled]': { opacity: 0.5, cursor: 'not-allowed' }`
- compound `{ variant: 'primary', size: 'large' }` → merged as `'&[data-variant="primary"][data-size="large"]': { fontWeight: 700 }`
  — a single combined attribute selector, no compound class, no runtime
  matching. (Every dimension referenced in a compound condition must itself be
  attribute-mode, which holds automatically since `variantStrategy` is
  component-wide in v1.)

This is the same nested-selector pipeline that already powers
manually-authored `'&[data-x]'` keys in `base` today
(`atomic-decompose.ts`'s `walkAtomic` / `resolveSelectorChain`), so it works
identically under `semantic`, `hashed`, `compact`, and `atomic` class-naming
modes with no mode-specific branching. Under `atomic` mode specifically, each
declaration inside an attribute branch still gets its own atomic class that's
applied unconditionally to the element and is inert unless the real DOM
attribute matches — exactly like an `&:hover` branch does today.

### Runtime

The existing dimensioned `selectorFn`'s default-resolution loop
(`normalizeSelection`, `devWarnUnknownVariantDimensions`,
`devWarnInvalidDimensionOption`) is reused unchanged for resolving
explicit selections against `defaultVariants`. In attribute mode, instead of
pushing a class per resolved dimension, it builds the `attrs` object from the
resolved values. Compound variants need **no runtime matching logic at all**
in attribute mode — the browser resolves the combined attribute selector once
the individual attributes are set on the element.

### Return value

```ts
export interface ComponentAttrsResult {
  readonly className: string;
  readonly attrs: Readonly<Record<string, string>>;
  readonly props: Readonly<Record<string, string>>; // className + attrs merged
  toString(): string;
  [Symbol.toPrimitive](hint: string): string;
}
```

Mirrors the existing `ThemeSurface` pattern (`types.ts`) — an object that
behaves like a string in template literals and `cx(...)` (via `toString()` /
`Symbol.toPrimitive`) while exposing structured data for JSX/framework
spreading. `button.base` still exposes the real base class name; there are no
per-option properties (`button['variant-primary']`) in attribute mode since no
discrete class exists for them — `attrs`/`props` are the only way to read
variant output.

### Types

`styles.component()`'s overload resolution branches on the literal
`variantStrategy` (falling back to `classNaming.defaultVariantStrategy`) the
same way it already branches on flat vs. dimensioned vs. slots config shape.
When the effective strategy is `'attribute'`, the callable's return type is
`ComponentAttrsResult`; otherwise (`'class'`, the default) it's `string`,
identical to today. `SlotComponentConfig`/`FlatComponentConfig` simply don't
have a `variantStrategy` field, so mixing attribute mode with either is a
compile-time error.

---

## Testing

New coverage in `packages/typestyles/src/component.test.ts` (or a sibling
`component-attribute-variants.test.ts`):

- Single dimension → correct `attrs`/`props`/CSS.
- Boolean dimension → presence-based `attrs` (`true` → empty-string key
  present, `false` → key omitted) and `&[data-x]` presence-selector CSS.
- Multiple dimensions → correct merged `attrs`/`props`.
- `defaultVariants` resolution matches the existing class-based resolution
  behavior (same dev warnings on unknown dimension/option).
- Compound variants → single combined attribute-selector CSS rule, no
  compound class emitted.
- `String(b)` / `cx(b, 'extra')` interop via `toString()`/`Symbol.toPrimitive`.
- `atomic` class-naming mode: per-declaration atomic classes still scope
  correctly under the attribute-selector branch.
- `createStyles({ defaultVariantStrategy: 'attribute' })`: a component
  omitting `variantStrategy` inherits it; a component setting
  `variantStrategy: 'class'` overrides it back to class-based.

## Docs

New "Attribute-driven variants" subsection in
`docs/content/docs/components.md`, using the `<button class="btn"
data-variant="primary" data-size="small">` example, and covering:

- When to reach for it vs. class-based variants: matching Radix/shadcn-style
  DOM conventions, SSR/vanilla emit, avoiding per-variant class bloat, easy
  attribute-based test assertions.
- The trade-off: no per-option class hooks for external CSS to target
  (compare to the public class-name contract in
  `specs/component-override-contract.md`) — attribute mode intentionally
  narrows the public surface to the DOM attributes themselves.
- The pass-through/no-kebab-casing caveat for multi-word camelCase dimension
  names, and the `element.dataset` mismatch it implies.

---

## Explicitly out of scope

- **Multi-slot (`slots: [...]`) support.** Real added complexity (which slot
  do a dimension's attributes apply to when the option's style targets
  multiple slots, or none) that's better designed against actual usage of the
  single-component version first, rather than speculatively now.
- **Flat (non-dimensioned) config support.** The flat shape's simplicity
  (boolean-style toggles, no `variants`/`defaultVariants` structure) doesn't
  map cleanly onto default-resolution + attrs-bag semantics; dimensioned
  config is already the documented recommendation for anything beyond a
  single toggle.
- **Per-dimension attribute name override** (e.g. mapping dimension `intent`
  to attribute `data-variant`, or emitting `aria-*` instead of `data-*`).
  Name the dimension to match the attribute you want; revisit only if a real
  need for divergent naming shows up.
- **Kebab-casing (or any other case transformation) of dimension names.**
  Passed through verbatim per the "Attribute naming" section above.
- **Mixing class-based and attribute-based variants within a single
  component.** `variantStrategy` is component-wide, not per-dimension. A
  design system that wants both can ship two components (or two `styles.component`
  calls for one visual component, one per strategy) — revisit only if a
  concrete case for true per-dimension mixing shows up.
