---
title: Housekeeping — relative color syntax + trig/exponential math functions
status: draft
date: 2026-07-29
related: color.ts, css-math.ts
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

## Goals

- `color.from(space, source, components, alpha?)` plus a couple of ergonomic
  per-space wrappers for the most common cases.
- `sin`, `cos`, `tan`, `atan2`, `pow`, `sqrt`, `hypot` added to `css-math.ts`.

## Non-goals

- Not building a fully-typed channel-keyword system per color space (`r`/`g`/`b` vs
  `h`/`s`/`l` vs `l`/`c`/`h` etc.) in v1 — components are a plain string, consistent
  with `calc`'s "no validation of inner syntax" stance.
- `if()` excluded entirely — Chrome-only as of 2026, not Baseline, revisit in ~1 year.
- `calc-size()`/`interpolate-size` excluded — Chrome/Edge-only, single-vendor.

## API

### `color.from(space, source, components, alpha?)`

```ts
export type RelativeColorSpace = 'rgb' | 'hsl' | 'hwb' | 'lab' | 'lch' | 'oklab' | 'oklch';

export function from(
  space: RelativeColorSpace,
  source: string,
  components: string,
  alpha?: ColorValue,
): string {
  const body = `from ${source} ${components}`;
  return alpha != null ? `${space}(${body} / ${alpha})` : `${space}(${body})`;
}
```

```ts
color.from('oklch', theme.primary, 'l c h'); // "oklch(from var(--theme-primary) l c h)"
color.from('oklch', theme.primary, 'calc(l - 0.1) c h'); // darker variant, same hue/chroma
color.from('rgb', '#0066ff', 'r g b', 0.5); // "rgb(from #0066ff r g b / 0.5)"
```

### Per-space convenience wrappers (`rgbFrom`, `oklchFrom`)

Two wrappers for the most common cases only — `rgb` (most familiar) and `oklch`
(TypeStyles already treats as a first-class space via `mix`/`alpha`'s default doc
examples):

```ts
export function rgbFrom(
  source: string,
  r: ColorValue | 'r',
  g: ColorValue | 'g',
  b: ColorValue | 'b',
  alpha?: ColorValue | 'alpha',
): string;
export function oklchFrom(
  source: string,
  l: ColorValue | 'l',
  c: ColorValue | 'c',
  h: ColorValue | 'h',
  alpha?: ColorValue | 'alpha',
): string;
```

```ts
oklchFrom(theme.primary, 'calc(l - 0.1)', 'c', 'h'); // darker, same hue/chroma — typo-resistant channel names
```

Remaining spaces (`hsl`, `hwb`, `lab`, `lch`, `oklab`) stay on the generic
`color.from()` — add dedicated wrappers later if usage shows demand, consistent with
YAGNI.

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
`calc`/`clamp`.

## Implementation

| File                                       | Change                                                   |
| ------------------------------------------ | -------------------------------------------------------- |
| `packages/typestyles/src/color.ts`         | Add `from`, `rgbFrom`, `oklchFrom`, `RelativeColorSpace` |
| `packages/typestyles/src/color.test.ts`    | Add cases                                                |
| `packages/typestyles/src/css-math.ts`      | Add `sin`, `cos`, `tan`, `atan2`, `pow`, `sqrt`, `hypot` |
| `packages/typestyles/src/css-math.test.ts` | Add cases                                                |

No `index.ts` restructuring — both files already have their exports re-exported
(`color.ts` via the `typestyles/color` subpath entry, `css-math.ts` via the main
entry); just add the new names to each existing export list.

## Documentation

Add sections to the existing color and CSS-math doc pages (no new pages) —
"Relative color syntax" under colors, "Trigonometric and exponential functions"
under math helpers. Cross-link relative color syntax from `mix()`/`alpha()`'s docs
("blending two colors vs. manipulating one").

## Testing

| Area                        | Cases                                                             |
| --------------------------- | ----------------------------------------------------------------- |
| `color.from()`              | all seven spaces, with/without alpha                              |
| `rgbFrom()` / `oklchFrom()` | channel-keyword passthrough, `calc()`-wrapped channel expressions |
| Trig/exponential functions  | each function's output string, `hypot` variadic (0, 1, many args) |

## Open design questions

- Should `hypot()` reject a zero-argument call (CSS requires at least one), or stay
  permissive and let the browser reject invalid CSS — consistent with the rest of
  `css-math.ts` doing no inner validation, lean toward permissive.
- Worth widening `rgbFrom`/`oklchFrom` to the remaining five spaces now while the
  pattern is fresh, or genuinely wait for demand? Low cost either way — decide at
  implementation time based on how much boilerplate five more thin wrappers add
  versus how often `color.from()`'s generic form is used in practice once shipped.
