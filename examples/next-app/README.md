# Next.js example (typestyles)

App Router example that **consumes** `@examples/react-design-system` and adds **app-level** typestyles for the demo shell (see `styles/site.ts`).

## Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Typestyles layout

- **`styles/typestyles-entry.ts`** — side-effect entry for extraction: imports the design system, then `./site`.
- **`styles/site.ts`** — `createStyles({ scopeId: 'example-app' })` and shell classes (`app-site-page`, `app-site-header`).
- **`scripts/typestyles-build.mts`** — runs `buildTypestylesForNext` with `modules: ['styles/typestyles-entry.ts']` and writes `app/typestyles.css` (+ manifest).
- **`app/layout.tsx`** — imports `./typestyles.css` (pre-built CSS). Production uses `withTypestylesExtract` in `next.config.mjs` so the client bundle does not inject a duplicate runtime stylesheet.

The home page imports `@examples/react-design-system` for `layout`, `text`, and components, and uses `tokens.createTheme` from `typestyles` for the optional “Sunset” brand override—same pattern as `examples/vite-app`.

## Learn more

- [packages/next README](../../packages/next/README.md)
