# TypeStyles — principal design engineer feedback

This note captures an honest evaluation of TypeStyles as a foundation for a **React design system**, after reading the documentation under `docs/content/docs/` and the root `README.md`, and skimming `examples/design-system` and the published APIs.

## What is unusually strong

**CSS-native mental model.** Tokens are CSS custom properties, themes are subtree overrides, and selectors stay familiar (`&`, media queries, container queries). That is the right default for a design system that must coexist with legacy CSS, third-party widgets, and browser devtools.

**Readable, deterministic class names.** Semantic names in DevTools matter more than teams admit until they are six months into debugging production. TypeStyles avoids the opaque hashes of runtime CSS-in-JS by default and still offers hashed modes when you publish a library.

**Incremental and architectural escape hatches.** `createStyles` / `createTokens` / `createTypeStyles`, optional cascade layers, zero-runtime extraction via Vite/Rollup/Next integrations, and SSR collection cover the real lifecycle: local dev, CI builds, streaming SSR, and micro-frontends. Few libraries document that full arc in one place; TypeStyles is close.

**TypeScript-first ergonomics without pretending CSS is not CSS.** Helpers for `@container`, `:has`, `:where`, `calc`/`clamp`, and color functions address the pain points where typed objects otherwise fight the type system.

## Where a principal engineer would hesitate

**Positioning vs alternatives is scattered.** The README compares StyleX, styled-components, and Tailwind, but teams evaluating **Panda CSS, Emotion, vanilla-extract, CSS Modules, or plain CSS** still have to infer fit from the migration guide and prose. A single “when to choose TypeStyles” narrative reduces evaluation cost.

**The “design system spine” is discoverable but not front-loaded.** `createTypeStyles`, cascade layers, and zero-runtime extraction are the features that make a design system _shippable_ at scale; they appear across several docs (`getting-started`, `cascade-layers`, `zero-runtime`, `api-reference`). A newcomer can miss them and default to global `styles`/`tokens`, then hit collisions or specificity surprises later.

**Some long-form guides mix aspirational process with copy-pasteable code.** The design-system token guide is valuable for governance thinking, but a few snippets were not valid TypeScript or referenced APIs that do not exist in TypeStyles (`generateCSS`, duplicate object keys). That erodes trust faster than any missing feature.

**Runtime-by-default vs zero-runtime.** The product story is coherent (runtime in dev, extract in prod), but the decision tree (“when must I use hybrid mode?” “what about dynamically generated styles?”) benefits from being repeated in one short checklist near “getting started” for design-system authors.

## Documentation fixes and additions shipped from this feedback

| Item                        | Action                                                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework comparison        | Added `docs/content/docs/framework-comparison.md` and linked it from navigation and README.                                                                                   |
| Design-system playbook      | Added a “Building a design system” section to `getting-started.md` pointing to `createTypeStyles`, tokens, layers, zero-runtime, and the new comparison doc.                  |
| Broken typography example   | Split semantic typography into separate `tokens.create` namespaces in `design-system.md` so keys like `normal` / `tight` do not collide.                                      |
| Button token example        | Added vertical padding tokens and aligned the “good” snippet with the Layer 3 definition.                                                                                     |
| Token distribution          | Replaced placeholder `generateCSS` / `generateSCSS` with TypeStyles-accurate options (`getRegisteredCss`, SSR `collectStyles`, Vite/Rollup extraction, hand-maintained JSON). |
| Misleading `card()` comment | Corrected `styles.md` so `card()` without variants is documented as `card-base` only.                                                                                         |

## Verdict

TypeStyles is already a credible **design-system core**: tokens + themes + variants + composition + optional build extraction matches what teams actually ship. The main gap was **documentation packaging for that audience**—comparison framing, a single spine for “how we run this in prod,” and copy-paste hygiene. Addressing those makes it reasonable to “reach for TypeStyles first” when the priorities are CSS interoperability, readable output, typed variants, and a path to zero-runtime without abandoning the authoring model.
