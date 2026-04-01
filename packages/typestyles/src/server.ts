import { startCollection, flushSync, getRegisteredCss } from './sheet.js';

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

/**
 * Create a `useServerInsertedHTML` callback compatible with React 18+
 * streaming SSR (`renderToPipeableStream`, `renderToReadableStream`).
 *
 * React 18's streaming renderer allows Suspense boundaries to stream
 * chunks of HTML as they resolve. Each chunk may render new typestyles
 * styles. `createUseServerInsertedHTML` produces a callback that:
 *
 * 1. Tracks which CSS rules have already been flushed.
 * 2. On every call (once per streaming flush), returns **only** the new
 *    rules since the last flush, wrapped in a `<style>` element.
 * 3. Returns `null` when there is nothing new to inject.
 *
 * Pass the returned function directly to `useServerInsertedHTML` from
 * `next/navigation` (Next.js App Router) or to a similar framework hook.
 *
 * **Usage with Next.js App Router (recommended)**
 *
 * Wrap your root layout's `<body>` with the provider from
 * `@typestyles/next`, which wires this up automatically:
 *
 * ```tsx
 * // app/layout.tsx
 * import { TypestylesProvider } from '@typestyles/next';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <TypestylesProvider>{children}</TypestylesProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * **Low-level usage (custom server or framework)**
 *
 * ```tsx
 * import { createUseServerInsertedHTML } from 'typestyles/server';
 * import { useServerInsertedHTML } from 'next/navigation'; // or your framework's hook
 *
 * function TypestylesProvider({ children }: { children: React.ReactNode }) {
 *   const getInsertedHTML = createUseServerInsertedHTML();
 *
 *   useServerInsertedHTML(() => {
 *     const styles = getInsertedHTML();
 *     if (!styles) return null;
 *     return <style id="typestyles" dangerouslySetInnerHTML={{ __html: styles }} />;
 *   });
 *
 *   return <>{children}</>;
 * }
 * ```
 *
 * @returns A stateful function that, when called repeatedly, returns only
 *   the CSS rules generated since the previous call (or `null` if none).
 */
export function createUseServerInsertedHTML(): () => string | null {
  // Track how many rules from allRules have already been emitted so that each
  // streaming chunk only emits newly-generated CSS, not the full stylesheet.
  let lastEmittedIndex = 0;

  return function getNewCSS(): string | null {
    // Synchronously flush any pending rules into allRules before reading.
    flushSync();
    const allCss = getRegisteredCss();
    if (!allCss) return null;

    // Split into individual rules by newline (each rule is on its own line).
    const rules = allCss.split('\n').filter(Boolean);
    if (rules.length <= lastEmittedIndex) return null;

    const newRules = rules.slice(lastEmittedIndex);
    lastEmittedIndex = rules.length;

    return newRules.join('\n');
  };
}

