# Theme API: conditions, color modes, and ergonomics

This document specifies how TypeStyles should expose **themed token overrides** (CSS custom properties on a theme surface) and **when** those overrides apply—media queries, selectors, attributes, or combinations—without forcing a single global opinion about light/dark/system.

It replaces ad hoc `insertRules` + hand-built CSS strings (see `examples/design-system/src/create-theme.ts`) with a **typed, composable API** whose output is deterministic sheet entries with stable dedupe keys.

---

## 1. Problems we are solving

1. **Table stakes:** `@media (prefers-color-scheme: dark)` must not require internal or stringly APIs.
2. **No one true mode:** Teams differ:
   - **Media only** — follow the OS, no toggle.
   - **Selector / attribute only** — site-controlled class or `data-*` on `html` or a subtree.
   - **Both** — e.g. “system unless the user picks light or dark” (OR semantics across conditions).
   - **Light / dark / system** — explicit “system” means media wins unless overridden; forced light must win over system dark (layered CSS rules).
3. **DX:** Defining themes should read like design tokens, not like a stylesheet compiler. Names, types, and presets should guide the common cases; escape hatches stay explicit.

---

## 2. Mental model

### 2.1 Separate _what_ from _when_

- **What changes:** A structured map of token overrides (same shape as today’s theme overrides: nested namespaces flattened to `--namespace-key` declarations).
- **When it applies:** One or more **conditions** (media, selector, attribute, boolean combinations) that **wrap** the same generated declaration block.

A **theme surface** is a class name (e.g. `theme-acme`) applied to a subtree. Base declarations set the default appearance (typically “light” or brand default). Additional **mode layers** attach the same kind of declaration block under different conditions.

This aligns with **Panda CSS** (named conditions), **Stitches** (media maps), and **vanilla-extract** (theme contracts + alternate activation), while staying faithful to TypeStyles’ **class + CSS variables** model.

### 2.2 Conditions are not “themes”

Avoid conflating **brand theme** (Acme vs Contoso) with **color mode** (light vs dark). This document uses **mode** for light/dark/system resolution and **theme** for the named surface + its token overrides. A single theme surface can expose multiple **mode layers** (default + dark + forced light, etc.).

### 2.3 Attachment scope

Conditions can be evaluated relative to the themed node or an ancestor:

| Scope          | Meaning                                                            | Example use                                 |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| **`self`**     | The element with `class="theme-acme"` also satisfies the condition | `.theme-acme[data-color-mode="dark"]`       |
| **`ancestor`** | A parent (often `:root` / `html`) satisfies the condition          | `:root[data-color-mode="dark"] .theme-acme` |

The API must require an explicit choice where ambiguity would change specificity or break layouts. Sensible **defaults** can be documented per helper (e.g. attribute-based mode on `documentElement` → `ancestor`).

---

## 3. Primary API: `tokens.createTheme`

**Name:** `tokens.createTheme` — lives on the existing `tokens` object alongside `tokens.create` / `tokens.use`; a separate `theme` namespace is **not** required.

**Signature (conceptual):**

```ts
const acme = tokens.createTheme('acme', {
  base: {
    color: { text: { primary: '#111827' }, surface: { app: '#ffffff' } },
  },
  modes: [
    {
      id: 'dark',
      overrides: {
        color: { text: { primary: '#e5e7eb' }, surface: { app: '#0f172a' } },
      },
      when: tokens.when.or(
        tokens.when.media('(prefers-color-scheme: dark)'),
        tokens.when.attr('data-color-mode', 'dark', { scope: 'ancestor' }),
      ),
    },
    {
      id: 'light-locked',
      overrides: {
        /* same shape as base — often reuses a shared object */
      },
      when: tokens.when.and(
        tokens.when.media('(prefers-color-scheme: dark)'),
        tokens.when.attr('data-color-mode', 'light', { scope: 'ancestor' }),
      ),
    },
  ],
});

// acme.className === 'theme-acme' (stable, human-debuggable)
// acme.name === 'acme'
```

**Behavior:**

1. Emit **one base rule:** `.theme-acme { --color-text-primary: …; … }` from `base`.
2. For each entry in `modes`, emit **one or more rules** (see §7) that apply `overrides` under `when`.
3. Register sheet rows with **deterministic keys**, e.g. `theme:acme:base`, `theme:acme:mode:dark:cond:0`, so HMR and deduping stay predictable.

**Return value:** A **`ThemeSurface`** object (not a bare string) so call sites get both structure and interpolation ergonomics:

```ts
type ThemeSurface = {
  readonly className: string;
  readonly name: string;
  /** Coerces to `className` — use `className={acme}` or `` `wrapper ${acme}` `` without `.className`. */
  toString(): string;
};
```

- **`acme.className`** — explicit when passing to props that require a string (recommended for React: `className={acme.className}`).
- **`` `foo ${acme} bar` ``** — template literals use `ToString`; with `toString()` returning `className`, interpolation matches a plain class string.
- **`String(acme)`** — same value as `acme.className`; use where an explicit string is required (e.g. `className={String(acme)}` if your framework accepts it).

Implementation should define `toString()` (and, if useful for edge runtimes, `Symbol.toPrimitive` with the same result) so coercion is reliable in concatenation and `String(...)`.

---

## 4. `tokens.when`: condition builders

Conditions are a **discriminated union** for exhaustiveness and autocomplete. Internally they compile to wrapper objects used by the sheet emitter (media blocks, selector prefixes, etc.).

### 4.1 Primitives

```ts
// Media — full string for flexibility
tokens.when.media('(prefers-color-scheme: dark)');

// Shorthand for the common case
tokens.when.prefersDark;
tokens.when.prefersLight; // rarely needed; prefer base + dark overlay

// Attribute on self or ancestor
tokens.when.attr('data-color-mode', 'dark', { scope: 'ancestor' | 'self' });

// Class on self or ancestor (sugar over selector)
tokens.when.className('dark', { scope: 'ancestor' | 'self' });

// Arbitrary selector fragment — escape hatch, documented caveats
tokens.when.selector('.legacy-app.dark .theme-root', {
  /* binding docs */
});
```

### 4.2 Composition

```ts
tokens.when.and(a, b, c); // all must hold
tokens.when.or(a, b); // any holds → OR of conditions
```

**OR semantics:** Implementations typically emit **separate rules** with identical declaration bodies (simplest specificity story) or one rule with comma-separated selectors where equivalent. Start with **duplicate rules** + clear docs; optimize for sheet size later.

**AND semantics:** Single compound selector or nested `@media` + selector, depending on operands. The emitter is responsible for valid CSS ordering.

### 4.3 Negation (optional but useful)

```ts
tokens.when.not(inner);
```

Use sparingly; prefer explicit positive modes for readability.

---

## 5. Presets: `tokens.colorMode`

Presets expand to `modes` + `when` trees so common setups are **one named strategy**, not copied boilerplate.

### 5.1 `mediaOnly`

Dark overrides apply only via system preference:

```ts
tokens.colorMode.mediaOnly({
  dark: darkOverrides,
});
```

Equivalent to a single mode with `when: tokens.when.prefersDark`.

### 5.2 `attributeOnly`

No media query; only `data-*` or class on an ancestor:

```ts
tokens.colorMode.attributeOnly({
  attribute: 'data-color-mode',
  values: { dark: 'dark', light: 'light' },
  scope: 'ancestor',
  dark: darkOverrides,
  // optional explicit light overrides if base is not enough
});
```

### 5.3 `mediaOrAttribute` (typical “toggle”)

Dark when **either** system prefers dark **or** attribute says dark:

```ts
tokens.colorMode.mediaOrAttribute({
  attribute: 'data-color-mode',
  values: { dark: 'dark', light: 'light', system: 'system' },
  scope: 'ancestor',
  dark: darkOverrides,
});
```

### 5.4 `systemWithLightDarkOverride` (light / dark / system)

Handles:

- **system** — follow `prefers-color-scheme` (no attribute override).
- **light** — force light tokens even when the OS is dark.
- **dark** — force dark tokens.

This matches the four-rule pattern used today in the design-system example: base light, dark under media, dark under `data-*`, and forced light under `media (dark) + data light`.

```ts
tokens.colorMode.systemWithLightDarkOverride({
  attribute: 'data-color-mode',
  values: { light: 'light', dark: 'dark', system: 'system' },
  scope: 'ancestor',
  light: lightOverrides, // often same as base; can reference shared object
  dark: darkOverrides,
});
```

**Cascade order** (later rules win over earlier for the same property) must be **fixed and documented** in THEME.md and in JSDoc—see §7.

### 5.5 Using presets inside `createTheme`

**Shipped API** — presets attach via the **`colorMode`** property (mutually exclusive with `modes`):

```ts
tokens.createTheme('acme', {
  base: { color: lightTokens },
  colorMode: tokens.colorMode.systemWithLightDarkOverride({
    attribute: 'data-color-mode',
    values: { light: 'light', dark: 'dark', system: 'system' },
    scope: 'ancestor',
    light: lightTokens,
    dark: darkTokens,
  }),
});
```

Spreading the preset into the same object as `base` is not supported; it risks key collisions and ambiguous merges.

---

## 6. Shorthands

### 6.1 Single dark block, media only

```ts
tokens.createDarkMode('acme', darkOverrides);
// or
tokens.createTheme('acme', {
  base: lightOverrides,
  modes: [{ id: 'dark', overrides: darkOverrides, when: tokens.when.prefersDark }],
});
```

The shorthand is **one line** in docs and snippets; implementation is a thin wrapper.

### 6.2 Multiple named brand themes

Brand switching stays **separate** from color mode: e.g. `theme-acme` vs `theme-contoso`, each with its own `modes` configuration, or shared `modes` factory:

```ts
const sharedModes = () => tokens.colorMode.mediaOnly({ dark: darkTokens });

tokens.createTheme('acme', { base: acmeLight, modes: sharedModes() });
tokens.createTheme('contoso', { base: contosoLight, modes: sharedModes() });
```

---

## 7. CSS emission and cascade

### 7.1 Rule ordering

For **systemWithLightDarkOverride**, recommended **source order** (first to last in the sheet for that theme):

1. Base `.theme-name { … }` (light defaults).
2. Dark under `@media (prefers-color-scheme: dark)` (system dark).
3. Dark under `ancestor[attr=dark] .theme-name` (forced dark).
4. Light under `@media (prefers-color-scheme: dark)` + `ancestor[attr=light] .theme-name` (forced light while OS dark).

This preserves “user explicit choice beats system” for light and dark.

### 7.2 Duplication vs merged selectors

- **Default:** duplicate declaration blocks per condition branch for clarity and predictable specificity.
- **Optimization:** merge identical blocks with comma-separated selectors only when the implementation can prove equivalence.

### 7.3 Keys

Every inserted rule has a stable string key, e.g.:

- `theme:{name}:base`
- `theme:{name}:mode:{modeId}:branch:{index}`

Branch index disambiguates `or()` and preset-expanded rules.

---

## 8. Types

- **`base`** and each **`overrides`** use the same **`ThemeOverrides`** shape (nested token maps aligned with `tokens.create` namespaces).
- **`when`** is **`ThemeCondition`**, a discriminated union.
- **Presets** return **`ThemeModeDefinition[]`** or a **`ThemeExtension`** object accepted by `createTheme`, so TypeScript can verify that `dark` and `light` objects reference valid token paths where the compiler supports it.

Prefer **deep partial** overrides for modes if base already defines the full tree.

---

## 9. SSR and testing

- The emitted CSS is static given the theme definition; SSR collects the same rules as client insertions.
- Tests assert on **keyed rules** or snapshot **generated CSS strings** for a small matrix of presets (media-only, attribute-only, three-way).

---

## 10. Ergonomic guidelines for implementers

1. **One obvious path** for “I just want dark mode”: `createDarkMode` or `colorMode.mediaOnly`.
2. **Presets over raw `when`** in documentation; show `when.and` / `when.or` in “Advanced” sections.
3. **Explicit `scope`** for attributes and classes whenever the condition is not on the themed element itself.
4. **No hidden globals** — attribute names and values come from user config, not hardcoded `data-theme`.
5. **Errors over silence** — invalid `when` combinations or empty `overrides` should warn in development.

---

## 11. Relation to other libraries

| Library         | Relevant idea                             | TypeStyles mapping                                     |
| --------------- | ----------------------------------------- | ------------------------------------------------------ |
| Panda CSS       | Named **conditions** on tokens            | Conditions wrap the same var block for a theme surface |
| Stitches        | **`media`** map, short aliases            | `when.media` / `when.prefersDark`                      |
| vanilla-extract | Theme **contract** + alternate activation | `createTheme` surface + modes                          |
| StyleX          | Composed style variants                   | Composed `when` trees                                  |

---

## 12. Migration from current design-system pattern

**Before:** Legacy `createTheme(name, overrides)` returning only a class string, plus manual `insertRules` with string-built declarations for media and `data-mode`.

**After:** One `tokens.createTheme(name, { base, modes | colorMode })` (or `createTheme` + `colorMode.systemWithLightDarkOverride`) so all declaration strings are generated from the same helper that flattens token entries—no duplicate `buildVarDeclString` in app code.

---

## 13. Resolved decisions

| Topic                          | Decision                                                                                                                                                                                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary API name**           | `tokens.createTheme` on the existing `tokens` object; no separate `theme` namespace.                                                                                                                                                                     |
| **`ThemeSurface` coercion**    | Implement `toString()` returning `className` (and optional `Symbol.toPrimitive` for consistency) for template literals and `String(surface)`; use `surface.className` (or `String(surface)`) where props require a real string (e.g. React `className`). |
| **Preset attachment**          | **Named `colorMode` property** on the theme config (mutually exclusive with manual `modes`); attempting both throws in development.                                                                                                                      |
| **`when.selector` validation** | **Dev-only heuristics** (empty/`!important`/unmatched brackets); production emits without parse-style checks. See `theme.ts` `validateSelector`.                                                                                                         |

## 14. Historical notes: preset shape and `when.selector`

The following options were evaluated before shipping; the implementation matches **§13** above.

### 14.1 Preset API shape (resolved: `colorMode` property)

**Shipped API:**

```ts
tokens.createTheme('acme', {
  base: { color: lightTokens },
  colorMode: tokens.colorMode.systemWithLightDarkOverride({ ... }),
});
```

Spreading a preset into the same object as `base` was rejected to avoid key collisions and ambiguous composition.

### 14.2 `when.selector`: validation vs docs-only

This escape hatch lets users pass **raw selector text** that the emitter wraps around the theme class. The open question is how much **validation** to do in dev (or always), versus relying on **documentation**.

**Dimensions**

1. **Syntax** — Is the string valid as part of a selector list? (Unclosed brackets, bad escapes.)
2. **Safety** — Is user-controlled input ever passed here? (Usually no; if yes, this is an injection surface into stylesheet text.)
3. **Specificity / cascade** — Even valid selectors can **fail to override** base theme vars or **fight** with mode layers in non-obvious ways.

**Option A — Docs only (no runtime checks)**

| Pros                                                             | Cons                                                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Zero maintenance** — no heuristics to update as CSS evolves.   | **Silent bugs** — typos produce invalid or empty rules; some engines drop whole rules quietly. |
| **No false negatives** — exotic but valid selectors always work. | **Support burden** — “why doesn’t my theme apply?” without a clear dev warning.                |
| **Simple implementation** — stringify and wrap.                  | **Onboarding** — only power users succeed without reading THEME.md §14.                        |

**Option B — Dev-only warnings (heuristic, non-blocking)**

| Pros                                                                                                                      | Cons                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Catches **obvious mistakes**: empty string, whitespace-only, suspicious `!important`, duplicate commas, unmatched `()[]`. | **False positives** — valid selectors can trip dumb heuristics; must be clearly labeled “warning, not error.” |
| **Teaches** — message can link to docs on `scope` / ancestor vs self.                                                     | **Ongoing cost** — tune list as real usage surfaces edge cases.                                               |
| Keeps production bundle small if warnings strip out.                                                                      |                                                                                                               |

**Option C — Stricter validation (block or fix)**

| Pros                                                                                                | Cons                                                                                |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Strong guarantees** for a **whitelist** (e.g. only allow certain patterns) or a **small parser**. | **Rejects valid CSS** — selectors you didn’t anticipate break legitimate apps.      |
| Could enforce **forbidden constructs** if security ever matters (e.g. no `url(` in selector).       | **Heavy** — full selector parsing is non-trivial; dependency or maintenance burden. |

**Specificity footguns to document regardless of validation**

- **Order in the sheet** — later rules win for the same property; custom selector rules must be ordered relative to base and presets or specificity must beat them.
- **Ancestor vs self** — `:root.dark .theme` vs `.theme.dark` changes which node must carry state and how specificity compounds.
- **Compound conditions** — user may duplicate what `when.and` already expresses, producing redundant or conflicting rules.
- **Comma-separated selectors** — one branch applies to many contexts; harder to reason about than one condition per rule.

**Shipped behavior:** Dev-only warnings per **§13**; production matches Option A (no validation cost). User-facing docs should still call out specificity, ancestor vs self, and ordering footguns for `when.selector`.

---

_This document is the source of truth for theme ergonomics. Update it when the public API or emission rules change._
