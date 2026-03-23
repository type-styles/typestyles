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
 * Collect CSS by rendering a React element on the server (alias for {@link collectStylesFromComponent}).
 * Use when you need styles for a specific subtree; inject the returned string in `<head>` / layout as needed.
 *
 * Next.js `metadata` / `generateMetadata` does not support injecting arbitrary `<style>` payloads; prefer
 * {@link getRegisteredCss} in root `layout.tsx` or pipe this string into your own head/streaming pipeline.
 *
 * Note: This only captures CSS registered during that render.
 * For dynamic styles that may be registered client-side, use TypestylesStylesheet.
 *
 * @example
 * ```tsx
 * // app/some-route/head-styles.tsx (Server Component)
 * import { getTypestylesMetadata } from '@typestyles/next/server';
 * import { ProductPage } from './ProductPage';
 *
 * export async function ProductPageStyles() {
 *   const css = await getTypestylesMetadata(<ProductPage />);
 *   if (!css) return null;
 *   return <style id="typestyles-product" dangerouslySetInnerHTML={{ __html: css }} />;
 * }
 * ```
 */
export async function getTypestylesMetadata(component: React.ReactElement): Promise<string> {
  return collectStylesFromComponent(component);
}
