---
title: Server-Side Rendering (SSR)
description: Render typestyles on the server for better performance and SEO
---

# Server-Side Rendering (SSR)

TypeStyles supports SSR out of the box. Instead of injecting styles into the DOM during rendering, you can collect all the CSS on the server and include it in the HTML response.

## Basic setup

Import `collectStyles` from `typestyles/server`:

```ts
import { collectStyles } from 'typestyles/server';
import { renderToString } from 'react-dom/server';

const { html, css } = collectStyles(() => renderToString(<App />));
```

The `collectStyles` function:

1. Starts collecting CSS instead of injecting it
2. Runs your render function
3. Returns the rendered HTML and collected CSS

## Full example

Here's a complete Express.js example:

```ts
import express from 'express';
import { collectStyles } from 'typestyles/server';
import { renderToString } from 'react-dom/server';
import { App } from './App';

const app = express();

app.get('/', (req, res) => {
  const { html, css } = collectStyles(() => renderToString(<App />));

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>My App</title>
        <style id="typestyles">${css}</style>
      </head>
      <body>
        <div id="root">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
});

app.listen(3000);
```

## How it works

During SSR:

1. **Collection mode**: When `collectStyles()` wraps your render, TypeStyles switches to collection mode
2. **CSS capture**: All styles, tokens, themes, and keyframes are captured to a buffer instead of being injected into the DOM
3. **Single style tag**: The collected CSS is returned as a single string ready to embed in your HTML

On the client:

1. **Hydration detection**: TypeStyles looks for an existing `<style id="typestyles">` element
2. **Reuse**: If found, it reuses that element and avoids re-injecting the CSS
3. **Seamless transition**: No flicker or style recalculation during hydration

## Next.js

Install the official integration so App Router, `useServerInsertedHTML`, and server helpers stay aligned:

```bash
pnpm add @typestyles/next typestyles
```

See the [`@typestyles/next` package README](https://github.com/dbanksdesign/typestyles/tree/main/packages/next) for build-time extraction (`withTypestylesExtract`) and Turbopack notes.

### App Router (recommended)

**Option A — server layout + `getRegisteredCss`:** simplest when your typestyles modules are loaded on the server before layout runs. Outputs the full registered stylesheet (everything in `allRules` after imports and any sync registration).

```tsx
// app/layout.tsx
import { getRegisteredCss } from '@typestyles/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const css = getRegisteredCss();

  return (
    <html lang="en">
      <head>
        {css ? <style id="typestyles" dangerouslySetInnerHTML={{ __html: css }} /> : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Option B — `TypestylesStylesheet` (client):** uses Next’s `useServerInsertedHTML` so CSS collected during the real SSR pass is injected into the streamed document. Prefer this when you rely on the same render tree as `{children}` (for example lazy boundaries or patterns where Option A would miss rules).

```tsx
// app/layout.tsx
import { TypestylesStylesheet } from '@typestyles/next/client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TypestylesStylesheet />
        {children}
      </body>
    </html>
  );
}
```

**Subtree-only CSS (advanced):** `collectStylesFromComponent` / `getTypestylesMetadata` from `@typestyles/next/server` run `renderToString` on a specific element and return CSS registered during that pass. Use when you intentionally scope extraction to a component tree; you still need to place the returned string in `<head>` yourself (Next `metadata` cannot carry arbitrary `<style>` bodies).

### Pages Router

Wrap the page tree with `TypestylesStylesheet` so collection lines up with what Next renders:

```tsx
// pages/_app.tsx
import { TypestylesStylesheet } from '@typestyles/next';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <TypestylesStylesheet>
      <Component {...pageProps} />
    </TypestylesStylesheet>
  );
}
```

Custom `pages/_document.tsx` with `collectStyles(() => ctx.renderPage())` is fragile because `renderPage` can be asynchronous and does not return a React element. Prefer the `_app` pattern above unless you maintain a custom synchronous pipeline.

## Remix

`renderToString(<RemixServer />)` usually returns your `app/root.tsx` tree, which in the default template already includes `<head>…</head>`. Collect CSS from that same render, inject the tag before `</head>`, then prefix `<!DOCTYPE html>` if the string does not already include it:

```tsx
// app/entry.server.tsx
import type { EntryContext } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { renderToString } from 'react-dom/server';
import { collectStyles } from 'typestyles/server';

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const { html, css } = collectStyles(() =>
    renderToString(<RemixServer context={remixContext} url={request.url} />),
  );

  responseHeaders.set('Content-Type', 'text/html; charset=utf-8');

  if (!html.includes('</head>')) {
    throw new Error(
      'typestyles SSR: expected </head> in Remix output. Ensure app/root.tsx renders a <head> (default Remix template does).',
    );
  }

  let documentHtml = html.replace('</head>', `<style id="typestyles">${css}</style></head>`);
  if (!documentHtml.trimStart().toLowerCase().startsWith('<!doctype')) {
    documentHtml = `<!DOCTYPE html>${documentHtml}`;
  }

  return new Response(documentHtml, { status: responseStatusCode, headers: responseHeaders });
}
```

**Streaming:** the stock Remix `entry.server.tsx` uses `renderToPipeableStream` and never builds a single HTML string, so the pattern above targets **synchronous** document responses (for example the bot path in Remix’s default entry, or a custom non-streaming entry). To keep streaming, you still need a strategy for CSS: a prior `collectStyles(() => renderToString(<RemixServer … />))` pass, build-time CSS extraction, or adapting the streaming pipeline—see [Remix streaming](https://remix.run/docs/en/main/guides/streaming) and [entry.server](https://remix.run/docs/en/main/file-conventions/entry.server).

## Streaming SSR (Express / Node)

You need CSS before the streamed shell is sent. That usually means **one synchronous `renderToString` pass** inside `collectStyles`, then a **second** pass with `renderToPipeableStream` for the same UI (two renders, same trade-off as above).

Open your HTML shell (including `<style id="typestyles">…</style>`) **before** `pipe(res)`, then finish the document when React says the stream is done. Exact callbacks depend on whether you use Suspense—see [React `renderToPipeableStream`](https://react.dev/reference/react-dom/server/renderToPipeableStream).

```tsx
import { renderToString, renderToPipeableStream } from 'react-dom/server';
import type { Response } from 'express';
import { collectStyles } from 'typestyles/server';

app.get('/', (req, res: Response) => {
  const { css } = collectStyles(() => renderToString(<App />));

  const { pipe } = renderToPipeableStream(<App />, {
    onShellReady() {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.write(
        `<!DOCTYPE html><html><head><meta charset="utf-8"/><style id="typestyles">${css}</style></head><body>`,
      );
      pipe(res);
    },
    onShellError(error) {
      res.statusCode = 500;
      console.error(error);
      res.end();
    },
  });
});
```

If your shell opens wrappers around `<App />`, add the matching closing tags in the appropriate callback (`onAllReady` when streaming deferred content, or follow the full pattern in the React docs) so you never write to `res` after it has ended.

## Important considerations

### Style deduplication

TypeStyles automatically deduplicates CSS during collection. If multiple components use the same style variant, it's only included once in the output.

### Critical CSS

All CSS is included by default. For large applications, you might want to implement critical CSS extraction (only including styles for above-the-fold content). This isn't built into TypeStyles—you'd need to implement it at the framework level.

### Client-side hydration

Always use the same `id="typestyles"` on both server and client:

```html
<!-- Server -->
<style id="typestyles">
  ${css}
</style>

<!-- Client finds and reuses this element -->
```

If the IDs don't match, you'll get duplicate styles.

### Memory and cleanup

`collectStyles()` manages collection state automatically. After the render function completes and CSS is collected, the internal state is reset. You don't need to manually clean up.

## Troubleshooting

### Styles missing in SSR output

Make sure you're actually rendering components that use typestyles during the `collectStyles()` call. If styles are defined but the component isn't rendered, no CSS will be generated.

### Styles appearing twice

This happens when the client can't find the server-rendered style tag:

1. Check that the `id` is exactly `"typestyles"`
2. Make sure the style tag is present in the initial HTML
3. Verify no ad blockers or CSP are interfering

### Flash of unstyled content (FOUC)

If you see FOUC:

1. Ensure styles are in the `<head>`, not the body
2. Check that the CSS string isn't empty
3. Verify that `collectStyles()` wraps the actual component render, not just an empty render
