import './sheet-node';
import { startCollection, flushSync, getRegisteredCss, subscribeRegisteredCss } from './sheet';
import { runWithIsolatedSheet } from './sheet-context';

export { getRegisteredCss, subscribeRegisteredCss };

export type CollectStylesResult<T> = { html: T; css: string };

/**
 * Collect all CSS generated during a render pass (for SSR).
 *
 * Wraps a render function and captures all CSS registered while it runs.
 * On Node, each call uses an isolated sheet store (`AsyncLocalStorage`) so
 * concurrent SSR requests do not interleave CSS. Sync and async render
 * functions are supported.
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
export function collectStyles<T>(renderFn: () => T): CollectStylesResult<T>;
export function collectStyles<T>(renderFn: () => Promise<T>): Promise<CollectStylesResult<T>>;
export function collectStyles<T>(
  renderFn: () => T | Promise<T>,
): CollectStylesResult<T> | Promise<CollectStylesResult<T>> {
  return runWithIsolatedSheet(() => {
    const endCollection = startCollection();
    const result = renderFn();
    if (result instanceof Promise) {
      return result.then((html) => {
        flushSync();
        return { html, css: endCollection() };
      });
    }
    flushSync();
    return { html: result, css: endCollection() };
  });
}
