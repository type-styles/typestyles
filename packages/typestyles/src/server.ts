import { startCollection, flushSync, getRegisteredCss } from './sheet';

export { getRegisteredCss };

/**
 * Collect all CSS generated during a render pass (for SSR).
 *
 * Wraps a synchronous render function and captures all CSS that would
 * normally be injected into the DOM. Returns both the render result
 * and the collected CSS string.
 *
 * For frameworks where you need the CSS separately from the render pass
 * (e.g. TanStack Start's `head()`, Next.js metadata), use the simpler
 * `getRegisteredCss()` instead.
 *
 * @example
 * ```ts
 * import { collectStyles } from 'typestyles/server';
 * import { renderToString } from 'react-dom/server';
 *
 * const { html, css } = collectStyles(() => renderToString(<App />));
 *
 * const fullHtml = `
 *   <html>
 *     <head><style id="typestyles">${css}</style></head>
 *     <body>${html}</body>
 *   </html>
 * `;
 * ```
 */
export function collectStyles<T>(renderFn: () => T): { html: T; css: string } {
  const endCollection = startCollection();

  const html = renderFn();
  flushSync();
  const css = endCollection();

  return { html, css };
}
