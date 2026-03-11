/**
 * Server-safe utilities for Next.js integration.
 * These functions can be used in Server Components without adding "use client".
 */
import { collectStyles, getRegisteredCss } from 'typestyles/server';

export { getRegisteredCss };

/**
 * Collect styles from a React component and return them as a string.
 * Useful for server components or when you need more control.
 *
 * @example
 * ```tsx
 * // app/styles.ts
 * import { collectStylesFromComponent } from '@typestyles/next/server';
 * import { YourApp } from './YourApp';
 *
 * export async function getStyles() {
 *   return collectStylesFromComponent(<YourApp />);
 * }
 * ```
 */
export async function collectStylesFromComponent(component: React.ReactElement): Promise<string> {
  const { renderToString } = await import('react-dom/server');
  const { css } = collectStyles(() => renderToString(component));
  return css;
}

/**
 * Generate CSS for use in Next.js metadata API.
 * Call this in your layout or page to get CSS for the head.
 *
 * Note: This only captures CSS registered during the synchronous render.
 * For dynamic styles that may be registered client-side, use TypestylesStylesheet.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { generateMetadata } from 'next/metadata';
 * import { getTypestylesMetadata } from '@typestyles/next/server';
 * import { Home } from './Home';
 *
 * export async function generateMetadata() {
 *   const css = await getTypestylesMetadata(<Home />);
 *   return {
 *     styles: [{ cssText: css }],
 *   };
 * }
 * ```
 */
export async function getTypestylesMetadata(component: React.ReactElement): Promise<string> {
  return collectStylesFromComponent(component);
}
