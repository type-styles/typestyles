import { createTypeStyles } from 'typestyles';

/**
 * Single factory: shared scope and optional cascade layer stack for classes + tokens.
 * Omit `layers` for flat CSS (default); enable layers when integrating with global CSS
 * that uses `@layer`.
 */
export const { styles, tokens, global } = createTypeStyles({
  scopeId: 'example-ds',
  mode: 'semantic',
  layers: ['tokens', 'components', 'utilities'] as const,
  tokenLayer: 'tokens',
  /** Baseline globals (e.g. `body`) share the token layer so they cascade with `:root` theme CSS. */
  globalLayer: 'tokens',
});

/**
 * Self-hosted Space Grotesk (Latin, wght 300–700) from each host’s `public/fonts/`.
 * Root-relative `url('/fonts/…')` matches Astro, Vite, and Next static serving and typestyles extract.
 */
global.fontFace('Space Grotesk', {
  src: "url('/fonts/space-grotesk-latin.woff2') format('woff2')",
  fontWeight: '300 700',
  fontStyle: 'normal',
  fontDisplay: 'swap',
  unicodeRange:
    'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
});
