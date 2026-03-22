/**
 * @typestyles/next - Next.js integration for typestyles
 *
 * This package provides two entry points:
 *
 * 1. Main entry (this file) - Re-exports everything
 * 2. `/server` - Server-safe utilities (getRegisteredCss, collectStylesFromComponent, getTypestylesMetadata)
 * 3. `/client` - Client components (TypestylesStylesheet, useTypestyles, useServerInsertedHTML)
 * 4. `/build` - Build-time CSS extraction (`buildTypestylesForNext`, `withTypestylesExtract`)
 *
 * For App Router, prefer using the client entry for components:
 *   import { TypestylesStylesheet } from '@typestyles/next/client';
 *
 * Or use server utilities for SSR:
 *   import { getRegisteredCss } from '@typestyles/next/server';
 */

// Re-export server-safe utilities
export { getRegisteredCss, collectStylesFromComponent, getTypestylesMetadata } from './server';

// Re-export client components and hooks
export {
  TypestylesStylesheet,
  useTypestyles,
  useServerInsertedHTML,
  createTypestylesLayout,
  type TypestylesStylesheetProps,
} from './client';
