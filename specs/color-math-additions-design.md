---
title: Housekeeping — relative color syntax + trig/exponential math functions
status: draft
date: 2026-07-29
related: color.ts, css-math.ts, scroll-animations-design.md (calc-size non-goal)
---

# Housekeeping: relative color syntax + trig/exponential math functions

## Problem

An audit of TypeStyles' already-shipped `color.ts` and `css-math.ts` DX against
current CSS spec status found two small, mechanical gaps — not new subsystems, just
missing sibling functions in files that already establish the exact pattern needed.

**Relative color syntax** (`rgb(from <color> r g b / alpha)`, and the same `from`
form for every other color function) reached Baseline Widely Available in September
2024 (~90% coverage). `color.ts` today only wraps `color-mix()` (`mix`/`alpha`) and
plain color-space constructors — nothing lets a caller extract or recompute
individual channels from a source color (e.g. "same hue, lower lightness" or
deriving a hover state from one brand color). `color-mix()` blends two colors;
relative syntax manipulates one.

**Trig/exponential math functions** (`sin`, `cos`, `tan`, `atan2`, `pow`, `sqrt`,
`hypot`) reached Baseline widely-available in September 2025. `css-math.ts` only has
`calc`/`clamp` — these are the same "thin string-wrapping helper, no runtime
validation" shape, just missing.

Both are additions to existing files, not new design surface — hence one small combined
doc rather than two full specs.

### When to use which API

| Task                                                    | API                                                 |
| ------------------------------------------------------- | --------------------------------------------------- |
| Blend two colors                                        | `color.mix()`                                       |
| Change opacity only                                     | `color.alpha()`                                     |
| Same hue, different lightness/chroma (one source color) | `color.from()` / `oklchFrom()`                      |
| Trig/exp inside a `calc()` expression                   | `sin()`, `pow()`, etc. from main `typestyles` entry |

## Goals

- `color.from(space, source, components, alpha?)` on the **`typestyles/color`** subpath
  (same bundle as `mix`/`alpha`), plus `rgbFrom` / `oklchFrom` ergonomic wrappers.
- `sin`, `cos`, `tan`, `atan2`, `pow`, `sqrt`, `hypot` on **`css-math.ts`**, re-exported
  from the main `typestyles` entry alongside `calc` / `clamp`.

## Non-goals

- Not building a fully-typed channel-keyword system per color space (`r`/`g`/`b` vs
  `h`/`s`/`l` vs `l`/`c`/`h` etc.) in v1 — `components` is a plain string, consistent
  with `calc`'s "no validation of inner syntax" stance.
- No `color(from …)` / `display-p3` relative syntax in v1 — `RelativeColorSpace` covers
  the seven function forms (`rgb`, `hsl`, …); wider `color()` / `ColorMixSpace` names
  are a follow-up.
- `if()` excluded entirely — Chrome-only as of 2026, not Baseline, revisit in ~1 year.
- `calc-size()`/`interpolate-size` excluded — Chrome/Edge-only, single-vendor (see
  `scroll-animations-design.md`).
- Other CSS math functions (`log`, `exp`, `abs`, `sign`, `min`, `max`, …) deferred —
  ship the audited trig/exp set first; add siblings if demand appears.

## API

**Import paths:** relative-color helpers live on **`import { color } from 'typestyles/color'`**
only (main entry does not export `color` — bundle-size boundary). Trig/exp helpers live on
**`import { sin, pow, … } from 'typestyles'`** (via `css-math.ts`).

Channel and alpha arguments use the same internal `string | number` shape as existing
`rgb()` / `oklch()` — not exported as a public type (module-private `ColorValue`).

### `color.from(space, source, components, alpha?)`

```ts
/** Relative-color function names — intentionally not the same union as `ColorMixSpace` (`srgb`, `display-p3`, …). */
export type RelativeColorSpace = 'rgb' | 'hsl' | 'hwb' | 'lab' | 'lch' | 'oklab' | 'oklch';

export function from(
  space: RelativeColorSpace,
  source: string,
  components: string,
  alpha?: string | number,
): string;
```

```ts
import { color } from 'typestyles/color';

color.from('oklch', theme.primary, 'l c h');
// "oklch(from var(--theme-primary) l c h)"

color.from('oklch', theme.primary, 'calc(l - 0.1) c h');
// darker variant — calc() inside components string, channel keywords unchanged

color.from('rgb', '#0066ff', 'r g b', 0.5);
// "rgb(from #0066ff r g b / 0.5)"
```

Export `from` from `color.ts` and attach to the `color` namespace object in
`color-entry.ts` (same as `mix`, `alpha`). Emits `${space}(from ${source} ${components})`
or with ` / ${alpha}` when alpha is provided.

### Per-space convenience wrappers (`rgbFrom`, `oklchFrom`)

Two wrappers for the most common cases only — `rgb` (most familiar) and `oklch`
(TypeStyles already treats OKLCH as first-class via `mix`/`alpha` doc examples).
Remaining spaces (`hsl`, `hwb`, `lab`, `lch`, `oklab`) stay on generic `color.from()` —
add dedicated `*From` wrappers later if usage shows demand (YAGNI).

```ts
export function rgbFrom(
  source: string,
  r: string | number | 'r',
  g: string | number | 'g',
  b: string | number | 'b',
  alpha?: string | number | 'alpha',
): string;

export function oklchFrom(
  source: string,
  l: string | number | 'l',
  c: string | number | 'c',
  h: string | number | 'h',
  alpha?: string | number | 'alpha',
): string;
```

```ts
oklchFrom(theme.primary, 'calc(l - 0.1)', 'c', 'h');
// "oklch(from var(--theme-primary) calc(l - 0.1) c h)"
// l accepts a calc expression; c/h pass through as channel keywords

rgbFrom(theme.primary, 'r', 'g', 'b', 0.5);
// "rgb(from var(--theme-primary) r g b / 0.5)"
```

### Trig/exponential math functions

```ts
export function sin(value: CssMathValue): string;
export function cos(value: CssMathValue): string;
export function tan(value: CssMathValue): string;
export function atan2(y: CssMathValue, x: CssMathValue): string;
export function pow(base: CssMathValue, exponent: CssMathValue): string;
export function sqrt(value: CssMathValue): string;
export function hypot(...values: CssMathValue[]): string;
```

```ts
sin('45deg'); // "sin(45deg)"
atan2('1', '1'); // "atan2(1, 1)"
pow('2', '8'); // "pow(2, 8)"
hypot('3px', '4px'); // "hypot(3px, 4px)"
```

Same file (`css-math.ts`), same "wrap and return, no validation" implementation as
`calc`/`clamp`. `hypot()` does not throw on zero arguments — permissive passthrough;
invalid CSS is the browser's problem, consistent with the rest of `css-math.ts`.

## Implementation

| File                                       | Change                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `packages/typestyles/src/color.ts`         | Add `from`, `rgbFrom`, `oklchFrom`, `RelativeColorSpace`                   |
| `packages/typestyles/src/color.test.ts`    | Add cases                                                                  |
| `packages/typestyles/src/color-entry.ts`   | No change — `export const color = colorFns` picks up new fns automatically |
| `packages/typestyles/src/css-math.ts`      | Add `sin`, `cos`, `tan`, `atan2`, `pow`, `sqrt`, `hypot`                   |
| `packages/typestyles/src/css-math.test.ts` | Add cases                                                                  |
| `packages/typestyles/src/index.ts`         | Add trig/exp names to main export list (alongside `calc`, `clamp`)         |

No new subpath entries — `color.ts` already ships via `typestyles/color`.

## Documentation

Add sections to the existing color and CSS-math doc pages (no new pages):

- **Colors:** "Relative color syntax" — `from` / `rgbFrom` / `oklchFrom`, import from
  `typestyles/color`, decision table (mix vs alpha vs from), note that values work in
  token custom properties as plain `<color>` strings (no `@property` changes).
- **Math helpers:** "Trigonometric and exponential functions" — main-entry imports.

Cross-link relative color syntax from `mix()` / `alpha()` docs ("blending two colors vs.
manipulating one").

## Testing

| Area                        | Cases                                                                 |
| --------------------------- | --------------------------------------------------------------------- |
| `color.from()`              | all seven spaces, with/without alpha, `calc()` inside `components`    |
| `rgbFrom()` / `oklchFrom()` | channel-keyword passthrough, numeric channels, `calc()` on `l` / `r`  |
| Trig/exponential functions  | each function's output string; `hypot` with 0, 1, and 3+ args         |
| Export surface              | new color fns on `typestyles/color` only; trig fns on main `index.ts` |
