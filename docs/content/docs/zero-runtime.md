---
title: Zero-Runtime Build Extraction
description: How to eliminate the typestyles runtime in production and emit a static CSS file
---

Without a bundler integration, typestyles injects CSS at runtime when components render. With **`@typestyles/vite`**, you can make **production** zero-runtime by default: if the plugin finds a [convention entry file](#vite) under the project root, it resolves an extraction module and defaults to `mode: 'build'` (runtime + HMR in dev, static CSS + no client injection on `vite build`). Apps that prefer injection-only can set `mode: 'runtime'` or omit a convention entry and any `extract.modules` list.

Typestyles supports an optional **build extraction** mode through its bundler integrations. When enabled:

- All styles are extracted at build time and written to a static `.css` asset.
- The typestyles runtime is replaced with a no-op stub (`~0 bytes` when tree-shaken).
- No `<style>` injection happens in the browser — the CSS file is served directly.

The same `styles.component`, `tokens.create`, and `keyframes.create` APIs work identically in both modes.

---

## Why runtime in dev and extraction in production?

**Development:** You want instant feedback. The typestyles runtime plus the Vite plugin’s HMR hooks let you change tokens or components without running a separate Node extraction step on every save.

**Production:** You want a plain `.css` file: normal browser caching, parallel download/parse with JS, and no style injection work on the main thread after load.

The Vite plugin implements this split when at least one extraction module is resolved (explicit `extract.modules`, or an auto-discovered convention entry): it defaults to `mode: 'build'`, which **only** disables the runtime and emits CSS during `vite build`. `vite dev` keeps injection enabled.

---

## How it works

1. The bundler plugin (Vite, Rollup, Rolldown) scans your source files for typestyles imports.
2. Those modules are bundled and executed in a Node.js subprocess.
3. `getRegisteredCss()` collects all CSS that was registered during that execution.
4. The collected CSS is written as a static asset (e.g. `typestyles.css`) and linked in the HTML.
5. The `__TYPESTYLES_RUNTIME_DISABLED__` flag is defined as `"true"` so the browser bundle uses a no-op sheet that never injects CSS.

---

## Vite

Install the Vite plugin:

```bash
npm install --save-dev @typestyles/vite
```

In `vite.config.ts`, either **add a convention entry** so the plugin can discover it, or **set `extract.modules`** yourself. When at least one module resolves, **`mode` defaults to `'build'`** (runtime stays on during `vite dev`; extraction and zero-runtime apply on `vite build`).

**Convention entry (minimal config):** add a file at one of these paths (first match wins), re-exporting or importing every registration side effect — for example `src/typestyles-entry.ts` that imports your tokens and components. After the `src/…` entries, the same names are tried under a top-level `styles/` folder (common in Next.js apps without `src/`).

```text
src/typestyles-entry.ts
src/typestyles.ts
src/styles/index.ts
src/styles.ts
styles/typestyles-entry.ts
styles/typestyles.ts
```

```ts
import { defineConfig } from 'vite';
import typestyles from '@typestyles/vite';

export default defineConfig({
  plugins: [
    // Discovers src/typestyles-entry.ts (etc.); mode defaults to 'build'
    typestyles(),
  ],
});
```

**Explicit modules** (multiple entries or non-standard paths):

```ts
import { defineConfig } from 'vite';
import typestyles from '@typestyles/vite';

export default defineConfig({
  plugins: [
    typestyles({
      extract: {
        modules: ['src/styles/tokens.ts', 'src/styles/components.ts'],
        fileName: 'typestyles.css', // optional, default: "typestyles.css"
      },
    }),
  ],
});
```

Explicit modes are still available when you need them:

```ts
typestyles({
  mode: 'runtime', // force injection-only (even if extract is set)
  extract: { modules: ['src/styles/index.ts'] },
});
```

### Modes

| Mode        | Description                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"runtime"` | Default when **no** extraction modules resolve (no `extract.modules`, no discovered convention file). Injection only; no emitted CSS file.            |
| `"build"`   | Default when at least one module resolves (explicit or discovered). CSS is extracted on `vite build`; runtime disabled **only** in production builds. |
| `"hybrid"`  | CSS is extracted AND the runtime is kept (useful for dynamic styles not known at build time).                                                         |

### Linking the CSS file

Add a `<link rel="stylesheet" href="/typestyles.css" />` (or your chosen `fileName`) to `index.html` so production serves the emitted asset. During `vite dev`, that URL may not exist yet; the runtime still applies the same rules.

---

## Rollup / Rolldown

Install the Rollup plugin:

```bash
npm install --save-dev @typestyles/rollup
```

```js
// rollup.config.js
import { typestylesRollup } from '@typestyles/rollup';

export default {
  input: 'src/main.ts',
  plugins: [
    typestylesRollup({
      mode: 'build',
      extract: {
        modules: ['src/styles/index.ts'],
      },
    }),
  ],
};
```

---

## Next.js

Install the Next.js integration:

```bash
npm install --save-dev @typestyles/next
```

Use **`withTypestyles`** so behavior matches **`@typestyles/vite`**: when `NODE_ENV === 'production'` and a **convention entry file** exists under the project root (same discovery order as Vite — see the list above), the client bundle disables `<style>` injection (`withTypestylesExtract` under the hood). In **development**, the config is left unchanged so the runtime stays on (no need to branch on `NODE_ENV` yourself).

```js
// next.config.mjs
import { withTypestyles } from '@typestyles/next/build';

export default withTypestyles({
  // your existing config, e.g. transpilePackages: ['typestyles', '@typestyles/next'],
});
```

Run extraction before `next build` (CI or a `prebuild` script). **Defaults** match the Vite story: `buildTypestylesForNext({ root })` discovers a convention entry, then writes **`app/typestyles.css`** and **`app/typestyles.manifest.json`** (override with `cssOutFile`, `manifestOutFile`, or `modules` when you need a custom layout).

```ts
// scripts/typestyles-build.mts
import { buildTypestylesForNext } from '@typestyles/next/build';

await buildTypestylesForNext({ root: process.cwd() });
```

Import the emitted CSS from your App Router layout (`import './typestyles.css'`).

For full manual control, **`withTypestylesExtract`** is still available (always merges production defines). **`discoverDefaultExtractModules`** and **`DEFAULT_EXTRACT_MODULE_CANDIDATES`** are re-exported from `@typestyles/next/build` (same as `@typestyles/build-runner` / `@typestyles/vite`).

Add the `TypestylesProvider` to your root layout to handle streaming SSR (React 18 App Router):

```tsx
// app/layout.tsx
import { TypestylesProvider } from '@typestyles/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TypestylesProvider>{children}</TypestylesProvider>
      </body>
    </html>
  );
}
```

---

## Entry module requirements

The `modules` array should list files that register styles either directly or by importing other style files. A common pattern is a single `styles/index.ts` barrel file:

```ts
// src/styles/index.ts
export * from './tokens'; // tokens.create(...)
export * from './button'; // styles.component(...)
export * from './card'; // styles.component(...)
export * from './typography'; // styles.component(...)
```

```ts
// vite.config.ts
typestyles({
  extract: { modules: ['src/styles/index.ts'] },
});
```

---

## Switching between modes

Typestyles is designed for incremental migration from runtime to build extraction:

1. **Start in runtime-only mode** — omit a convention entry and any `extract.modules` (or set `mode: 'runtime'`).
2. **Add a convention entry or `extract`** — default `build` mode gives dev runtime + prod extraction in Vite.
3. **Use `hybrid`** when you need a static baseline plus runtime for dynamic values.

---

## Checking runtime disabled state

You can check whether the runtime is disabled at any point:

```ts
// The RUNTIME_DISABLED variable is defined by the bundler plugin.
// This will tree-shake to `false` in runtime mode and `true` in build mode.
declare const __TYPESTYLES_RUNTIME_DISABLED__: string | undefined;

const isStaticCSS =
  typeof __TYPESTYLES_RUNTIME_DISABLED__ !== 'undefined' &&
  __TYPESTYLES_RUNTIME_DISABLED__ === 'true';
```

---

## Limitations

- **Dynamic styles** — styles that are created based on runtime data (e.g. user-provided values) cannot be extracted at build time. Use the `hybrid` mode or keep those styles in runtime mode.
- **Lazy routes** — styles imported via dynamic `import()` in route code-splitting may not be captured unless those modules are also listed in `extract.modules`.
- **Server Components (Next.js)** — the `TypestylesProvider` handles streaming SSR for React Server Components. Ensure it is present in your root layout.
