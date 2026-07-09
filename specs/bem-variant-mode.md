# BEM Variant Naming (`mode: 'bem'`) — Design Spec

## The actual problem

Some design systems author class names as BEM (Block Element Modifier):

```html
<div class="dialog dialog--open">
  <button class="dialog__trigger dialog__trigger--primary">Open</button>
  <div class="dialog__content">...</div>
</div>
```

Today, `styles.component()`'s default (only) class-based naming is a flat
`{namespace}-{dimension}-{option}` concatenation (`button-variant-primary`,
`button-size-small` in `semantic` mode) — readable, but not BEM shaped, and
with no concept of BEM "elements" for multi-part components at all. A design
system that wants authentic BEM output today would have to hand-author
`'&.block--modifier'` nested-selector keys itself, the same gap
`specs/attribute-driven-variants.md` identified for `data-*` attributes.

This spec adds `mode: 'bem'` as a `ClassNamingMode` value (sibling to
`semantic | hashed | compact | atomic | attribute`), covering both the plain
dimensioned config and multi-slot (`slots: [...]`) components — see
`specs/attribute-driven-variants.md` for why `mode` (an instance-level
`createStyles()` setting) is the right axis for this rather than a
per-component field, and for the relocation of `mode: 'attribute'` this spec
is a sibling to.

## Public API

```ts
const { styles } = createStyles({ mode: 'bem' });

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
  },
  compoundVariants: [
    { variants: { variant: 'primary', size: 'large' }, style: { fontWeight: 700 } },
  ],
  defaultVariants: { variant: 'primary', size: 'small' },
});

button({ variant: 'primary', size: 'large' });
// "button button--primary button--large"

button.base; // "button"
button['variant-primary']; // "button--primary"  (same destructurable key NAMES as today; different VALUES)
button['size-large']; // "button--large"
```

Authoring shape of `variants`/`compoundVariants`/`defaultVariants` is
**unchanged** from a normal component — same as attribute mode, the point is
that design systems can move a component between naming conventions without
restructuring the style objects.

## Naming rules

- **Base/block class:** `${namespace}` — no `-base` suffix. In real BEM the
  bare block class already represents the base/unmodified state; only
  modifiers get a suffix. (`semantic` mode's `button-base` becomes `button`.)
- **Modifier classes:** `${block}--${option}` — **no dimension name in the
  class**, matching real BEM (`button--primary`, not
  `button--variant-primary`). This is the authentic shape someone choosing
  this mode is actually opting into.
- **Compound variants:** chained modifier-class selectors, no synthetic
  class — CSS is `&.button--primary.button--large { font-weight: 700; }`,
  and the runtime class list is just `"button button--primary button--large"`.
  No compound-specific class, no runtime compound-matching logic: the browser
  resolves the chained selector once both modifier classes are present on the
  element. This mirrors exactly how `mode: 'attribute'` handles compounds via
  chained attribute selectors (`&[data-a][data-b]`) with no runtime matching
  either.
- **`styles.class()` (non-component calls)** behaves identically to
  `semantic` mode under `mode: 'bem'` — the modifier concept only exists
  relative to a `styles.component()` dimension; there's nothing to modify
  without one.

### Collision safety (dev-mode warning)

BEM has no dimension namespace, so two _different_ dimensions producing the
same option string collide on the identical class name — e.g.
`intent: 'primary'` and `theme: 'primary'` on the same component both want
`button--primary`. This is a real, inherent BEM footgun (not something
typestyles can silently prevent while staying BEM-faithful), so
`styles.component()` warns in dev (same channel as
`devWarnUnknownVariantDimensions`/`devWarnInvalidDimensionOption`) when two
dimensions in one component would emit the same modifier class, rather than
silently letting one CSS rule clobber the other.

## Multi-part components via `slots`

Unlike `mode: 'attribute'` (which excludes `slots` — see
`specs/attribute-driven-variants.md`'s "Explicitly out of scope"), `mode:
'bem'` supports `slots` from v1, mapping onto the `root`/`trigger`/`content`
slot-naming convention this repo's docs already establish
(`docs/content/docs/components.md:87`):

- The **`root`** slot maps to the **block** itself: `${namespace}` (bare, no
  suffix) — `root` already means "the top-level/outer element" in this
  codebase's convention, which is exactly what BEM's undecorated block class
  represents.
- Every **other slot** maps to a BEM **element**: `${block}__${slot}` (e.g.
  `dialog__trigger`, `dialog__content`).
- A slot's variant option compiles to a **modifier scoped to that slot's
  class**: `${block}--${option}` for `root`, `${block}__${slot}--${option}`
  for others (e.g. `dialog__trigger--primary`). No dimension name in the
  modifier, same rationale as the single-component case. Collision checking
  is scoped per slot-class: `dialog__trigger--primary` colliding across two
  dimensions is a problem; `dialog__trigger--primary` vs
  `dialog__content--primary` are unrelated classes on unrelated elements, not
  a collision.
- **Slot compound variants** chain modifier classes on that slot's own
  element class (`&.dialog__trigger--primary.dialog__trigger--large`), same
  no-synthetic-class, no-runtime-matching approach as the single-component
  case.
- **`MultiSlotConfig`** (no `variants`, just independent per-slot styles)
  follows the same `root` → block, others → `${block}__${slot}` mapping, with
  no modifier concept since there's no `variants` field at all in that shape.
- If a config has **no `root` slot**, no bare block class is ever emitted —
  only `__slot`-suffixed element classes. `root` is a naming convention this
  repo's docs already establish, not a requirement `mode: 'bem'` enforces.

Example:

```ts
const dialog = styles.component('dialog', {
  slots: ['root', 'trigger', 'content'],
  base: { root: { display: 'grid' }, trigger: { cursor: 'pointer' } },
  variants: {
    size: {
      sm: { trigger: { fontSize: '12px' }, content: { padding: '8px' } },
      lg: { trigger: { fontSize: '16px' }, content: { padding: '12px' } },
    },
  },
});

dialog({ size: 'lg' });
// { root: "dialog", trigger: "dialog__trigger dialog__trigger--lg", content: "dialog__content dialog__content--lg" }
```

## Compilation & runtime semantics

Each variant option's style block is folded into `base` as a synthetic
nested-selector key before the single existing
`classNamesAndRulesForProperties(...)` call — the same trick
`specs/attribute-driven-variants.md` used for attribute selectors, just with
a class selector instead:

- option `variant.primary` → merged as `'&.button--primary': { backgroundColor: '#0066ff', color: '#fff' }`
- compound `{ variant: 'primary', size: 'large' }` → merged as
  `'&.button--primary.button--large': { fontWeight: 700 }`

This reuses the existing nested-selector pipeline
(`atomic-decompose.ts`'s `walkAtomic`/`resolveSelectorChain`) with no
mode-specific branching in the CSS-emission code, so `semantic`/`hashed`
sub-choices... **do not apply** — `mode: 'bem'` is its own top-level mode
(see "Interaction with other modes" below), not a sub-flavor layered on top
of `semantic`.

Runtime selection/default-resolution logic (`normalizeSelection`,
`devWarnUnknownVariantDimensions`, `devWarnInvalidDimensionOption`) is
unchanged from today's class-based path — only the naming layer that turns
`(namespace, dimension, option)` into a class string changes.

### Interaction with other modes

`mode: 'bem'` is a distinct top-level `ClassNamingMode` value, not composable
with `semantic`/`hashed`/`compact`/`atomic` within one instance (same as
those four can't compose with each other today). `mode: 'attribute'` and
`mode: 'bem'` are also mutually exclusive per instance — a design system
wanting both attribute-based and BEM-based components creates two
`createStyles()` calls.

## Typing — no new return types needed

Unlike `mode: 'attribute'`, `mode: 'bem'` returns **plain strings
everywhere**, single-component and slots alike — same destructurable key
_names_ as today (`base`, `{dimension}-{option}`), just different string
_values_, and `SlotComponentFunction`/`MultiSlotReturn` already return
`Record<string, string>`. This means:

- `ComponentReturn<V>`, `SlotComponentConfig`, `SlotComponentFunction`,
  `MultiSlotConfig`, `MultiSlotReturn` need **zero type changes**.
- `ClassNamingMode` gains the `'bem'` literal; `ClassNamingConfig['mode']`
  and any exhaustive `switch`/lookup over `ClassNamingMode` in
  `class-naming.ts`/`atomic-decompose.ts` need a `'bem'` branch.
- No new `createStyles()` overloads are needed for `bem` specifically (unlike
  `attribute`, which does need new overloads — see
  `specs/attribute-driven-variants.md`'s "Types" section) — `mode: 'bem'`
  is just another value accepted by the existing `mode?: ClassNamingMode`
  option, returning the same `StylesApi`/`StylesWithUtilsApi`/etc. shapes.

## Testing

New `packages/typestyles/src/component-bem-variants.test.ts`:

- Single dimension → correct class list, `--modifier` CSS selector, no
  `-base` suffix on the block class.
- Multiple dimensions → correct merged class list.
- Compound variants → chained-selector CSS (`&.x--a.x--b`), no synthetic
  compound class in the class list or in `classMap`.
- Collision warning: two dimensions with an overlapping option string emit a
  dev warning. Both rules still get inserted under the identical class
  selector — standard CSS cascade means the later-declared dimension (by
  `variants` object key order) wins for overlapping properties, matching
  ordinary CSS source-order semantics. The warning exists so this isn't a
  silent surprise, not to change the (already well-defined) cascade outcome.
- `defaultVariants` resolution matches existing class-based resolution
  behavior (same dev warnings on unknown dimension/option).
- Slots: `root` → bare block class; non-root slots → `block__slot`; slot
  variants → `block__slot--modifier` / `block--modifier` for `root`; slot
  compound variants → chained selectors scoped to the slot's class.
- `MultiSlotConfig` under `mode: 'bem'`: same `root`/element mapping, no
  modifier classes since no `variants`.
- `String(...)`/`cx(...)` interop (plain strings — should need no special
  handling, unlike `ComponentAttrsResult`).

## Docs

New "BEM variant naming" subsection in `docs/content/docs/components.md`,
alongside the attribute-driven-variants subsection, covering:

- The naming rules above with the `dialog`/`button` examples.
- When to reach for it vs. `attribute`/default class naming: teams with an
  existing BEM-authored CSS convention, or wanting classes greppable/readable
  in the exact `block__element--modifier` shape without attribute selectors.
- The collision caveat and its dev-mode warning — call this out prominently,
  since it's the one sharp edge inherent to choosing BEM.
- No dimension name in modifiers is a deliberate, permanent choice (see
  "Explicitly out of scope"), not a v1 gap.

---

## Explicitly out of scope

- **BEM elements beyond the `slots` model.** An "element" is exactly "a named
  slot other than `root`" — there's no separate standalone element concept,
  no nested elements-within-elements, no dynamic/computed element names.
- **Custom modifier delimiter or casing** (e.g. SUIT's `Block--modifier`
  PascalCase, or a single-dash `block-modifier` convention). `mode: 'bem'`
  is one fixed, opinionated convention. This spec establishes the
  "add a `ClassNamingMode` value" pattern for future presets — a SUIT-style
  mode, or a fully custom naming-template function, are plausible fast-follows
  once `bem` has real usage, not built speculatively now.
- **Per-dimension namespacing of modifiers** (e.g. an opt-in
  `button--variant-primary` form to avoid the collision footgun). The dev
  warning is the mitigation; adding a config knob to silence the warning by
  changing the naming shape is a fast-follow only if the collision warning
  proves to be a real adoption blocker in practice.
- **Mixing `bem` with `attribute` or the other three modes within one
  `createStyles()` instance.** Consistent with how none of the five modes
  compose with each other today.
