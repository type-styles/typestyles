---
title: Zero-Runtime Build Extraction
description: How to eliminate the typestyles runtime in production and emit a static CSS file
---

# Zero-Runtime Build Extraction

By default, typestyles injects CSS at runtime when components render. This has minimal overhead but some performance-sensitive applications prefer to ship **zero JavaScript for styling** — generating a static CSS file at build time just like CSS Modules or Vanilla Extract.

Typestyles supports an optional **build extraction** mode through its bundler integrations. When enabled:

- All styles are extracted at build time and written to a static `.css` asset.
- The typestyles runtime is replaced with a no-op stub (`~0 bytes` when tree-shaken).
- No `<style>` injection happens in the browser — the CSS file is served directly.

The same `styles.create`, `tokens.create`, and `keyframes.create` APIs work identically in both modes.

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

In `vite.config.ts`, set `mode: 'build'` and list the modules that register styles:

```ts
import { defineConfig } from 'vite';
import { typestyles } from '@typestyles/vite';

export default defineConfig({
  plugins: [
    typestyles({
      mode: 'build', // 'runtime' (default) | 'build' | 'hybrid'
      extract: {
        // List all entry files that import and register typestyles styles.
        // Any transitive imports are automatically included.
        modules: ['src/styles/tokens.ts', 'src/styles/components.ts'],
        fileName: 'typestyles.css', // optional, default: "typestyles.css"
      },
    }),
  ],
});
```

### Modes

| Mode        | Description                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| `"runtime"` | Default. CSS is injected at runtime via `<style>`. No CSS file emitted.                       |
| `"build"`   | CSS is extracted at build time to a `.css` asset. Runtime injection is disabled.              |
| `"hybrid"`  | CSS is extracted AND the runtime is kept (useful for dynamic styles not known at build time). |

### Linking the CSS file

In `build` mode, Vite automatically injects a `<link rel="stylesheet">` for the generated `typestyles.css`. No extra configuration is needed when using a standard Vite HTML template.

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

Wrap your Next.js config with `withTypestylesExtract`:

```js
// next.config.js
import { withTypestylesExtract } from '@typestyles/next/build';

export default withTypestylesExtract({
  // Your existing Next.js config
});
```

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
export * from './button'; // styles.create(...)
export * from './card'; // styles.create(...)
export * from './typography'; // styles.create(...)
```

```ts
// vite.config.ts
typestyles({
  mode: 'build',
  extract: { modules: ['src/styles/index.ts'] },
});
```

---

## Switching between modes

Typestyles is designed for incremental migration from runtime to build extraction:

1. **Start in runtime mode** (default) — zero configuration, works everywhere.
2. **Switch specific routes to build mode** — use the `hybrid` mode to extract styles for your critical path while keeping runtime injection for the rest.
3. **Go fully static** — once all styles are covered by your entry modules, switch to `build` mode.

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
