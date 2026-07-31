---
title: OKLCH manipulation sugar on relative color syntax
status: draft
date: 2026-07-30
related: color.ts, color-math-additions-design.md, color-scale-generation.md
depends-on: color-math-additions-design.md (shipped — `oklchFrom`, `from`)
---

# OKLCH manipulation sugar on relative color syntax

## Problem

`color.from()` / `oklchFrom()` (see `color-math-additions-design.md`) expose CSS
relative color syntax, but common single-source tweaks still require callers to
remember channel keywords and hand-write `calc()`:

```ts
oklchFrom(theme.primary, 'calc(l - 0.1)', 'c', 'h'); // darker hover
oklchFrom(theme.primary, 'l', 'calc(c * 1.2)', 'h'); // more vivid
oklchFrom(theme.primary, 'l', '0', 'h'); // grayscale
```

Libraries like [Qix-/color](https://github.com/Qix-/color) and Sass expose
familiar verbs (`lighten`, `darken`, `saturate`, `rotate`, …). TypeStyles does
not want a chainable color object, parsers, or runtime channel math — but thin
wrappers that emit the same `oklch(from …)` strings are a natural next step on
top of `oklchFrom`.

Build-time palette generation (`typestyles/color-scale`: `parseColor`,
`generateRamp`, `contrastRatio`) stays separate. This spec is runtime CSS
string emission only.

### When to use which API

| Task                                                      | API                                  |
| --------------------------------------------------------- | ------------------------------------ |
| Blend two colors                                          | `color.mix()`                        |
| Change opacity only                                       | `color.alpha()`                      |
| Arbitrary channel expression                              | `color.oklchFrom()` / `color.from()` |
| Familiar lighten / darken / saturate / rotate / grayscale | **this spec**                        |
| Generate a full ramp from one accent at build time        | `typestyles/color-scale`             |

## Goals

- Six sugar helpers on **`typestyles/color`**, implemented as one-liners over
  `oklchFrom` (no new primitives).
- OKLCH-only — matches TypeStyles' existing bias (`mix`/`alpha` doc examples,
  `color-scale` output).
- `string | number` amounts — same permissive stance as `rgb()` / `oklch()`; no
  validation of units or ranges.

## Non-goals

- **Not** a JavaScript color library — no `Color` class, no chaining, no
  `.hex()` / `.hsl()` getters, no parsing of arbitrary CSS color strings.
- **Not** Sass/Qix-/color semantics — `lighten(0.5)` in HSL is unrelated to
  `calc(l + 0.5)` in OKLCH. Docs must say "OKLCH channel delta", not
  "50% lighter".
- **Not** HSL/HWB/LCH variants of these helpers — use `color.from('hsl', …)` for
  other spaces; add `hslLighten` etc. only if demand appears.
- **Not** `luminosity`, `contrast`, `isLight`, `isDark` — need parsed values;
  `contrastRatio` on `color-scale` covers build-time checks.
- **Not** `fade` / `opaquer` aliases — `color.alpha()` already covers opacity via
  `color-mix()`.
- **Not** `negate`, `whiten`, `blacken`, `mix` duplicates — out of scope or
  already exist.

## API

**Import path:** `import { color } from 'typestyles/color'` (same bundle as
`mix`, `oklchFrom`). Main entry does not export `color`.

All functions take `source: string` (hex, `var()`, `oklch()`, etc.) and return a
plain CSS color string. Implementation delegates to `oklchFrom`; unset channels
pass through as keywords `'l'`, `'c'`, `'h'`.

```ts
export function lighten(source: string, amount: string | number): string;
export function darken(source: string, amount: string | number): string;
export function saturate(source: string, factor: string | number): string;
export function desaturate(source: string, factor: string | number): string;
export function rotate(source: string, degrees: string | number): string;
export function grayscale(source: string): string;
```

### Semantics

| Function                     | Emits (via `oklchFrom`)      | Notes                                     |
| ---------------------------- | ---------------------------- | ----------------------------------------- |
| `lighten(source, amount)`    | `l` → `calc(l + ${amount})`  | Additive on OKLCH lightness               |
| `darken(source, amount)`     | `l` → `calc(l - ${amount})`  | Subtractive on OKLCH lightness            |
| `saturate(source, factor)`   | `c` → `calc(c * ${factor})`  | Multiplicative chroma                     |
| `desaturate(source, factor)` | `c` → `calc(c * ${factor})`  | Factor &lt; 1 reduces chroma (e.g. `0.5`) |
| `rotate(source, degrees)`    | `h` → `calc(h + ${degrees})` | Additive hue; browser normalizes          |
| `grayscale(source)`          | `c` → `0`                    | Hue preserved, zero chroma                |

```ts
import { color } from 'typestyles/color';

color.lighten(theme.primary, 0.1);
// "oklch(from var(--theme-primary) calc(l + 0.1) c h)"

color.darken(theme.primary, '10%');
// "oklch(from var(--theme-primary) calc(l - 10%) c h)"

color.saturate(theme.primary, 1.2);
// "oklch(from var(--theme-primary) l calc(c * 1.2) h)"

color.desaturate(theme.primary, 0.5);
// "oklch(from var(--theme-primary) l calc(c * 0.5) h)"

color.rotate(theme.primary, 30);
// "oklch(from var(--theme-primary) l c calc(h + 30))"

color.grayscale(theme.primary);
// "oklch(from var(--theme-primary) l 0 h)"
```

**Unit responsibility:** `amount` / `factor` / `degrees` are interpolated into
`calc()` as-is. If the source color's `l` is a percentage, pass `'10%'` not
`0.1`. TypeStyles does not inspect or normalize the source — consistent with
`oklchFrom` and `calc`.

Attach all six to the `color` namespace object in `color-entry.ts` (automatic
via `export const color = colorFns`).

### Internal helper (optional)

If it keeps `color.ts` DRY, a module-private helper is fine — **not** exported:

```ts
function oklchAdjust(
  source: string,
  l: ColorValue | 'l' = 'l',
  c: ColorValue | 'c' = 'c',
  h: ColorValue | 'h' = 'h',
): string {
  return oklchFrom(source, l, c, h);
}
```

Sugar functions call `oklchAdjust` or `oklchFrom` directly; no behavioral
difference.

## Implementation

| File                                     | Change                                                |
| ---------------------------------------- | ----------------------------------------------------- |
| `packages/typestyles/src/color.ts`       | Add six functions (+ optional `oklchAdjust`)          |
| `packages/typestyles/src/color.test.ts`  | Output-string cases per function                      |
| `packages/typestyles/src/color-entry.ts` | No change — namespace picks up exports                |
| `docs/content/docs/color.md`             | "OKLCH manipulation" subsection under relative syntax |

No new subpath entries. No main-entry exports. No bundle-size impact on
`dist/index.js` (lives on `typestyles/color` only).

## Documentation

Add **"OKLCH manipulation"** under the existing "Relative color syntax"
section in `color.md`:

- Table mapping sugar → underlying relative syntax (same as semantics table above).
- Cross-link from `mix()` / `alpha()` / `oklchFrom()` ("common tweaks vs.
  arbitrary expressions").
- Explicit callout: **not Sass-compatible** — OKLCH channel math, perceptually
  different from HSL `lighten()` / `darken()`.
- Note that values work in token custom properties as plain `<color>` strings.
- Point build-time ramp/contrast needs to `typestyles/color-scale`.

Do not add a new docs page.

## Testing

| Area                      | Cases                                                    |
| ------------------------- | -------------------------------------------------------- |
| `lighten` / `darken`      | numeric and string amounts (`0.1`, `'10%'`)              |
| `saturate` / `desaturate` | factor interpolation (`1.2`, `0.5`)                      |
| `rotate`                  | positive degrees, string with unit (`'30deg'`) if passed |
| `grayscale`               | chroma `0`, `l`/`h` keywords preserved                   |
| Token sources             | `var(--token)` passthrough                               |
| Export surface            | on `typestyles/color` namespace only                     |

No browser/visual tests — string emission only, same as `color-math-additions`.

## Resolved decisions

1. **No `setLightness` / `setChroma` / `setHue` aliases** — `oklchFrom(source, value, 'c', 'h')` is sufficient.
2. **`desaturate` is symmetrical with `saturate`** — both use multiplicative `calc(c * factor)`; use a factor &lt; 1 to reduce chroma.
3. **No default factors** — `saturate(source, factor)` requires an explicit factor.
