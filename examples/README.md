# Examples

Runnable apps and libraries that demonstrate typestyles integrations. All examples are private workspace packages — run them from the **monorepo root** after `pnpm install`.

```bash
pnpm install          # once, at repo root
pnpm vite-app dev     # or next-app, typewind, vue-app, …
```

## By topic

| Example                                      | Command                   | What it shows                                                     |
| -------------------------------------------- | ------------------------- | ----------------------------------------------------------------- |
| [vite-app](./vite-app)                       | `pnpm vite-app dev`       | React + `@typestyles/vite` — HMR, convention entry, design system |
| [next-app](./next-app)                       | `pnpm next-app dev`       | Next.js App Router + `buildTypestylesForNext` + CI verification   |
| [vue-app](./vue-app)                         | `pnpm vue-app dev`        | Vue 3 + Vite extraction                                           |
| [svelte-app](./svelte-app)                   | `pnpm svelte-app dev`     | Svelte 5 + Vite extraction                                        |
| [esbuild-app](./esbuild-app)                 | `pnpm esbuild-app test`   | `@typestyles/esbuild` — vanilla JS                                |
| [rollup-app](./rollup-app)                   | `pnpm rollup-app build`   | `@typestyles/rollup`                                              |
| [rolldown-app](./rolldown-app)               | `pnpm rolldown-app build` | Rolldown + Rollup-compatible plugin                               |
| [parcel-app](./parcel-app)                   | `pnpm parcel-app dev`     | Runtime-only path (no typestyles bundler plugin)                  |
| [typewind](./typewind)                       | `pnpm typewind dev`       | Tailwind-style utilities via `styles.class`                       |
| [design-system](./design-system)             | _(library)_               | Framework-agnostic tokens and recipes                             |
| [react-design-system](./react-design-system) | _(library)_               | React components on top of the design system                      |

## Runtime vs extraction

| Pattern                                | Examples                                                    |
| -------------------------------------- | ----------------------------------------------------------- |
| **Runtime in dev, static CSS in prod** | `vite-app`, `next-app`, `vue-app`, `svelte-app`, `typewind` |
| **Build-time extraction only**         | `esbuild-app`, `rollup-app`, `rolldown-app`                 |
| **Runtime everywhere**                 | `parcel-app`                                                |

Convention entry filenames and discovery order: [zero-runtime docs](https://typestyles.dev/docs/zero-runtime).

## Shared libraries

Several apps import:

- **`@examples/design-system`** — tokens, recipes, themes (also powers the [docs site](../docs/README.md))
- **`@examples/react-design-system`** — React Aria components used by `vite-app` and `next-app`

Import these in your `typestyles-entry` file so extraction includes library CSS.

## Verification scripts

Examples with `pnpm test` run a production build plus a small Node script that asserts expected class names or CSS substrings land in output — useful as a template for CI:

- `next-app` — `verifyTypestylesBuild` with manifest checks
- `vue-app`, `svelte-app`, `esbuild-app`, `parcel-app` — custom `scripts/verify-build.mjs`

## Contributing to examples

Use examples to prove docs claims and give teams copy-paste starting points. Prefer extending an existing app over adding a new one unless the integration surface is genuinely different (new bundler, framework, or workflow).

### When to add vs extend

| Situation                                                  | Prefer                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| New doc section on an existing integration (e.g. Vite HMR) | Extend `vite-app` or add a focused file + README note        |
| New bundler or framework                                   | New `examples/<name>-app` with its own README                |
| Shared tokens/recipes for multiple apps                    | `@examples/design-system` or `@examples/react-design-system` |
| Pedagogical pattern (utilities, themes)                    | `typewind` or a small module in an existing app              |

### Checklist for a new example app

1. **Workspace package** — `private: true`, `typestyles` as `workspace:*`, script alias in root `package.json` (e.g. `"my-app": "pnpm --filter typestyles-my-example"`).
2. **README** — run commands from monorepo root, file layout table, link to relevant doc pages and package READMEs.
3. **Convention entry** — `src/typestyles-entry.ts` (or `styles/typestyles-entry.ts` for Next) importing every registration side effect.
4. **Verification** — add `scripts/verify-build.mjs` or use `verifyTypestylesBuild` from `@typestyles/build-runner`; wire `pnpm test` when extraction applies.
5. **Lint** — `eslint.config.js` extending `typestylesAppConfig` from root `eslint.base.js`.
6. **Docs cross-link** — add the example to the table in [`docs/README.md`](../docs/README.md#doc-pages-and-runnable-examples) and, if the guide mentions a runnable app, link back from `content/docs/<slug>.md`.

### Keeping examples and docs in sync

- If a guide shows production extraction, the linked example should have a working convention entry and a green `pnpm test` or `pnpm build`.
- If you change discovery paths or plugin defaults in `@typestyles/vite`, update `vite-app`, `vue-app`, `svelte-app`, and `typewind` together.
- Live demos on the docs site (`docs/src/demos/`) are separate from example apps — but both should agree on APIs. When a demo introduces a new pattern, consider mirroring it in the smallest relevant example.

### Design-system changes

Token or recipe changes in `@examples/design-system` affect the docs site, `react-design-system`, `vite-app`, and `next-app`. Run:

```bash
pnpm --filter docs build
pnpm next-app build
pnpm vite-app build
```

…after substantive token renames so extraction and verify scripts still pass.

## Learn more

- [Root README](../README.md) — product overview and package index
- [Documentation site](../docs/README.md) — guides, live demos, and [doc ↔ example map](../docs/README.md#doc-pages-and-runnable-examples)
