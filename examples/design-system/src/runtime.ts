import { createTypeStyles } from 'typestyles';

/**
 * Single factory: shared scope and optional cascade layer stack for classes + tokens.
 * Omit `layers` for flat CSS (default); enable layers when integrating with global CSS
 * that uses `@layer`.
 */
export const { styles, tokens } = createTypeStyles({
  scopeId: 'example-ds',
  mode: 'semantic',
  // layers: ['tokens', 'components', 'utilities'] as const,
  // tokenLayer: 'tokens',
});
