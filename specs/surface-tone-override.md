# `descendant` Scope on the Theme Condition Engine — Implementation Spec (P5.4)

Implements `IMPROVEMENTS.md` P5.4.

**Scope note:** this spec originally also covered a design-system-layer
`DesignThemeConfig.surfaces` config for building fixed-tone surface overrides
(e.g. an always-dark toast on an otherwise light page). That design-system
package has since moved to var-ui (a separate, public project). This document
now covers the **core engine piece only** — the condition-engine change that
makes fixed-tone overrides possible at all. The consumer-side convention
(attribute name, tone values, per-theme wiring) is var-ui's own concern; see
that project's roadmap/specs for the equivalent design-system-layer spec.

---

## The actual problem

Sometimes a specific element needs to render with a _fixed_ color-scheme
regardless of the page's ambient mode — a toast that's always dark even on a
light page, a syntax-highlighted code block that stays dark in light mode, a
promotional banner styled dark on purpose. This is different from "dark mode":
it's not about what the _user_ prefers, it's a _design decision fixed to one
element_, independent of `prefers-color-scheme` or whatever `[data-mode]` the
page currently carries.

Today's token system has no way to express "regardless of ambient mode, this
specific marked element should use this fixed value set." `tokens.createTheme`
already has the machinery to conditionally apply a value set (`modes` +
`tokens.when.attr(...)`) — but `ThemeConditionAttr`'s `scope` field only
supports `'self'` (the attribute lives on the theme root itself, compiling to
`.theme-name[data-x="y"]`) and `'ancestor'` (the attribute lives on an
ancestor of the theme root, compiling to `[data-x="y"] .theme-name` — the
shape used for `data-mode` living on `<html>`, above the theme div). Neither
expresses "the attribute lives on a _descendant_ of the theme root" —
`.theme-name [data-x="y"]`, matching a marker element somewhere _inside_ the
themed subtree. That third relationship is exactly what a fixed-tone toast
wrapper needs, and it's a real, generic gap in the condition engine
independent of any specific consumer — worth fixing at that level rather than
building a parallel mechanism next to it.

---

## `descendant` scope on the condition engine

Add a third option to `ThemeConditionAttr`/`ThemeConditionClass`'s `scope`
field: `'self' | 'ancestor' | 'descendant'`.

- `condAttr(name, value, { scope: 'descendant' })` compiles to
  `{ selectorSuffix: ' [${name}="${value}"]' }` — a leading-space suffix,
  producing a genuine descendant combinator (`.theme-name [data-x="y"]`)
  rather than the attached suffix `'self'` already produces
  (`.theme-name[data-x="y"]`, no space).
- Same treatment for `condClassName`.
- `when.not()` on a descendant-scoped condition is **not supported** — a
  descendant relationship can't collapse into a single compound selector the
  way `:not()` requires for the other two scopes, and attempting it would
  produce either invalid CSS or a rule with different semantics than
  intended. `negateCompiled` gets an explicit branch for this that logs the
  existing dev-mode "not supported" warning pattern and emits no rule, rather
  than falling through to the current unhelpful "unexpected selector suffix
  shape" warning.

This is the entire change. No new exported function, no new `ThemeConfig`
field — `createTheme`'s existing `modes` array already accepts any
`ThemeModeDefinition`, and a descendant-scoped one is just another entry in
it:

```ts
tokens.createTheme('acme', {
  base: lightValues,
  modes: [
    ...tokens.colorMode.systemWithLightDarkOverride({ ... }), // existing ambient light/dark
    {
      id: 'surface-dark',
      overrides: darkValues,
      when: tokens.when.attr('data-surface', 'dark', { scope: 'descendant' }),
    },
  ],
});
```

Note `colorMode.systemWithLightDarkOverride(...)` already returns a plain
`ThemeModeDefinition[]` (it's how `createTheme` consumes it internally) — so
spreading it alongside hand-written descendant-scoped entries into `modes:`
sidesteps `createTheme`'s existing "`modes` and `colorMode` are mutually
exclusive" validation without needing to relax that check. Ambient-mode
switching and fixed-surface overrides are just two kinds of mode layer in the
same array; the engine doesn't need to know they came from different call
sites.

---

## Nothing here requires a framework

The mechanism is a condition type compiling to a plain CSS selector — nothing
about it is React-specific or requires any framework at all. Any consumer
builds whatever ergonomics it wants (a config field, a component wrapper, a
documented convention) on top of this one selector-compiling primitive.

---

## Known properties worth documenting (not bugs, not solved here)

- **No built-in "reset to ambient mode" behavior.** A descendant-scoped mode,
  once matched, stays matched for that subtree — there's no way to have a
  nested child inside it fall back to whatever ambient mode governs the rest
  of the page. This is a property of ordinary CSS selector matching, not
  something this change could special-case away; a consumer wanting a
  "cancel" tone would need to define one explicitly as its own mode.
- **Nesting an identical descendant-scoped condition is a harmless no-op.**
  `[data-x="y"]` nested inside another `[data-x="y"]` reapplies the identical
  override — plain CSS attribute-selector matching, not a toggle.

---

## Testing

- **`theme.test.ts` additions**: `condAttr`/`condClassName` with
  `scope: 'descendant'` compile to a leading-space selector suffix producing
  `.theme-name [data-x="y"]` (confirmed via a full `createTheme` call and
  inspecting `getRegisteredCss()`); `when.not()` on a descendant-scoped
  condition logs the dev-mode warning and emits no rule, rather than falling
  into the generic "unexpected shape" warning path; existing `'self'`/
  `'ancestor'` test cases are unaffected (regression check).

---

## Implementation Tasks

### Task 1 — Add `'descendant'` to the condition engine

Extend `ThemeConditionAttr`/`ThemeConditionClass` (`types.ts`), `condAttr` /
`condClassName` (`theme.ts`), `compileCondition`'s `attr`/`class` branches, and
`negateCompiled`'s explicit-rejection branch per the design above.

**Done when:** the `theme.test.ts` cases from Testing pass; existing
`'self'`/`'ancestor'` behavior is unchanged.

### Task 2 — Tests

Write the tests described in Testing.

**Done when:** `pnpm test` passes in `packages/typestyles` with the new/updated
suite included.

### Task 3 — Docs

Add a theming docs section demonstrating `scope: 'descendant'` with a generic
example (a fixed-tone element, without prescribing any particular attribute
name or tone vocabulary — that's a consumer decision). Mark P5.4 shipped in
`IMPROVEMENTS.md` with the PR link.

**Done when:** docs page builds and includes a working example.

---

## Explicitly out of scope

- **Any specific attribute name, tone vocabulary, or per-theme config shape**
  for consumers to build fixed-tone overrides with. That's a design-system
  decision (var-ui's, or any other consumer's), not a core engine concern.
- **A purpose-tuned "floating surface" token set** distinct from whatever
  light/dark values a consumer already has. Not a core concern at all — core
  only compiles selectors, it has no opinion about token values.

---

## Why this doesn't read like a straight port

The most consequential decision in this spec is arguably the smallest edit in
it: adding `'descendant'` as a third `scope` value to an existing type,
instead of introducing a dedicated new theming API. Reading the condition
engine's existing `self`/`ancestor` vocabulary closely enough to notice it was
missing exactly one relationship — rather than starting from "how do I
express a themeable subtree" and building outward — is what keeps this from
turning into a second, parallel theming mechanism that happens to solve the
same problem a different way.
