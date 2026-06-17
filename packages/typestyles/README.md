# typestyles

CSS-in-TypeScript that embraces CSS instead of hiding from it.

Write type-safe styles in TypeScript, get **human-readable class names** in DevTools, use **CSS custom properties** as first-class design tokens, and adopt incrementally alongside plain CSS. No build step required for the runtime path; optional bundler plugins extract static CSS for production.

Full documentation: [typestyles.dev](https://typestyles.dev) · Monorepo overview: [README](../../README.md)

## Install

```bash
npm install typestyles
```

## Quick start

```tsx
import { styles, tokens, cx } from 'typestyles';

const color = tokens.create('color', {
  primary: '#0066ff',
  surface: '#ffffff',
});

const button = styles.component('button', {
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    backgroundColor: color.primary,
    color: color.surface,
    '&:hover': { filter: 'brightness(0.9)' },
  },
  variants: {
    intent: {
      primary: { backgroundColor: color.primary },
      ghost: { backgroundColor: 'transparent', color: color.primary },
    },
  },
  defaultVariants: { intent: 'primary' },
});

// Callable + destructurable
<button className={button({ intent: 'ghost' })} />;
// → class="button-base button-intent-ghost"
```

## Subpath exports

| Import               | Use for                                                                            |
| -------------------- | ---------------------------------------------------------------------------------- |
| `typestyles`         | `styles`, `tokens`, `cx`, `createStyles`, `createTokens`, `createVar`, …           |
| `typestyles/server`  | `collectStyles`, `getRegisteredCss`, streaming SSR helpers                         |
| `typestyles/build`   | Build-time stubs when runtime is disabled                                          |
| `typestyles/hmr`     | HMR invalidation (used by `@typestyles/vite`)                                      |
| `typestyles/color`   | Color helpers (`rgb`, `oklch`, `mix`, …) — kept off the main entry for bundle size |
| `typestyles/globals` | Ambient types for CSS modules and global augmentation                              |

## Runtime vs zero-runtime

| Mode                      | How                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Runtime (default)**     | Styles inject into a managed `<style>` tag on first use (~15 KB gzip main entry; CI enforces a budget)                                           |
| **Zero-runtime (opt-in)** | `@typestyles/vite`, `@typestyles/rollup`, `@typestyles/esbuild`, `@typestyles/webpack`, or `@typestyles/next/build` extract a static `.css` file |

Same authoring API in both modes.

## SSR

```tsx
import { collectStyles } from 'typestyles/server';

const { html, css } = await collectStyles(() => renderToString(<App />));
// Inject `css` into <head>
```

Request-safe collection uses `AsyncLocalStorage` on Node — see [SSR guide](https://typestyles.dev/docs/ssr).

## Ecosystem packages

| Package                                         | Purpose                                   |
| ----------------------------------------------- | ----------------------------------------- |
| [`@typestyles/vite`](../vite)                   | Vite — HMR + extraction                   |
| [`@typestyles/next`](../next)                   | Next.js App/Pages Router                  |
| [`@typestyles/props`](../props)                 | Typed atomic utilities                    |
| [`@typestyles/open-props`](../open-props)       | Open Props tokens                         |
| [`@typestyles/migrate`](../migrate)             | Codemods from styled-components / Emotion |
| [`@typestyles/eslint-plugin`](../eslint-plugin) | ESLint rules for style objects            |

See the [packages index](../../README.md#packages) for bundler plugins and build tooling.

## License

Apache-2.0
