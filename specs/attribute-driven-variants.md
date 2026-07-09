# Attribute-Driven Variants (`mode: 'attribute'`) — Design Spec

> **Revision note:** This spec originally shipped (PR #130, merged as commit
> `644a96c`) as a per-component `variantStrategy: 'attribute'` field plus a
> `defaultVariantStrategy` global default on `createStyles`. That merge is
> **unreleased** (`typestyles` is still at `0.8.2` on the registry; the
> changeset for #130 hasn't been consumed by a version bump yet), so this
> revision replaces the design in place rather than deprecating it. The
> per-component field is gone; `'attribute'` is now a `ClassNamingMode` value,
> set once via `createStyles({ mode: 'attribute' })`, alongside a new sibling
> `mode: 'bem'` (see `specs/bem-variant-mode.md`). See "Why relocate this into
> `mode`" below for the motivating bug this also fixes. The implementation
> will be updated to match in a follow-up PR; until then this document
> describes the target design, not `main`.

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

## Why relocate this into `mode`

`ClassNamingMode` (`semantic | hashed | compact | atomic`) is already how this
repo expresses "one whole strategy for how names + rules get formed,"
set once per `createStyles()` instance with no per-call override anywhere —
you can't mix `semantic` and `hashed` components in one instance today either.
The original per-component `variantStrategy` field, plus a
`defaultVariantStrategy` instance-level default, introduced a second axis that
didn't follow that rule, and it has a real, currently-uncaught consequence:

`styles.component()`'s return-type overloads pick `ComponentReturn<V>`
(string) vs `ComponentAttrsReturn<V>` (`{ className, attrs, props }`) purely
from the literal `variantStrategy` in **that call's own argument** — they
have no way to see an instance-level `defaultVariantStrategy`. So
`createStyles({ defaultVariantStrategy: 'attribute' })` followed by a
component that omits `variantStrategy` to inherit the default is typed as
`ComponentReturn<V>` (string) while at runtime it actually returns a
`ComponentAttrsResult` object. This isn't hypothetical — the existing test at
`component-attribute-variants.test.ts:312-321` does exactly this
(`const b = btn(...); expect(b.attrs)...`) and only "type-checks" because
`.test.ts` files are excluded from `tsconfig.json`. A real consumer hitting
this would get a value typed `string` that isn't one.

Moving `'attribute'` into `mode` closes this gap: `createStyles()`'s return
type can correctly branch its `styles.component()` overload set once, for the
whole instance, based on the `mode` passed to it — there's no longer a
call-site-vs-instance mismatch to have.

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

This spec adds `mode: 'attribute'` as a `ClassNamingMode` value, applying to
the plain dimensioned `styles.component()` config for every component created
from a `createStyles`/`createTypeStyles` instance configured with it.

---

## Scope (v1)

- Applies **only** to the plain dimensioned config shape (`base` /
  `variants` / `compoundVariants` / `defaultVariants`) — the "recommended for
  multi-axis variants" shape in `docs/content/docs/components.md`.
- **Not supported:** the flat config shape (`FlatComponentConfig`) and
  multi-slot components (`slots: [...]`) under `mode: 'attribute'`. Both are
  excluded at the type level — under a `createStyles({ mode: 'attribute' })`
  instance, `styles.component()` has no overload accepting `slots` at all, so
  passing one is a compile error, not just a runtime restriction. Unlike the
  original v1 draft, this is **not** expected to be a near-term fast-follow
  for attribute mode specifically — multi-part support landed instead for
  `mode: 'bem'` (see `specs/bem-variant-mode.md`), which has a much more
  established convention (`block__element`) for what a "part" means than
  attribute mode does. Revisit attribute+slots only if real demand shows up.

---

## Public API

### Instance-level opt-in via `mode`

```ts
export type ClassNamingMode =
  | 'semantic'
  | 'hashed'
  | 'compact'
  | 'atomic'
  | 'attribute' // NEW
  | 'bem'; // NEW — see specs/bem-variant-mode.md

export type ComponentConfig<V extends VariantDefinitions> = {
  base?: CSSProperties;
  variants?: V;
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: CompoundSelectionValue<VariantOptionKey<V, K>> };
    style: VariantOptionStyle;
  }>;
  defaultVariants?: ComponentSelections<V>;
  // `variantStrategy` is removed — no per-component field.
};
```

```ts
const { styles } = createStyles({ mode: 'attribute' });

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
**unchanged** — every dimensioned `styles.component()` call from a
`mode: 'attribute'` instance compiles this way; there's no per-call opt-in
because there's no per-call opt-out. A design system that wants some
components class-based and others attribute-based creates two `createStyles()`
instances — same as it already would to mix `semantic` and `hashed` today.

Because `createTypeStyles`'s `NamingPartial` already spreads straight into
`createStyles` (`create-type-styles.ts`), `mode: 'attribute'` is available
there automatically with no additional plumbing.

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
  matching. (Every dimension in every component compiles in attribute mode,
  which holds automatically now that `mode` is an instance-wide setting —
  there's no per-dimension or per-component override to create a mixed case.)

This is the same nested-selector pipeline that already powers
manually-authored `'&[data-x]'` keys in `base` today
(`atomic-decompose.ts`'s `walkAtomic` / `resolveSelectorChain`), reused with
no mode-specific branching in the CSS-emission code.

**Base class naming under `mode: 'attribute'`:** since `'attribute'` is now
its own top-level `ClassNamingMode` value — mutually exclusive with
`semantic`/`hashed`/`compact`/`atomic`, the same as `bem` is (see
`specs/bem-variant-mode.md`'s "Interaction with other modes") — it needs its
own rule for the one class it does still emit (`base`). It uses the same
rule as `semantic` mode (`${scopePrefix}${namespace}-base`, e.g.
`button-base`), matching the worked example above. **Consequence:** the
original per-component design let `variantStrategy: 'attribute'` compose
with any of the four `mode` values (e.g. `hashed` base-class naming +
attribute-based variants); folding `'attribute'` into `mode` itself removes
that combination — there is no hashed/compact/atomic base-class naming
available alongside attribute-based variants in this design. Revisit only if
a concrete need for collision-proofed base classes alongside attribute
variants shows up; attribute mode's whole premise (DOM legibility matching
Radix/shadcn conventions) makes a readable, semantic-style base class the
overwhelmingly likely preference anyway.

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

`createStyles()` gains new overload branches keyed on the literal
`{ mode: 'attribute' }`, returning a `styles` object (`AttributeStylesApi`)
whose `component()` has **only** the dimensioned-config overload, returning
`ComponentAttrsReturn<V>` unconditionally — no `slots` or flat-config overload
exists on it at all, so either is a compile-time error under this instance.
This needs to be threaded through the 4 existing instance shapes (bare /
`utils` / `layers` / `utils`+`layers`) — 4 new overload branches total, not a
combinatorial explosion, since `semantic`/`hashed`/`compact`/`atomic`/`bem`
all continue to share today's `StylesApi` shape (dimensioned config returns
plain `ComponentReturn<V>`, i.e. `string`). See `specs/bem-variant-mode.md`
for why `mode: 'bem'` specifically needs **no** new types at all.

---

## Testing

Coverage in `packages/typestyles/src/component-attribute-variants.test.ts`
(existing file, needs updating for the relocation):

- Single dimension → correct `attrs`/`props`/CSS.
- Boolean dimension → presence-based `attrs` (`true` → empty-string key
  present, `false` → key omitted) and `&[data-x]` presence-selector CSS.
- Multiple dimensions → correct merged `attrs`/`props`.
- `defaultVariants` resolution matches the existing class-based resolution
  behavior (same dev warnings on unknown dimension/option).
- Compound variants → single combined attribute-selector CSS rule, no
  compound class emitted.
- `String(b)` / `cx(b, 'extra')` interop via `toString()`/`Symbol.toPrimitive`.
- **Removed:** the `defaultVariantStrategy`/per-call-override tests
  (`createStyles({ defaultVariantStrategy })` describe block) — replaced with
  a `createStyles({ mode: 'attribute' })` instance-level test, since there's
  no per-call override to test anymore.
- **New:** `styles.component()` has no `slots`-accepting overload under a
  `mode: 'attribute'` instance (type-only check, e.g. a `.typecheck.ts` file
  alongside `computed-style-keys.typecheck.ts`).

## Docs

Update the "Attribute-driven variants" subsection in
`docs/content/docs/components.md` (originally added by #130) to use
`createStyles({ mode: 'attribute' })` instead of per-component
`variantStrategy`, and covering:

- When to reach for it vs. class-based/BEM variants: matching Radix/shadcn-style
  DOM conventions, SSR/vanilla emit, avoiding per-variant class bloat, easy
  attribute-based test assertions.
- The trade-off: no per-option class hooks for external CSS to target
  (compare to the public class-name contract in
  `specs/component-override-contract.md`) — attribute mode intentionally
  narrows the public surface to the DOM attributes themselves.
- The pass-through/no-kebab-casing caveat for multi-word camelCase dimension
  names, and the `element.dataset` mismatch it implies.
- No `slots` support (unlike `mode: 'bem'`) — see `specs/bem-variant-mode.md`.

---

## Explicitly out of scope

- **Multi-slot (`slots: [...]`) support**, specifically for attribute mode.
  Multi-part composition landed instead for `mode: 'bem'`
  (`specs/bem-variant-mode.md`), which has a well-established
  `block__element` convention for "what is a part" that attribute mode
  doesn't. Revisit attribute+slots only if real demand shows up.
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
- **Per-component escape hatch out of the instance's `mode`.** Removed along
  with `variantStrategy`. A design system needing both attribute-based and
  class/BEM-based components creates two `createStyles()` instances.
