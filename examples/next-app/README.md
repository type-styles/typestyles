# Next.js example (typestyles)

App Router example that **consumes** [`@examples/react-design-system`](../react-design-system) and adds **app-level** typestyles for the demo shell (`styles/site.ts`).

Demonstrates **`@typestyles/next/build`**: pre-build extraction, manifest + verification, `withTypestyles` for dev runtime / prod zero-runtime.

## Run

From the monorepo root:

```bash
pnpm next-app dev
```

Or from this directory:

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs **`typestyles:build`** first (writes `app/typestyles.css`), then `next dev`. Open [http://localhost:3000](http://localhost:3000).

Production build (includes verification):

```bash
pnpm build   # typestyles:build → typestyles:verify → next build
```

## What this demonstrates

| Topic                               | Where                                                             |
| ----------------------------------- | ----------------------------------------------------------------- |
| Convention entry (no `src/` prefix) | `styles/typestyles-entry.ts`                                      |
| Pre-build extraction                | `scripts/typestyles-build.mts` → `buildTypestylesForNext`         |
| CI verification                     | `scripts/verify-typestyles.mts` → `verifyTypestylesBuild`         |
| Static CSS in layout                | `app/layout.tsx` imports `./typestyles.css`                       |
| Prod runtime disabled               | `next.config.mjs` → `withTypestyles`                              |
| Scoped app shell                    | `styles/site.ts` → `createTypeStyles({ scopeId: 'example-app' })` |
| Brand theme override                | `app/page.tsx` → `tokens.createTheme` (“Sunset”)                  |

Same design-system consumption pattern as [`examples/vite-app`](../vite-app/README.md).

## Typestyles layout

```text
styles/typestyles-entry.ts   # imports react-design-system + ./site
styles/site.ts               # app shell (scoped createTypeStyles)
scripts/typestyles-build.mts # extraction before next build
scripts/verify-typestyles.mts
app/typestyles.css           # generated — do not hand-edit
app/typestyles.manifest.json # generated manifest for verify step
app/layout.tsx               # links extracted CSS
next.config.mjs              # withTypestyles()
```

### Dev vs production

- **Development:** `withTypestyles` leaves the client runtime enabled so you can iterate without re-running extraction on every save (CSS file is refreshed when you run `typestyles:build` or `pnpm dev`).
- **Production:** when the convention entry exists, client `<style>` injection is disabled and the pre-built `app/typestyles.css` is served.

## Learn more

- [`@typestyles/next` README](../../packages/next/README.md)
- [`@typestyles/build-runner` README](../../packages/build-runner/README.md) — `verifyTypestylesBuild`
- [Zero-runtime extraction](https://typestyles.dev/docs/zero-runtime)
