# Design System Theme Architecture Plan

This document defines the target architecture for `examples/design-system`.
Work through the tasks in order — each is a discrete, independently committable unit.

---

## Guiding Principles

| Principle                               | Rationale                                                                                                                                                                                                                                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Themes ≠ Modes**                      | A theme owns its light and dark color values. Light/dark mode is a CSS concern, not a theme concern.                                                                                                                                                                                                 |
| **CSS-first dark mode**                 | `@media (prefers-color-scheme: dark)` handles system preference automatically. A `[data-mode]` attribute provides explicit JS override. No JS required for system preference.                                                                                                                        |
| **3-layer token hierarchy**             | Primitive → Semantic → Component. Each layer references only the layer below it.                                                                                                                                                                                                                     |
| **Nested camelCase token objects**      | Token value objects are nested (`{ background: { app, surface, subtle }, text: { primary, secondary } }`). This enables dot-notation everywhere — no bracket strings. The nesting is flattened to CSS vars (`--color-background-app`) and reconstructed as a nested typed ref object for recipe use. |
| **No hardcoded colors above primitive** | Semantic token values and above must only contain palette token references (`var(--palette-slate-1)`) or CSS expressions over those references — never raw hex, rgb, or oklch literals.                                                                                                              |
| **Transparent-alpha for derived tints** | Derived "subtle" and "wash" colors use `color-mix(in oklch, <color> <pct>%, transparent)` — alpha transparency — rather than mixing with a background color. This works correctly over any background without needing to know the surface color.                                                     |
| **Themes can override primitives**      | `DesignThemeConfig` accepts an optional `primitives` override for any primitive namespace (space, radius, font, shadow, etc.). This lets a theme define its own border radii or type scale without forking the whole token stack.                                                                    |
| **Fully typed**                         | All token value objects use `as const` and explicit types. `DesignThemeConfig` enforces the required shape.                                                                                                                                                                                          |
| **TypeStyles-native**                   | `tokens.create()` for all layers, `tokens.createTheme()` for the light class, `insertRule()` for dark-mode `@media` overrides.                                                                                                                                                                       |
| **No doc layer in the design system**   | Doc/prose semantic tokens belong in the docs app, not this package.                                                                                                                                                                                                                                  |

---

## Target File Structure

```
examples/design-system/src/
├── index.ts                        ← updated public barrel
├── theme/
│   ├── index.ts                    ← barrel: createDesignTheme + all built-in themes + token refs
│   ├── types.ts                    ← DesignTheme, DesignThemeConfig, value shape types
│   ├── tokens/
│   │   ├── index.ts                ← calls tokens.create() for all 3 layers; exports nested token refs
│   │   ├── primitive.ts            ← raw scale values (space, radius, font, shadow, motion)
│   │   ├── palette.ts              ← OKLCH ramp generator (moved from base-palette-values.ts)
│   │   ├── semantic.ts             ← nested semantic color + syntax light/dark default values
│   │   └── component.ts            ← codeBlock component token default values
│   ├── themes/
│   │   ├── index.ts                ← barrel: all 4 built-in DesignTheme objects + palette list
│   │   ├── default.ts              ← defaultTheme (slate neutrals, blue accent)
│   │   ├── forest.ts               ← forestTheme
│   │   ├── rose.ts                 ← roseTheme
│   │   └── amber.ts                ← amberTheme
│   └── create-theme.ts             ← createDesignTheme() function + flattenColorValues() helper
└── components/
    └── *.ts                        ← recipes updated to new nested token refs
```

### Files to delete

```
src/tokens/                 ← entire directory (8 files)
src/components/theming.ts   ← merged into theme/create-theme.ts
```

---

## The Nesting Strategy

TypeStyles' `tokens.create(namespace, values)` takes a **flat** `Record<string, string>`.
The nesting lives entirely in the design system's own layer.

### How it works

```ts
// 1. Define nested value objects (what theme authors write):
const lightColorValues = {
  background: {
    app: '#ffffff',
    surface: '#ffffff',
    subtle: '#f8fafc',
    elevated: '#ffffff',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    // ...
  },
  // ...
} satisfies DesignColorValues;

// 2. Flatten to pass to tokens.create():
// flattenColorValues(lightColorValues)
// → { 'background-app': '#ffffff', 'background-surface': '#ffffff', 'text-primary': '#0f172a', ... }
// CSS: :root { --color-background-app: #ffffff; --color-text-primary: #0f172a; ... }

// 3. Build a nested token ref object alongside the flat create() call:
// colorTokens.background.app === 'var(--color-background-app)'
// colorTokens.text.primary   === 'var(--color-text-primary)'
```

### `flattenColorValues(obj)` helper

A small utility that joins nested keys with `-`:

```ts
function flattenColorValues(obj: DesignColorValues): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [group, tokens] of Object.entries(obj)) {
    for (const [key, value] of Object.entries(tokens)) {
      out[`${group}-${key}`] = value;
    }
  }
  return out;
}
```

### `buildColorRefs(namespace)` helper

Builds the nested proxy/object that returns `var(--{namespace}-{group}-{key})`:

```ts
function buildColorRefs<T extends DesignColorValues>(
  namespace: string,
  shape: T,
): { [G in keyof T]: { [K in keyof T[G]]: string } } {
  const out = {} as { [G in keyof T]: { [K in keyof T[G]]: string } };
  for (const group of Object.keys(shape) as (keyof T)[]) {
    out[group] = {} as { [K in keyof T[typeof group]]: string };
    for (const key of Object.keys(shape[group] as object)) {
      (out[group] as Record<string, string>)[key] = `var(--${namespace}-${String(group)}-${key})`;
    }
  }
  return out;
}
```

This is called once after `tokens.create('color', flattenedValues)` and the result is what recipes import as `t.color`.

The same pattern applies to `syntax` tokens (though that is a single-level nesting, so it stays flat — `t.syntax.keyword`, `t.syntax.base` etc., no change needed).

---

## Layer 1 — Primitive Tokens

**Purpose:** Raw scales with no semantic meaning. Applied via `:root`. Themes do not override these. Recipes access them directly.

Primitives remain **flat** (no nesting) — their keys are already unambiguous (`sm`, `md`, `bold`, etc.).

### `space` namespace — numeric keys

Token access: `t.space[4]` → `var(--space-4)`

| Key  | Value  | Old key |
| ---- | ------ | ------- |
| `1`  | `4px`  | `xs`    |
| `2`  | `8px`  | `sm`    |
| `3`  | `12px` | `md`    |
| `4`  | `16px` | `lg`    |
| `5`  | `24px` | `xl`    |
| `6`  | `32px` | `xxl`   |
| `8`  | `48px` | _(new)_ |
| `12` | `64px` | _(new)_ |

Note: TypeScript allows numeric keys in `Record<string, string>` objects. `tokens.create('space', { 1: '4px', ... })` produces `--space-1`. Access as `t.space[1]` (no quotes needed for numeric literals when keys are numbers).

### `radius` namespace

Token access: `t.radius.md` → `var(--radius-md)`

| Key    | Value    | Note       |
| ------ | -------- | ---------- |
| `none` | `0`      | _(new)_    |
| `sm`   | `4px`    | was `6px`  |
| `md`   | `8px`    | was `10px` |
| `lg`   | `12px`   | was `14px` |
| `xl`   | `16px`   | _(new)_    |
| `full` | `9999px` | unchanged  |

### `fontFamily` namespace

Token access: `t.fontFamily.sans` → `var(--fontFamily-sans)`

| Key    | Value                                                           |
| ------ | --------------------------------------------------------------- |
| `sans` | `Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif` |
| `mono` | `ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, monospace`  |

### `fontSize` namespace

Token access: `t.fontSize.md` → `var(--fontSize-md)`

| Key   | Value  | Old key  |
| ----- | ------ | -------- |
| `xs`  | `11px` | _(new)_  |
| `sm`  | `13px` | `sizeSm` |
| `md`  | `14px` | `sizeMd` |
| `lg`  | `16px` | `sizeLg` |
| `xl`  | `20px` | _(new)_  |
| `2xl` | `24px` | _(new)_  |
| `3xl` | `30px` | _(new)_  |

### `fontWeight` namespace

Token access: `t.fontWeight.semibold` → `var(--fontWeight-semibold)`

| Key        | Value | Old key          |
| ---------- | ----- | ---------------- |
| `normal`   | `400` | `weightRegular`  |
| `medium`   | `500` | `weightMedium`   |
| `semibold` | `600` | `weightSemibold` |
| `bold`     | `700` | _(new)_          |

### `lineHeight` namespace

Token access: `t.lineHeight.normal` → `var(--lineHeight-normal)`

| Key       | Value   |
| --------- | ------- |
| `tight`   | `1.25`  |
| `normal`  | `1.5`   |
| `relaxed` | `1.625` |

### `shadow` namespace

Token access: `t.shadow.md` → `var(--shadow-md)`

| Key  | Value                                                                 | Note           |
| ---- | --------------------------------------------------------------------- | -------------- |
| `xs` | `0 1px 2px rgb(0 0 0 / 0.06)`                                         | was `sm`       |
| `sm` | `0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`         | _(new)_        |
| `md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`    | was `md`       |
| `lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`  | _(new)_        |
| `xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | was `elevated` |

### `duration` namespace — unchanged

`fast(80ms)`, `medium(140ms)`, `slow(220ms)`

### `easing` namespace — unchanged

`standard(ease)`, `emphasized(cubic-bezier(0.16, 1, 0.3, 1))`

### `transition` namespace — keys renamed to camelCase

Token access: `t.transition.overlayFade` → `var(--transition-overlayFade)`

| Key              | Old key                        |
| ---------------- | ------------------------------ |
| `overlayFade`    | `overlayFade` _(unchanged)_    |
| `panelEnter`     | `panelEnter` _(unchanged)_     |
| `backdrop`       | `backdrop` _(unchanged)_       |
| `surfaceFast`    | `surfaceFast` _(unchanged)_    |
| `colorShift`     | `colorShift` _(unchanged)_     |
| `controlSurface` | `controlSurface` _(unchanged)_ |

(No change here — they were already camelCase.)

---

## Layer 2 — Semantic Tokens

**Purpose:** Assign UI meaning to colors. These change per-theme and per-mode. Token value objects are nested by category. The CSS vars are flat with `-` joining group + key.

### `color` namespace — nested value object

Token access: `t.color.background.app` → `var(--color-background-app)`

```ts
// DesignColorValues — the shape a theme author must provide.
// Derived tokens (subtle, border washes, placeholder, disabled, backdrop)
// are NOT in this type — they are static constants registered globally.
type DesignColorValues = {
  background: {
    app: string; // --color-background-app
    surface: string; // --color-background-surface
    subtle: string; // --color-background-subtle
    elevated: string; // --color-background-elevated
  };
  text: {
    primary: string; // --color-text-primary
    secondary: string; // --color-text-secondary
    onAccent: string; // --color-text-onAccent
    onDanger: string; // --color-text-onDanger
  };
  accent: {
    default: string; // --color-accent-default
    hover: string; // --color-accent-hover
  };
  border: {
    default: string; // --color-border-default
    strong: string; // --color-border-strong
    focus: string; // --color-border-focus
  };
  danger: {
    default: string; // --color-danger-default
    solid: string; // --color-danger-solid
  };
  success: {
    default: string; // --color-success-default
    solid: string; // --color-success-solid
  };
  warning: {
    default: string; // --color-warning-default
    onSolid: string; // --color-warning-onSolid
  };
  info: {
    default: string; // --color-info-default
    onSolid: string; // --color-info-onSolid
  };
  overlay: {
    default: string; // --color-overlay-default
  };
};
```

**All CSS vars registered in `:root`** — theme-settable vars from `DesignColorValues` (20), plus static derived vars from `DERIVED_COLOR_TOKENS` (11):

Theme-settable (defined per theme in `light`/`dark`):

- `--color-background-app`, `--color-background-surface`, `--color-background-subtle`, `--color-background-elevated`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-onAccent`, `--color-text-onDanger`
- `--color-accent-default`, `--color-accent-hover`
- `--color-border-default`, `--color-border-strong`, `--color-border-focus`
- `--color-danger-default`, `--color-danger-solid`
- `--color-success-default`, `--color-success-solid`
- `--color-warning-default`, `--color-warning-onSolid`
- `--color-info-default`, `--color-info-onSolid`
- `--color-overlay-default`

Static derived (registered once globally, never in a theme):

- `--color-text-disabled`, `--color-text-placeholder`
- `--color-accent-subtle`
- `--color-danger-subtle`, `--color-danger-border`
- `--color-success-subtle`, `--color-success-border`
- `--color-warning-subtle`, `--color-warning-border`
- `--color-info-subtle`, `--color-info-border`
- `--color-overlay-backdrop`

**Total: 33 color vars** (21 theme-settable + 12 derived)

#### Derived tokens

Derived tokens use `color-mix(in oklch, <color> <pct>%, transparent)` — pure alpha transparency. This works correctly over **any** background without needing to know the surface color. They are static CSS expressions shared by all themes and modes; only the referenced `--color-*` vars change per theme.

```ts
// These strings are shared constants, not per-theme values.
// They live in semantic.ts alongside the DesignColorValues type.

export const DERIVED_COLOR_TOKENS = {
  // text
  textDisabled: 'color-mix(in oklch, var(--color-text-secondary) 45%, transparent)',
  textPlaceholder: 'color-mix(in oklch, var(--color-text-secondary) 55%, transparent)',
  // accent
  accentSubtle: 'color-mix(in oklch, var(--color-accent-default) 15%, transparent)',
  // status — subtle washes (translucent over any surface)
  dangerSubtle: 'color-mix(in oklch, var(--color-danger-default) 12%, transparent)',
  dangerBorder: 'color-mix(in oklch, var(--color-danger-default) 40%, transparent)',
  successSubtle: 'color-mix(in oklch, var(--color-success-default) 12%, transparent)',
  successBorder: 'color-mix(in oklch, var(--color-success-default) 40%, transparent)',
  warningSubtle: 'color-mix(in oklch, var(--color-warning-default) 12%, transparent)',
  warningBorder: 'color-mix(in oklch, var(--color-warning-default) 40%, transparent)',
  infoSubtle: 'color-mix(in oklch, var(--color-info-default) 12%, transparent)',
  infoBorder: 'color-mix(in oklch, var(--color-info-default) 40%, transparent)',
  // overlay
  overlayBackdrop: 'color-mix(in oklch, var(--color-overlay-default) 60%, transparent)',
} as const;
```

These are injected as part of the base `:root` token registration in `theme/tokens/index.ts` — they never need to appear in any theme's `light` or `dark` values, because they derive from the tokens that do change.

#### Light defaults (default theme)

All values reference palette token vars (`var(--palette-*)`) — no hardcoded colors. The `p` variable below represents the `designPrimitiveTokens.palette` proxy (e.g. `p['slate-1']` → `'var(--palette-slate-1)'`). Derived tokens (marked with ★) are registered as global constants — they never appear in a theme's `light`/`dark` values.

| Token                 | CSS var                       | Light value (palette ref)                   | Palette step rationale   |
| --------------------- | ----------------------------- | ------------------------------------------- | ------------------------ |
| `background.app`      | `--color-background-app`      | `p['neutral-1']`                            | Near-white page bg       |
| `background.surface`  | `--color-background-surface`  | `p['neutral-1']`                            | White card/panel         |
| `background.subtle`   | `--color-background-subtle`   | `p['slate-2']`                              | Off-white inset area     |
| `background.elevated` | `--color-background-elevated` | `p['neutral-1']`                            | Floating overlay bg      |
| `text.primary`        | `--color-text-primary`        | `p['slate-10']`                             | Near-black body text     |
| `text.secondary`      | `--color-text-secondary`      | `p['slate-6']`                              | Muted secondary text     |
| `text.disabled`       | `--color-text-disabled`       | ★ derived                                   | 45% of text-secondary    |
| `text.placeholder`    | `--color-text-placeholder`    | ★ derived                                   | 55% of text-secondary    |
| `text.onAccent`       | `--color-text-onAccent`       | `p['neutral-1']`                            | White on filled accent   |
| `text.onDanger`       | `--color-text-onDanger`       | `p['neutral-1']`                            | White on filled danger   |
| `accent.default`      | `--color-accent-default`      | `p['blue-7']`                               | Main action blue         |
| `accent.hover`        | `--color-accent-hover`        | `p['blue-8']`                               | Darker blue on hover     |
| `accent.subtle`       | `--color-accent-subtle`       | ★ derived                                   | 15% accent alpha wash    |
| `border.default`      | `--color-border-default`      | `p['slate-4']`                              | Subtle divider           |
| `border.strong`       | `--color-border-strong`       | `p['slate-6']`                              | Form field / card border |
| `border.focus`        | `--color-border-focus`        | `p['blue-5']`                               | Keyboard focus ring      |
| `danger.default`      | `--color-danger-default`      | `p['red-7']`                                | Error icon/text          |
| `danger.subtle`       | `--color-danger-subtle`       | ★ derived                                   | 12% danger alpha wash    |
| `danger.border`       | `--color-danger-border`       | ★ derived                                   | 40% danger alpha border  |
| `danger.solid`        | `--color-danger-solid`        | `p['red-8']`                                | Filled alert/badge bg    |
| `success.default`     | `--color-success-default`     | `p['green-7']`                              | Success icon/text        |
| `success.subtle`      | `--color-success-subtle`      | ★ derived                                   | 12% success alpha wash   |
| `success.border`      | `--color-success-border`      | ★ derived                                   | 40% success alpha border |
| `success.solid`       | `--color-success-solid`       | `p['green-8']`                              | Filled success bg        |
| `warning.default`     | `--color-warning-default`     | `p['amber-7']`                              | Warning icon/text        |
| `warning.subtle`      | `--color-warning-subtle`      | ★ derived                                   | 12% warning alpha wash   |
| `warning.border`      | `--color-warning-border`      | ★ derived                                   | 40% warning alpha border |
| `warning.onSolid`     | `--color-warning-onSolid`     | `p['stone-10']`                             | Dark text on amber fill  |
| `info.default`        | `--color-info-default`        | `p['violet-7']`                             | Info icon/text           |
| `info.subtle`         | `--color-info-subtle`         | ★ derived                                   | 12% info alpha wash      |
| `info.border`         | `--color-info-border`         | ★ derived                                   | 40% info alpha border    |
| `info.onSolid`        | `--color-info-onSolid`        | `p['neutral-1']`                            | White on violet fill     |
| `overlay.default`     | `--color-overlay-default`     | `color.alpha(p['slate-10'], 0.55, 'oklch')` | Semi-transparent scrim   |
| `overlay.backdrop`    | `--color-overlay-backdrop`    | ★ derived                                   | 60% of overlay-default   |

**Dark defaults** follow the same principle — all values are palette refs, just from the dark end of each scale:

| Token                 | Dark value (palette ref)                                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `background.app`      | `p['slate-10']` stepped down (use `color.oklch` of step 10 with lower L) — or use `p['slate-10']` directly if the palette generator dark end is dark enough |
| `background.surface`  | `p['slate-9']`                                                                                                                                              |
| `background.subtle`   | `p['slate-8']`                                                                                                                                              |
| `background.elevated` | `p['slate-9']`                                                                                                                                              |
| `text.primary`        | `p['slate-1']`                                                                                                                                              |
| `text.secondary`      | `p['slate-3']`                                                                                                                                              |
| `text.onAccent`       | `p['neutral-1']`                                                                                                                                            |
| `text.onDanger`       | `p['neutral-1']`                                                                                                                                            |
| `accent.default`      | `p['blue-5']`                                                                                                                                               |
| `accent.hover`        | `p['blue-4']`                                                                                                                                               |
| `border.default`      | `p['slate-7']`                                                                                                                                              |
| `border.strong`       | `p['slate-6']`                                                                                                                                              |
| `border.focus`        | `p['blue-4']`                                                                                                                                               |
| `danger.default`      | `p['red-4']`                                                                                                                                                |
| `danger.solid`        | `p['red-7']`                                                                                                                                                |
| `success.default`     | `p['green-4']`                                                                                                                                              |
| `success.solid`       | `p['green-7']`                                                                                                                                              |
| `warning.default`     | `p['amber-4']`                                                                                                                                              |
| `warning.onSolid`     | `p['stone-10']`                                                                                                                                             |
| `info.default`        | `p['violet-4']`                                                                                                                                             |
| `info.onSolid`        | `p['neutral-1']`                                                                                                                                            |
| `overlay.default`     | `color.alpha(p['slate-10'], 0.7, 'oklch')`                                                                                                                  |

> **Note on palette step depth:** The generator produces steps 1–10 where 1 = lightest (~97% L) and 10 = darkest (~22% L). For dark mode we need very dark backgrounds — darker than step 10. Theme files should use `color.oklch(...)` directly for values below step 10 lightness, e.g. `color.oklch('12%', 0.028, 260)` for near-black slate. This is the only place raw OKLCH is acceptable — dark-mode base backgrounds that fall outside the 1–10 range.

---

### `syntax` namespace — flat (unchanged structure)

Token access: `t.syntax.keyword` → `var(--syntax-keyword)`

Renamed from `codeSyntax`. 14 keys — same as before except:

- `additionBg` → `additionBackground`
- `deletionBg` → `deletionBackground`

| Key                  | Light default            | Dark default             |
| -------------------- | ------------------------ | ------------------------ |
| `base`               | `oklch(24.8% 0.008 264)` | `oklch(90% 0.002 264)`   |
| `keyword`            | `oklch(54.5% 0.24 301)`  | `oklch(79.5% 0.17 295)`  |
| `title`              | `oklch(58.5% 0.22 248)`  | `oklch(82.5% 0.16 245)`  |
| `attr`               | `oklch(50% 0.18 68)`     | `oklch(77.2% 0.24 60)`   |
| `string`             | `oklch(53.2% 0.18 178)`  | `oklch(81.5% 0.2 170)`   |
| `builtIn`            | `oklch(56.5% 0.22 48)`   | `oklch(79.5% 0.22 45)`   |
| `comment`            | `oklch(66.4% 0.014 264)` | `oklch(77.5% 0.012 264)` |
| `name`               | `oklch(57.5% 0.18 29)`   | `oklch(80.3% 0.22 27.5)` |
| `section`            | `oklch(55.2% 0.24 271)`  | `oklch(79% 0.17 265)`    |
| `bullet`             | `oklch(55.5% 0.22 66)`   | `oklch(67.5% 0.28 62)`   |
| `addition`           | `oklch(58.8% 0.22 176)`  | `oklch(81.5% 0.2 170)`   |
| `additionBackground` | `oklch(99.3% 0.01 160)`  | `oklch(18% 0.04 170)`    |
| `deletion`           | `oklch(57.5% 0.18 29)`   | `oklch(80.3% 0.22 27.5)` |
| `deletionBackground` | `oklch(99.7% 0.008 25)`  | `oklch(18% 0.04 30)`     |

---

## Layer 3 — Component Tokens

**Purpose:** Per-component color overrides. Default through semantic tokens. `codeBlock` only (scope decision).

### `codeBlock` namespace — flat

Token access: `t.codeBlock.background` → `var(--codeBlock-background)`

Namespace stays `codeBlock` (camelCase, matches TypeStyles' CSS var output `--codeBlock-*`).

| Key                       | Default value                     | Old key                                |
| ------------------------- | --------------------------------- | -------------------------------------- |
| `background`              | `var(--color-background-surface)` | `rootBg` / `bodyBg` (merged)           |
| `backgroundHeader`        | `var(--color-background-subtle)`  | `headerBg`                             |
| `backgroundInline`        | `var(--color-background-subtle)`  | `inlineBg`                             |
| `backgroundLineHighlight` | `var(--color-background-subtle)`  | `lineHighlightBg`                      |
| `border`                  | `var(--color-border-default)`     | `rootBorder` / `headerBorder` (merged) |

No `--doc-*` intermediary. References `--color-*` directly.

---

## `createDesignTheme()` API

### Type signatures

```ts
type DesignSemanticValues = {
  color: DesignColorValues; // nested object — theme-settable only (no derived tokens)
  syntax: DesignSyntaxValues; // flat 14-key object
};

// Primitive overrides — any namespace a theme may want to adjust.
// All fields optional; only supply what differs from the global defaults.
type DesignPrimitiveOverrides = {
  space?: Partial<DesignSpaceValues>;
  radius?: Partial<DesignRadiusValues>;
  fontFamily?: Partial<DesignFontFamilyValues>;
  fontSize?: Partial<DesignFontSizeValues>;
  fontWeight?: Partial<DesignFontWeightValues>;
  lineHeight?: Partial<DesignLineHeightValues>;
  shadow?: Partial<DesignShadowValues>;
  duration?: Partial<DesignDurationValues>;
  easing?: Partial<DesignEasingValues>;
  transition?: Partial<DesignTransitionValues>;
};

type DesignThemeConfig = {
  name: string;
  /** Full light mode semantic values — this is the theme's identity. */
  light: DesignSemanticValues;
  /** Dark mode semantic overrides — partial; only keys that differ from light. */
  dark: DeepPartial<DesignSemanticValues>;
  /**
   * Optional primitive overrides — applied globally (not per-mode) when the theme
   * class is on the root element. Use for themes with a distinct type scale, radii,
   * or shadow style. These override the `:root` primitive defaults for all children
   * of the theme element.
   */
  primitives?: DesignPrimitiveOverrides;
  /** Optional component token overrides (applied in both modes). */
  components?: Partial<DesignComponentValues>;
};

type DesignTheme = {
  className: string; // "theme-default"
  name: string;
  lightValues: DesignSemanticValues; // exposed for extension
  darkValues: DeepPartial<DesignSemanticValues>; // exposed for extension
  primitiveOverrides?: DesignPrimitiveOverrides; // exposed for extension
};
```

### CSS emitted (up to 5 blocks)

```ts
// Inside createDesignTheme({ name: 'default', light, dark, primitives, components }):

// 1. Light class — color + syntax + optional component overrides + optional primitive overrides.
//    tokens.createTheme() produces: .theme-default { --color-background-app: var(--palette-neutral-1); ... }
tokens.createTheme(name, {
  color: flattenColorValues(light.color),
  syntax: light.syntax,
  ...(components?.codeBlock ? { codeBlock: components.codeBlock } : {}),
  // Primitive overrides are also scoped to the theme class:
  ...(primitives ? flattenPrimitiveOverrides(primitives) : {}),
});

// 2. Auto dark via @media — raw insertRule() since CSSProperties doesn't accept --* keys
insertRule(
  `theme:${name}:dark-media`,
  `@media (prefers-color-scheme: dark) { .theme-${name} { ${buildVarDecls(dark)} } }`,
);

// 3. Explicit [data-mode="dark"]
insertRule(
  `theme:${name}:dark-attr`,
  `.theme-${name}[data-mode="dark"] { ${buildVarDecls(dark)} }`,
);

// 4. Explicit [data-mode="light"] — force light in dark system
insertRule(
  `theme:${name}:light-attr`,
  `@media (prefers-color-scheme: dark) { .theme-${name}[data-mode="light"] { ${buildVarDecls(light)} } }`,
);

// 5. Primitive overrides scoped to dark mode (if the theme has both dark values AND primitive overrides)
//    Only emitted if primitives is defined — primitive overrides apply regardless of mode (same values).
//    If a theme needed mode-specific primitive overrides, that would be a separate concern.
```

`buildVarDecls(semanticValues)` is a helper that flattens `{ color: nested, syntax: flat }` into CSS var declaration strings like `--color-background-app: var(--palette-neutral-1); --syntax-base: oklch(...);`.

Primitive overrides in `tokens.createTheme()` override vars like `--radius-md`, `--shadow-sm` etc. scoped to `.theme-{name}` — children of the theme root inherit the overridden primitives automatically.

### Usage

```html
<!-- System preference controls light/dark automatically: -->
<html class="theme-default">
  <!-- Force dark regardless of system preference: -->
  <html class="theme-default" data-mode="dark">
    <!-- Force light even on a dark-mode system: -->
    <html class="theme-default" data-mode="light"></html>
  </html>
</html>
```

### Extending themes

```ts
import {
  createDesignTheme,
  defaultTheme,
  designPrimitiveTokens as p,
} from '@examples/design-system';

export const acmeTheme = createDesignTheme({
  name: 'acme',
  light: {
    color: {
      ...defaultTheme.lightValues.color,
      // Only override the accent group — everything else from default light
      accent: {
        default: p.palette['violet-7'],
        hover: p.palette['violet-8'],
      },
    },
    syntax: defaultTheme.lightValues.syntax,
  },
  dark: {
    color: {
      accent: {
        default: p.palette['violet-4'],
        hover: p.palette['violet-3'],
      },
    },
  },
  // Optional: give this theme rounder corners and softer shadows
  primitives: {
    radius: { sm: '6px', md: '10px', lg: '16px', xl: '22px' },
    shadow: { xs: '0 1px 3px rgb(0 0 0 / 0.04)', md: '0 4px 12px rgb(0 0 0 / 0.08)' },
  },
});
```

---

## Built-in Themes

| Export         | `className`     | Character                           |
| -------------- | --------------- | ----------------------------------- |
| `defaultTheme` | `theme-default` | Slate neutrals, blue accent         |
| `forestTheme`  | `theme-forest`  | Green-tinted neutrals, green accent |
| `roseTheme`    | `theme-rose`    | Warm-pink neutrals, rose accent     |
| `amberTheme`   | `theme-amber`   | Warm amber neutrals, amber accent   |

Each defined in its own file as a `createDesignTheme()` call. Light and dark values inlined directly — no shared `color-palettes.ts` aggregator.

---

## Component Recipe Token Migration

All `src/components/*.ts` import `{ designTokens as t }` and use token refs.

### `color` key mapping

| Old (`t.color.X`)           | New (`t.color.Y.Z`)                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `t.color.bg`                | `t.color.background.app`                                                                                                     |
| `t.color.surface`           | `t.color.background.surface`                                                                                                 |
| `t.color.surfaceMuted`      | `t.color.background.subtle`                                                                                                  |
| `t.color.text`              | `t.color.text.primary`                                                                                                       |
| `t.color.textMuted`         | `t.color.text.secondary`                                                                                                     |
| `t.color.textPlaceholder`   | `t.color.text.placeholder`                                                                                                   |
| `t.color.accentForeground`  | `t.color.text.onAccent`                                                                                                      |
| `t.color.border`            | `t.color.border.default`                                                                                                     |
| `t.color.borderStrong`      | `t.color.border.strong`                                                                                                      |
| `t.color.focusRing`         | `t.color.border.focus`                                                                                                       |
| `t.color.accent`            | `t.color.accent.default`                                                                                                     |
| `t.color.accentHover`       | `t.color.accent.hover`                                                                                                       |
| `t.color.accentWash`        | `t.color.accent.subtle`                                                                                                      |
| `t.color.danger`            | `t.color.danger.default`                                                                                                     |
| `t.color.alertDangerFill`   | `t.color.danger.solid`                                                                                                       |
| `t.color.success`           | `t.color.success.default`                                                                                                    |
| `t.color.alertSuccessFill`  | `t.color.success.solid`                                                                                                      |
| `t.color.warning`           | `t.color.warning.default`                                                                                                    |
| `t.color.warningForeground` | `t.color.warning.onSolid`                                                                                                    |
| `t.color.tip`               | `t.color.info.default`                                                                                                       |
| `t.color.tipForeground`     | `t.color.info.onSolid`                                                                                                       |
| `t.color.overlay`           | `t.color.overlay.default`                                                                                                    |
| `t.color.backdropTint`      | `t.color.overlay.backdrop` _(now a derived var — accessible as `'var(--color-overlay-backdrop)'` string constant if needed)_ |

### Namespace / primitive key mapping

| Old                                    | New                                             |
| -------------------------------------- | ----------------------------------------------- |
| `t.codeSyntax.X`                       | `t.syntax.X`                                    |
| `t.codeSyntax.additionBg`              | `t.syntax.additionBackground`                   |
| `t.codeSyntax.deletionBg`              | `t.syntax.deletionBackground`                   |
| `t.space.xs/sm/md/lg/xl/xxl`           | `t.space[1/2/3/4/5/6]`                          |
| `t.font.family`                        | `t.fontFamily.sans`                             |
| `t.font.sizeSm/sizeMd/sizeLg`          | `t.fontSize.sm/md/lg`                           |
| `t.font.weightRegular/Medium/Semibold` | `t.fontWeight.normal/medium/semibold`           |
| `t.shadow.sm`                          | `t.shadow.xs`                                   |
| `t.shadow.elevated`                    | `t.shadow.xl`                                   |
| `t.codeBlock.*`                        | `t.codeBlock.*` _(key renames, same namespace)_ |
| `t.doc.*`                              | removed — direct `t.color.*` refs instead       |

---

## Updated Public API

```ts
// Primary theme API
export { createDesignTheme } from './theme/create-theme';
export type { DesignTheme, DesignThemeConfig, DesignSemanticValues, DesignColorValues } from './theme/types';

// Built-in themes
export { defaultTheme, forestTheme, roseTheme, amberTheme, designPaletteList } from './theme/themes';
export type { DesignPaletteId } from './theme/themes';

// Token references (nested typed objects for use in custom recipes)
export { designTokens, designPrimitiveTokens, designSemanticTokens, designComponentTokens } from './theme/tokens';

// Palette utilities (for building custom themes)
export { basePaletteTokenValues, PALETTE_FAMILIES } from './theme/tokens/palette';

// Light/dark values exposed for extension
export { defaultLightValues, defaultDarkValues } from './theme/themes/default';

// Components (all exports unchanged)
export { button, linkButton, alert, badge, card, checkbox, radio, ... } from './components';
```

---

## `react-design-system` Changes

`examples/react-design-system/src/tokens.ts` re-exports from design-system. Changes needed:

- Replace `lightThemeClass`/`darkThemeClass` → `defaultTheme` (the `DesignTheme` object)
- Remove `highContrastLightThemeClass`, `highContrastDarkThemeClass` (no longer exist)
- Remove `mergeDesignThemeOverrides`, `createBrandAccentOverrides` → superseded by `createDesignTheme()` spread pattern
- Remove `DesignDocSemanticValues` (doc layer removed)
- Update `DesignCodeBlockComponentValues` type name if it changes

`examples/react-design-system/src/theme.tsx` — `DesignSystemProvider`:

- Currently applies `darkThemeClass` on a wrapper div to toggle dark mode
- Under new system: apply `defaultTheme.className` always, and toggle `data-mode="dark"` / `data-mode="light"` attribute on the wrapper div

---

## Docs App Changes

### `docs/src/tokens.ts`

Currently creates 7 `tokens.createTheme()` calls. Under the new system:

- Remove all 7 `tokens.createTheme()` calls
- Import `defaultTheme`, `forestTheme`, `roseTheme`, `amberTheme` and `designPaletteList`
- `getDocsAppearanceClass(palette, mode)` → returns `{ className: string; dataMode: 'light' | 'dark' | undefined }`
  - For default theme: `{ className: defaultTheme.className, dataMode: mode === 'dark' ? 'dark' : 'light' }`
  - For other themes: `{ className: forestTheme.className, dataMode: ... }` etc.
- `docsAppearanceClassesToClear` → list of the 4 `theme.className` values

### `docs/src/styles.ts`

Replace all `c.X` references per the migration table above. Key changes:

- `c.bg` → `c.background.app`
- `c.surface` → `c.background.surface`
- `c.surfaceMuted` → `c.background.subtle`
- `c.text` → `c.text.primary`
- `c.textMuted` → `c.text.secondary`
- `c.accent` → `c.accent.default`
- `c.accentHover` → `c.accent.hover`
- `c.accentForeground` → `c.text.onAccent`
- `c.overlay` → `c.overlay.default`
- `c.border` → `c.border.default`

Also update `accentSurfaceMuted` and `textQuiet` derived locals — they reference `c.accent.default`, `c.background.surface` etc.

### `docs/src/lib/docsAppearanceRuntime.ts`

`syncDocumentClass(config, palette, mode)`:

- Strip old theme class from `<html>`
- Add new `theme.className` (same class for light + dark of same theme)
- Set/remove `data-mode` attribute: `document.documentElement.setAttribute('data-mode', mode)` or `removeAttribute('data-mode')` for system preference

### `docs/src/components/docs/DocsHead.astro`

Inline bootstrap script — update to set `data-mode` attribute alongside theme class (no longer needs to swap between `theme-docs-dark` and `theme-docs-palette-X-dark`).

---

## Implementation Tasks

Work through these in order. Each is a discrete, independently committable unit.

---

### Task 1 — Move palette file

Move `src/tokens/base-palette-values.ts` → `src/theme/tokens/palette.ts`.
No logic changes. Update all imports within the `examples/design-system` package.

**Done when:** File at new path, all existing `basePaletteTokenValues` imports resolve.

---

### Task 2 — Create `theme/tokens/primitive.ts`

New file with all primitive value objects per spec:

- `spaceValues` (numeric keys `1`–`12`)
- `radiusValues`, `fontFamilyValues`, `fontSizeValues`, `fontWeightValues`, `lineHeightValues`
- `shadowValues`, `durationValues`, `easingValues`, `transitionValues`

Export each values object and a `DesignPrimitiveValues` aggregate type.

**Done when:** File compiles, all key names and values match spec.

---

### Task 3 — Create `theme/tokens/semantic.ts`

New file containing:

- `DesignColorValues` type (nested structure — theme-settable tokens only, no derived tokens)
- `DesignSyntaxValues` type (flat 14-key object)
- `DERIVED_COLOR_TOKENS` — constant object of 12 static `color-mix(..., transparent)` expressions
- `flattenColorValues(obj: DesignColorValues): Record<string, string>` — joins nested keys with `-`
- `buildColorRefs<T extends DesignColorValues>(namespace, shape)` — builds nested `var()` ref object

**No** `defaultLightColorValues` or `defaultDarkColorValues` here — those live in `theme/themes/default.ts` because they reference `designPrimitiveTokens.palette` which would create a circular import with `theme/tokens/index.ts`.

**Done when:** File compiles. `DesignColorValues` has 21 theme-settable tokens (no derived). `DERIVED_COLOR_TOKENS` has 12 entries all using `color-mix(..., transparent)`. `flattenColorValues` produces correct flat keys.

---

### Task 4 — Create `theme/tokens/component.ts`

New file with:

- `DesignComponentValues` type
- `codeBlockValues` — 5 keys per spec, referencing `var(--color-*)` directly

**Done when:** File compiles, no references to `--doc-*`.

---

### Task 5 — Create `theme/tokens/index.ts`

New file that:

1. Imports all primitive values from `primitive.ts` and calls `tokens.create()` for each namespace → exports each ref as e.g. `spaceTokens`, `radiusTokens`, etc.
2. Imports palette values from `palette.ts` and calls `tokens.create('palette', basePaletteTokenValues)` → exports `paletteTokens`
3. Imports `DesignColorValues`, `DERIVED_COLOR_TOKENS`, `flattenColorValues`, `buildColorRefs` from `semantic.ts`
4. Registers a **placeholder** `:root { --color-background-app: ; ... }` via `tokens.create('color', emptyColorValues)` — produces the `colorTokens` flat proxy; actual values are set by the first `createDesignTheme()` call's `tokens.createTheme()`
5. Registers `DERIVED_COLOR_TOKENS` as additional `:root` vars using a direct `insertRule()` call (they are `--color-*` but not part of the normal flat token object)
6. Calls `buildColorRefs('color', colorShape)` → exports `colorRefs` as the nested dot-notation ref object
7. Calls `tokens.create('syntax', emptySyntaxValues)` → exports `syntaxTokens`
8. Imports component values from `component.ts` and calls `tokens.create('codeBlock', codeBlockValues)`
9. Exports `designTokens` = `{ ...primitiveTokenRefs, color: colorRefs, syntax: syntaxTokens, codeBlock: codeBlockTokens }`
10. Exports `designPrimitiveTokens`, `designSemanticTokens`, `designComponentTokens`

This file replaces `src/tokens/register.ts`. It is a side-effect module — importing it registers all CSS var names.

**Done when:** `designTokens.color.background.app === 'var(--color-background-app)'`. `designTokens.palette['slate-1'] === 'var(--palette-slate-1)'`. `DERIVED_COLOR_TOKENS` vars appear in `getRegisteredCss()` output.

---

### Task 6 — Create `theme/types.ts`

New file with:

- `DeepPartial<T>` utility type
- `DesignSemanticValues` — `{ color: DesignColorValues; syntax: DesignSyntaxValues }`
- `DesignPrimitiveOverrides` — all 10 primitive namespaces as optional partials
- `DesignThemeConfig` — `{ name; light; dark; primitives?; components? }` per spec
- `DesignTheme` — `{ className; name; lightValues; darkValues; primitiveOverrides? }`

**Done when:** All types export with no circular imports. `DesignThemeConfig` accepts a `primitives.radius` override.

---

### Task 7 — Create `theme/create-theme.ts`

New file implementing `createDesignTheme(config: DesignThemeConfig): DesignTheme`:

Helpers needed (all internal to this file):

- `flattenSemanticValues(semantic)` — flattens `{ color: nested, syntax: flat }` into a `ThemeOverrides`-compatible object: `{ color: { 'background-app': '...', ... }, syntax: { base: '...', ... } }`
- `flattenPrimitiveOverrides(primitives)` — converts `{ radius: { md: '10px' }, shadow: { xs: '...' } }` into a `ThemeOverrides`-compatible object: `{ radius: { md: '10px' }, shadow: { xs: '...' } }`
- `buildVarDeclString(overrides)` — converts flattened overrides to a CSS declaration string `--color-background-app: var(--palette-neutral-1); --syntax-base: oklch(...);` for use inside `insertRule()` raw strings

Steps:

1. Call `tokens.createTheme(config.name, { ...flattenSemanticValues(config.light), ...flattenPrimitiveOverrides(config.primitives ?? {}) })` → light class with all overrides
2. Build dark flat decls string from `config.dark`
3. `insertRule(`theme:${name}:dark-media`, `@media (prefers-color-scheme: dark) { .theme-${name} { ${darkDecls} } }``)`
4. `insertRule(`theme:${name}:dark-attr`, `.theme-${name}[data-mode="dark"] { ${darkDecls} }`)`
5. `insertRule(`theme:${name}:light-attr`, `@media (prefers-color-scheme: dark) { .theme-${name}[data-mode="light"] { ${lightDecls} } }`)`
6. Return `{ className: \`theme-${name}\`, name, lightValues: config.light, darkValues: config.dark, primitiveOverrides: config.primitives }`

**Done when:** Calling `createDesignTheme(...)` injects up to 4 CSS blocks. `getRegisteredCss()` shows all blocks. Returned `className` is `theme-test`. Primitive overrides appear scoped to `.theme-{name}` in the output.

---

### Task 8 — Create built-in theme files

Create `src/theme/themes/default.ts`, `forest.ts`, `rose.ts`, `amber.ts`.

Each file:

- Imports `designPrimitiveTokens as p` from `../tokens` to access palette refs (`p.palette['slate-1']` etc.)
- Imports `defaultLightSyntaxValues`, `defaultDarkSyntaxValues` from `../tokens/semantic`
- Defines `lightColorValues` and `darkColorValues` as `DesignColorValues`-shaped objects using **only palette refs** (`p.palette[...]`) and `color.oklch()`/`color.alpha()` for values outside the 1–10 step range (dark backgrounds only)
- Calls `createDesignTheme({ name, light: { color, syntax }, dark: { color, syntax } })`
- Exports the resulting `DesignTheme` object
- `default.ts` additionally exports `defaultLightValues` and `defaultDarkValues` for extension use

**Zero hardcoded colors** in any theme file — every color value is either `p.palette['family-step']` or a `color.*()` call building on palette refs.

Create `src/theme/themes/index.ts` barrel exporting all 4 themes plus `designPaletteList` and `DesignPaletteId`.

**Done when:** `defaultTheme.className === 'theme-default'`. `defaultTheme.lightValues.color.background.app === 'var(--palette-neutral-1)'`. No raw hex or `#` values anywhere in any theme file.

---

### Task 9 — Create `theme/index.ts`

Barrel exporting everything from `create-theme.ts`, `types.ts`, `tokens/index.ts`, `themes/index.ts`.

**Done when:** `import { defaultTheme, createDesignTheme, designTokens } from './theme'` resolves.

---

### Task 10 — Update component recipes

Update all `src/components/*.ts` using the migration table. Components to touch:

- `button.ts`
- `alert.ts`
- `badge.ts`
- `card.ts`
- `checkbox.ts`
- `radio.ts`
- `switch.ts` (`switchStyles`)
- `textField.ts`
- `textAreaField.ts`
- `select.ts`
- `dialog.ts`
- `commandPalette.ts`
- `codeBlock.ts` — remove all `t.doc.*` refs; use `t.codeBlock.*` new keys
- `codeHighlight.ts` — `t.codeSyntax.*` → `t.syntax.*`; `additionBg` → `additionBackground`, `deletionBg` → `deletionBackground`
- `proseContent.ts` — remove all `t.doc.*` refs; replace with direct `t.color.*`
- `link.ts`, `steps.ts`, `fileTree.ts`, `tabs.ts`

**Done when:** All component files compile with no TypeScript errors. Zero references to old key names remain in `src/components/`.

---

### Task 11 — Update `src/index.ts` barrel

Replace current barrel with new API per spec. Remove old token exports. Add new theme exports.

**Done when:** Barrel matches the "Updated Public API" spec exactly.

---

### Task 12 — Delete `src/tokens/`

Remove the entire `src/tokens/` directory and `src/components/theming.ts`.

**Done when:** No `import` in `src/` references `./tokens/` or `../tokens/`. `src/components/theming.ts` is gone.

---

### Task 13 — Update `react-design-system`

- `src/tokens.ts` — replace exports per spec
- `src/theme.tsx` — `DesignSystemProvider` sets `data-mode` attribute instead of toggling dark class; always applies `defaultTheme.className` as base class

**Done when:** `react-design-system` package compiles with no TypeScript errors.

---

### Task 14 — Update docs app

- `docs/src/tokens.ts` — remove 7 `tokens.createTheme()` calls; use imported theme objects; update `getDocsAppearanceClass`
- `docs/src/styles.ts` — update all `c.X` token refs per migration table; update derived locals
- `docs/src/lib/docsAppearanceRuntime.ts` — `syncDocumentClass` → sets class + `data-mode` attribute
- `docs/src/components/docs/DocsHead.astro` — bootstrap script uses `data-mode` attribute

**Done when:** Docs app builds (`pnpm build` in `docs/`). Dark/light toggle works. Palette switching works.

---

### Task 15 — Final verification

- `pnpm build` in `examples/design-system` — zero TypeScript errors, zero type assertions silencing real problems
- `pnpm build` in `examples/react-design-system` — clean
- `pnpm build` in `docs/` — clean, all pages render
- In browser DevTools on docs site:
  - `:root` shows `--color-background-app`, `--space-1`, `--syntax-base`, `--codeBlock-background` etc.
  - `html.theme-default` with no `data-mode` → light mode by default, dark when system is dark
  - Adding `data-mode="dark"` to `<html>` forces dark regardless of system preference
  - Palette switching changes the theme class and dark mode persists
- `prefers-color-scheme: dark` in DevTools emulation auto-applies dark mode with zero JS

**Done when:** All checks pass.
