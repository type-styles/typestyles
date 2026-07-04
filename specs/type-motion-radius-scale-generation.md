# Type / Motion / Radius Scale Generation — Implementation Spec (P5.2)

Implements `IMPROVEMENTS.md` P5.2 — generic numeric ramp generators a
design-system layer can use to produce a font-size ladder, duration min/max
bands, or a radius ladder from a handful of numbers instead of hand-picked
values.

**Scope note:** this spec originally also covered wiring these generators into
`examples/design-system/src/tokens/primitive.ts`. That design-system package
has since moved to var-ui (a separate, public project). This document now
covers the **core engine piece only** — the generic, opinion-free generators
themselves. The consumer-side wiring (naming the steps, calibrating against
existing hand-picked values, per-theme adoption) is var-ui's own concern; see
that project's roadmap/specs for the equivalent design-system-layer spec.

---

## Guiding Principles

| Principle                                      | Rationale                                                                                                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core returns arrays, never names**           | Same rule as `generateRamp` in P5.1: `generateGeometricScale`/`generateLinearScale`/`expandDurationBand` never see `'xs'`, `'fontSize'`, or `'fast'`. They take numeric offsets in, return numbers out.             |
| **Naming is a design-system concern**          | Any consumer (var-ui or otherwise) zips its own named step lists (`['xs','sm','md',…]`) onto the generated numbers. Core has zero opinion about what a step is called.                                              |
| **Additive, not a token-shape rewrite**        | These generators produce _values_ a consumer feeds into its own `tokens.create()` calls. No changes to `createTheme` are required — same non-invasive integration as P5.1.                                          |
| **Duration min/max is additive, non-breaking** | `expandDurationBand` adds new tokens (`*-min`/`*-max` per band) alongside whatever flat anchor keys a consumer already has. Nothing that references an existing `var(--duration-fast)`-style token needs to change. |
| **Whole-number rounding by default**           | Typical consumers want whole px / whole ms. Generators round by default, with an optional override for callers that want different precision.                                                                       |

---

## Core: `packages/typestyles/src/token-scale.ts`

### `generateGeometricScale(opts: { base: number; ratio: number; steps: number[]; round?: (n: number) => number }): number[]`

- `steps` is an array of **signed integer offsets** from the base, not names or
  counts — e.g. `steps: [-2, -1, 0, 1, 2, 3, 4]` for a 7-step ladder anchored
  at offset `0`.
- `value(offset) = base * ratio ** offset`.
- `round` defaults to `Math.round` (whole-number output). Callers needing
  sub-integer precision can override it — no current core use case needs this,
  so it isn't built beyond the override hook.
- Returns `number[]` in the same order as `steps`, unitless (the caller appends
  `px`/`rem`/whatever unit makes sense for its own token).

### `generateLinearScale(opts: { base: number; multiplier: number; steps: number[]; round?: (n: number) => number }): number[]`

- `steps` here is an array of **ordinal multipliers**, e.g. `[1, 2, 3, 4]`.
- `value(step) = base * step * multiplier`.
- Deliberately the simplest of the three generators — barely more than one
  line of arithmetic. It exists for a single rounding/unit convention, not
  because the math is complex. Resist adding features here (e.g. non-linear
  curves) — that's scope creep beyond this spec.

### `expandDurationBand(opts: { base: number; ratio: number; roundTo?: number }): { min: number; base: number; max: number }`

- `min = round(base * ratio, roundTo)`, `max = round(base / ratio, roundTo)`,
  `base` passes through unchanged.
- `roundTo` defaults to `5` (nearest 5ms): sub-5ms differences in a CSS
  transition duration aren't perceptible or meaningfully distinct, and
  computed bands round to noisy values (e.g. `93.75ms`) without it. Nearest-5ms
  keeps the output looking hand-picked instead of visibly computed, while
  still preserving the ratio's shape.
- Takes a single `{base, ratio}` pair per call — it does not take or know
  about anchor names (`fast`/`medium`/`slow` or otherwise). A consumer with
  three named anchors calls this three times.

---

## Explicitly out of scope for this spec

- **Semantic type-role tokens** (a `heading-N`/`body`/`display-N` tier, the
  way some design systems layer type roles on top of raw font sizes). That's
  a new token _layer_, not a generator, and belongs in its own future spec if
  a consumer needs it.
- **A `ThemeConfig` field for per-theme scale overrides.** A theme can already
  override individual token values via `tokens.createTheme`'s existing `base`
  overrides; it just can't do so by passing `{base, multiplier}`-style config
  directly yet. No known need for that hook today.
- **Non-integer rounding / alternate units.** No current core consumer needs
  it; add a `round`/`roundTo` override if one arises rather than speculatively
  building it now.
- **Any specific consumer's token naming, calibration, or rollout** (e.g.
  which numbers a given design system's font-size ladder should use). That's
  entirely the calling project's decision.

---

## Testing

- **`token-scale.test.ts`**: `generateGeometricScale` — deterministic output
  for known `(base, ratio, steps)` triples, confirms offset `0` always
  returns exactly `base` (no rounding drift); `generateLinearScale` —
  `multiplier: 0` returns all zeros, deterministic for a known triple;
  `expandDurationBand` — asserts `min`/`max` directly against the stated
  formula (`round(base * ratio, roundTo)` / `round(base / ratio, roundTo)`)
  for arbitrary `(base, ratio)` inputs, and confirms a `roundTo` override
  changes rounding granularity.

---

## Implementation Tasks

### Task 1 — Add `token-scale.ts` to core

Implement `generateGeometricScale`, `generateLinearScale`, `expandDurationBand`
per the algorithms above in `packages/typestyles/src/token-scale.ts`.

**Done when:** unit tests from the Testing section pass.

### Task 2 — Wire the `typestyles/token-scale` subpath export

Mirror `typestyles/color-scale`'s entry file and `package.json` `exports` block
(added in P5.1 Task 4) for this new subpath.

**Done when:** `import { generateGeometricScale, generateLinearScale,
expandDurationBand } from 'typestyles/token-scale'` resolves in both ESM and
CJS; main entry bundle size is unaffected (same size-budget CI check as P5.1).

### Task 3 — Tests

Write the tests described in the Testing section.

**Done when:** `pnpm test` passes in `packages/typestyles` with the new suite
included.

### Task 4 — Docs

Add a short section to the theming docs introducing the three generators and
when to reach for each (geometric for size ladders, linear for radius-style
ladders, duration-band for motion). Mark P5.2 as shipped in `IMPROVEMENTS.md`
with the PR link.

**Done when:** docs page builds and renders the new section; `IMPROVEMENTS.md`
checkbox is checked with a PR reference.
