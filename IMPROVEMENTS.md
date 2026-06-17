# TypeStyles Improvement Plan

Tracking doc for the prioritized improvements from the June 2026 principal-engineer audit.
Each task ships as its own PR. Check items off and link the PR as they land.

Source material: full audit of `packages/typestyles` (source, types, tests), all
integration packages, the docs site (31 pages), and all examples. Supersedes the
remaining open items in `FEEDBACK-COMBINED.md` (Tiers 1–2 of that doc are shipped).

## Strategic frame

We will not out-Tailwind Tailwind or out-atomic StyleX. The winnable market is
**teams building design systems who are burned by runtime CSS-in-JS but refuse to
give up TypeScript ergonomics or CSS interop**. Every task below serves one sentence:

> "As type-safe as vanilla-extract, as ergonomic as Stitches, debuggable like plain
> CSS — and you can verify the zero-runtime output yourself."

---

## P0 — Trust & correctness

Bugs and credibility issues that lose evaluations on contact. Do these first.

- [x] **P0.1 — Fix silent-wrong-output bugs** (PR: #86)
  - Refresh the stale unitless property set in `packages/typestyles/src/css.ts`
    (`aspectRatio: 1.5` currently emits invalid `aspect-ratio: 1.5px`; also
    `scale`, `WebkitLineClamp`, `fontSizeAdjust`, …)
  - Make `scopeId` actually affect semantic-mode class names (today it is a
    silent no-op in `class-naming.ts` — two packages collide without warning)
  - Add dev-mode hash-collision detection (promised in roadmap §6.1, never shipped)
  - Fix `useTypestyles` no-op subscribe in `@typestyles/next/src/client.tsx`

- [x] **P0.2 — Credibility sweep** (PR: #87)
  - Site chrome links to `github.com/typestyles/typestyles`; canonical org is
    `type-styles` (see PR #82). Fix `docs/src/lib/site.ts`, header, landing page.
  - Landing page (`docs/src/pages/index.astro`): DOM preview shows
    `class="button …"` but the product emits `button-base …`; hero sample uses an
    undefined `token.accent`
  - Unify license: `packages/next` and `packages/open-props` say MIT, everything
    else Apache-2.0
  - Delete `packages/build/` zombie directory (dist + node_modules only, untracked
    src, matches the workspace glob)
  - Fix `@typestyles/open-props` broken `./css` export (`dist/open-props.css` is
    never built) and remove the unused `open-props` dependency

- [x] **P0.3 — Surface the production story in the docs nav** (PR: #88)
  - `zero-runtime.md` has 16 inbound links but is not in the sidebar
    (`docs/src/navigation.ts`); `open-props.md` likewise
  - Decide on `css-selector-patterns.md` (internal research → remove from build or
    promote)

- [x] **P0.4 — Request-safe SSR collection** (PR: #89)
  - `collectStyles` uses a module-global buffer (`sheet.ts`); concurrent SSR
    requests interleave CSS. Isolate with `AsyncLocalStorage` on Node.
  - Add async render support: `collectStyles(async () => …)`

## P1 — Competitive table stakes

- [x] **P1.5 — Cut the runtime for the common path** (PR: #90)
  - Main entry is ~15 KB gzip; `color` namespace and helpers are eagerly bundled.
    Move `color` to a `typestyles/color` subpath entry.
  - Add a size budget check to CI and publish the measured number in the README
    comparison table.

- [ ] **P1.6 — Interactive proof in the docs** (PR: )
  - No playground, no live examples anywhere. Because TypeStyles runs in the
    browser, the docs site can render live demos: authored code + emitted CSS +
    actual DOM class names side by side. Ship a `LiveDemo` component and use it on
    getting-started, components, and theming pages.
  - Full editable REPL can follow later (P3).

- [x] **P1.7 — Productize the extraction verifier** (PR: #92)
  - Zero-runtime extraction is execute-and-collect; styles unreachable from the
    convention entry are silently dropped. Promote the pattern from
    `examples/next-app/scripts/verify-typestyles.mts` into
    `@typestyles/build-runner` as a supported `verifyTypestylesBuild()` API +
    document it on the zero-runtime page.

- [x] **P1.8 — First-class dynamic styling story** (PR: #93)
  - `createVar`/`assignVars` exists but is undocumented and anonymous (`--ts-N`).
    Add debug names (`createVar('cardBg')`), write a dedicated docs page, and
    cross-link from best-practices/performance pages (which currently just say
    "use inline styles").

- [ ] **P1.9 — Streaming SSR story** (PR: )
  - Document streaming SSR (`renderToPipeableStream`) and RSC patterns against the
    request-scoped collection from P0.4; add helpers where they remove boilerplate.

## P2 — Ecosystem & DX

- [ ] **P2.10 — True atomic output** (PR: )
  - Current "atomic" naming mode is whole-object hashing, not atomic CSS. Without
    per-declaration dedup, CSS grows linearly with the codebase while
    StyleX/Tailwind plateau. Ship per-property atomic decomposition; rename the
    current mode honestly.

- [ ] **P2.11 — ESLint plugin MVP** (PR: )
  - `@typestyles/eslint-plugin` with first rules: shorthand/longhand conflict
    detection (we do nothing today; StyleX errors), invalid unitless values,
    duplicate namespace literals.

- [ ] **P2.12 — Integration parity + honest claims** (PR: )
  - Rollup plugin: add convention-entry discovery to match Vite/Next defaults
  - Root README overclaims "works with webpack, esbuild, Parcel out of the box" —
    true only for runtime mode; correct it
  - Getting-started claims Vue/Svelte support with zero examples or tests; soften
    or substantiate

- [ ] **P2.13 — READMEs for every published package** (PR: )
  - Missing: `packages/vite`, `packages/astro`, `packages/migrate`,
    `packages/props`, `packages/open-props`, `packages/build-runner`. npm package
    pages are landing pages.

- [ ] **P2.14 — Migrate codemod: handle interpolations** (PR: )
  - The codemod skips any template literal with interpolations — i.e. most real
    styled-components code. Convert prop-based interpolations to
    `createVar` + `assignVars` so migration is genuinely automated.

- [ ] **P2.15 — Per-route critical CSS** (PR: )
  - `getRegisteredCss()` returns everything ever registered. Use the extraction
    manifest in `@typestyles/next/build` to emit route-level CSS.

## P3 — Later (not scheduled)

- VS Code extension: hover preview of emitted CSS, token autocomplete with swatches
- Editable playground/REPL
- Recipes/cookbook section (resurrect the `recipes.astro` redirect)
- W3C Design Tokens import + Figma sync
- 1.0 stability policy and criteria
