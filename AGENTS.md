# AGENTS.md

Guidance for coding agents working in the **typestyles** monorepo.

## What is typestyles?

CSS-in-TypeScript: type-safe style objects, design tokens as CSS custom properties, human-readable class names, and optional zero-runtime extraction via bundler plugins (`@typestyles/vite`, `@typestyles/next`, etc.).

- **Docs site:** https://typestyles.dev
- **AI doc index:** https://typestyles.dev/llms.txt
- **Full markdown bundle:** https://typestyles.dev/llms-full.txt
- **MCP server:** https://typestyles.dev/mcp (search, fetch docs, API lookup, examples, changelogs)

## Monorepo layout

| Path                                                             | Purpose                                                     |
| ---------------------------------------------------------------- | ----------------------------------------------------------- |
| `packages/typestyles`                                            | Core runtime (`styles`, `tokens`, `cx`, …)                  |
| `packages/vite`, `rollup`, `esbuild`, `webpack`, `next`, `astro` | Bundler integrations                                        |
| `packages/react`, `props`, `open-props`, `migrate`, `cli`        | Framework adapters & tooling                                |
| `packages/build-runner`                                          | Shared build-time CSS extraction                            |
| `docs/`                                                          | Astro documentation site (source: `docs/content/docs/*.md`) |
| `examples/`                                                      | Runnable example apps                                       |

Package manager: **pnpm** (workspace). Node 20+ recommended.

## Key commands

Run from the **repository root**:

```bash
pnpm install          # install all workspace deps
pnpm build            # turbo build (all packages + docs)
pnpm test             # turbo test
pnpm typecheck        # turbo typecheck
pnpm lint             # turbo lint
```

Docs site only:

```bash
pnpm --filter docs dev
pnpm --filter docs build
turbo run build --filter docs
```

Core package:

```bash
pnpm --filter typestyles test
pnpm --filter typestyles build
```

## Documentation for agents

- Prefer fetching **clean markdown** over parsing HTML: `https://typestyles.dev/docs/<slug>.md`
- Use the **MCP server** when you need search or API lookup mid-task
- Doc source lives in `docs/content/docs/`; navigation order is in `docs/src/navigation.ts`
- AI transforms: `docs/src/lib/aiMarkdown.ts`

## Conventions

- TypeScript throughout; ESM (`"type": "module"`)
- Tests: Vitest (`vitest run` per package)
- Changesets for releases (`.changeset/`)
- Prettier + ESLint; husky pre-commit runs lint-staged

## Common pitfalls

- Styles must be **imported** from a side-effect entry (e.g. `typestyles-entry.ts`) for build extraction to emit CSS
- Use `createTypeStyles({ scopeId })` per package/micro-frontend for token/class isolation
- Prefer `styles.component` + variants over ad-hoc string class names
- SSR: use `typestyles/server` helpers; see `docs/content/docs/ssr.md`
