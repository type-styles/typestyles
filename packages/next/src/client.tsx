'use client';

import React, { useState, useEffect, useServerInsertedHTML, useSyncExternalStore } from 'react';
import { getRegisteredCss } from 'typestyles/server';

/**
 * Subscribe to typestyles CSS changes. Use this in client components
 * that need to stay up-to-date with dynamically registered styles.
 *
 * @example
 * ```tsx
 * // components/Styles.tsx
 * 'use client';
 * import { useTypestyles } from '@typestyles/next/client';
 *
 * export function Styles() {
 *   useTypestyles();
 *   return null;
 * }
 * ```
 */
export function useTypestyles() {
  return useSyncExternalStore(
    () => () => {},
    () => getRegisteredCss(),
    () => '',
  );
}

/**
 * Collect styles during server rendering for App Router.
 * Use this in a Client Component wrapper that collects styles from its children.
 *
 * @example
 * ```tsx
 * // components/TypestylesProvider.tsx
 * 'use client';
 *
 * import { useServerInsertedHTML, getRegisteredCss } from '@typestyles/next/client';
 *
 * export function TypestylesProvider({ children }: { children: React.ReactNode }) {
 *   useServerInsertedHTML(() => {
 *     return (
 *       <style
 *         id="typestyles"
 *         dangerouslySetInnerHTML={{ __html: getRegisteredCss() }}
 *       />
 *     );
 *   });
 *   return <>{children}</>;
 * }
 * ```
 */
export { useServerInsertedHTML };

/**
 * Props for the TypestylesStylesheet component.
 */
export interface TypestylesStylesheetProps {
  /**
   * The children to render (styles will be collected from these).
   * If not provided, only the existing registered CSS will be included.
   */
  children?: React.ReactNode;
}

/**
 * A React component that renders typestyles CSS.
 *
 * For App Router: Use this in your root layout to collect and render styles.
 * Works with both Client Components and React Server Components.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { TypestylesStylesheet } from '@typestyles/next/client';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <TypestylesStylesheet />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */
export function TypestylesStylesheet({ children }: TypestylesStylesheetProps) {
  const [css, setCss] = useState('');

  useServerInsertedHTML(() => {
    const registeredCss = getRegisteredCss();
    if (registeredCss) {
      return <style id="typestyles" dangerouslySetInnerHTML={{ __html: registeredCss }} />;
    }
    return null;
  });

  useEffect(() => {
    setCss(getRegisteredCss());
  }, []);

  if (children) {
    return (
      <>
        {children}
        <style id="typestyles-client" dangerouslySetInnerHTML={{ __html: css }} />
      </>
    );
  }

  return null;
}

/**
 * Create a Next.js layout export that includes typestyles.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { createTypestylesLayout } from '@typestyles/next/client';
 *
 * export default createTypestylesLayout(function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <title>My App</title>
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * });
 * ```
 */
export function createTypestylesLayout<P extends { children?: React.ReactNode }>(
  layout: (props: P) => React.ReactNode,
): (props: P) => React.ReactNode {
  return function TypestylesLayout(props: P) {
    return <TypestylesStylesheet>{layout(props)}</TypestylesStylesheet>;
  };
}
