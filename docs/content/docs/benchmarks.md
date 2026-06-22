---
title: Benchmarks
description: Reproducible performance measurements for TypeStyles — CSS generation, file size, runtime injection, SSR collection, and cross-framework comparison
---

Measured numbers, reproducible methodology, and honest caveats. These benchmarks run in CI on every pull request — regressions beyond thresholds block the build.

## Reference app

Both TypeStyles and Vanilla Extract benchmarks use equivalent self-contained reference design systems:

- **50 components** — buttons, cards, inputs, modals, layout primitives, etc.
- **8 token namespaces** — color, space, radius, typography, shadow, duration, easing, z-index
- **3 themes** — dark, high-contrast, warm
- **2 keyframe animations**, **4 global styles**

This covers dimensioned variants, flat variants, compound variants, nested selectors, media queries, and pseudo-classes — a realistic production design system. The Vanilla Extract version uses `recipe()`, `style()`, `createThemeContract()`, and `createGlobalTheme()` — their closest equivalents to TypeStyles' APIs.

## TypeStyles results

### CSS generation time

Time to register all styles, tokens, themes, keyframes, and globals.

| Metric                                               | Median       | p95      |
| ---------------------------------------------------- | ------------ | -------- |
| Style registration (50 components + tokens + themes) | **~1.0 ms**  | ~1.5 ms  |
| Selector calls (~90 component function invocations)  | **~0.10 ms** | ~0.13 ms |

Style registration happens once at module load. Selector calls (e.g. `button({ intent: 'primary', size: 'lg' })`) happen on every render — they're string concatenation, not CSS generation.

### Extracted CSS file size

The same 50-component reference app extracted in each naming mode:

| Mode         | Raw     | Gzip   | Rules |
| ------------ | ------- | ------ | ----- |
| **Semantic** | 31.4 KB | 4.7 KB | 232   |
| **Hashed**   | 30.7 KB | 5.2 KB | 232   |
| **Compact**  | 29.0 KB | 4.9 KB | 232   |
| **Atomic**   | 19.0 KB | 4.7 KB | 296   |

Atomic mode produces the smallest raw CSS because identical declarations are deduplicated across components. Gzip sizes converge because compression already exploits repetition.

### Runtime injection

Full cycle: create all styles → serialize CSS → flush to sheet buffer.

| Metric                            | Median      | p95     |
| --------------------------------- | ----------- | ------- |
| Full cycle (registration + flush) | **~1.1 ms** | ~1.3 ms |

### SSR collection

Per-request `collectStyles()` overhead, including `AsyncLocalStorage` isolation.

| Metric                        | Median      | p95     |
| ----------------------------- | ----------- | ------- |
| `collectStyles()` per request | **~1.1 ms** | ~1.4 ms |
| Collected CSS size            | 31.4 KB     | —       |

## Cross-framework comparison: Vanilla Extract

The same 50-component design system implemented in Vanilla Extract's `recipe()` / `style()` / `createThemeContract()` APIs, measured under identical conditions (same machine, same Node version, same benchmark harness).

### Style registration

Time to define all styles, tokens, and themes. For Vanilla Extract this is the build-time `.css.ts` execution cost; for TypeStyles this is module-load time.

| Framework           | Median  | p95     |
| ------------------- | ------- | ------- |
| **TypeStyles**      | ~1.0 ms | ~1.5 ms |
| **Vanilla Extract** | ~0.7 ms | ~1.2 ms |

VE is slightly faster at registration because it collects style objects without serializing CSS inline — serialization happens in their bundler plugin.

### Selector calls

Time to invoke recipe/component functions and get class name strings back. Both frameworks do string concatenation at this stage.

| Framework           | Median   | p95      |
| ------------------- | -------- | -------- |
| **TypeStyles**      | ~0.10 ms | ~0.13 ms |
| **Vanilla Extract** | ~0.03 ms | ~0.07 ms |

VE's recipes are simpler string joins. TypeStyles does more work per call (variant resolution, compound variant matching), which trades a few microseconds for richer variant semantics.

### Extracted CSS file size

| Framework                 | Raw     | Gzip   | Rules |
| ------------------------- | ------- | ------ | ----- |
| **TypeStyles (semantic)** | 31.4 KB | 4.7 KB | 232   |
| **TypeStyles (atomic)**   | 19.0 KB | 4.7 KB | 296   |
| **Vanilla Extract**       | 30.5 KB | 4.6 KB | 196   |

CSS output sizes are nearly identical. TypeStyles' atomic mode produces 38% less raw CSS through cross-component declaration dedup, though gzip narrows the gap.

### What's not compared

- **Runtime injection** — VE doesn't do runtime injection (CSS is always a build artifact). TypeStyles' runtime path is an additional capability, not a comparable dimension.
- **SSR collection** — VE has no runtime CSS collection. Their CSS exists as static files at build time.
- **Build pipeline overhead** — VE's bundler plugin (Vite, webpack, esbuild) adds build-time cost beyond `.css.ts` execution. We only measure the style definition cost, not the full build pipeline.

## Methodology

Each timing benchmark:

1. Runs **5 warmup iterations** (discarded)
2. Runs **30–100 measured iterations**
3. Forces garbage collection between iterations (`--expose-gc`)
4. Reports **median, p95, min, max**

File size measurements are deterministic — they run once per mode and measure exact byte counts (raw and gzip).

The Vanilla Extract benchmark uses their `@vanilla-extract/css/adapter` and `@vanilla-extract/css/fileScope` APIs to run style definitions in Node without a bundler — the same mechanism VE's own test suite uses. CSS output is serialized from VE's structured format to measure comparable file sizes.

### Environment

Numbers above were measured on Apple Silicon (M-series). CI runs on `ubuntu-latest` (GitHub Actions, Node 22) and may differ. File sizes are platform-independent.

## Reproduce locally

From the monorepo root:

```bash
# Build the core package first
pnpm --filter typestyles build

# Run benchmarks (prints results)
pnpm --filter @typestyles/benchmarks bench

# Run with regression check against baseline
pnpm --filter @typestyles/benchmarks bench:ci

# Update baseline after intentional changes
pnpm --filter @typestyles/benchmarks bench:update
```

Results are written to `benchmarks/baseline.json`. The CI job compares each run against this baseline:

- **File size metrics**: fail if raw or gzip size grows > 5%
- **Timing metrics**: printed for visibility but not gated — timing varies too much across hardware (Apple Silicon vs CI VMs can differ 3x+) to use a checked-in baseline reliably

VE results are tracked for comparison but never gate CI (we don't control VE's performance).

## Caveats

- **Runtime injection is measured in Node**, not a real browser. The "full cycle" timing covers CSS serialization and sheet buffering, not actual CSSOM `insertRule` latency.
- **Single-machine numbers.** These are not a cross-platform benchmark suite. Your production performance depends on your users' devices.
- **VE comparison is honest but partial.** We measure what's directly comparable (style definition cost, CSS output size, selector call speed). We don't measure VE's full build pipeline, and we note where TypeStyles has capabilities VE doesn't (runtime injection, SSR collection) rather than treating those as advantages.
- **CI VMs are noisy.** File sizes are the most reliable regression signal.

## Related

- [Performance guide](/docs/performance) — best practices for keeping TypeStyles fast
- [Class naming](/docs/class-naming) — how semantic, hashed, compact, and atomic modes work
- [Zero-runtime extraction](/docs/zero-runtime) — eliminating runtime CSS injection entirely
- [Framework comparison](/docs/framework-comparison) — feature-level comparison across ecosystems
