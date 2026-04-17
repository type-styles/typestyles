import { designTokens as t } from '@examples/design-system';
import { createTypeStyles } from 'typestyles';

/**
 * Application-level typestyles: page chrome only. Shared components and tokens
 * come from `@examples/react-design-system` (pulled in via `typestyles-entry.ts`).
 *
 * Uses `createTypeStyles` with the same cascade stack as `@examples/design-system`
 * so app shell classes participate in `@layer` ordering with the library. Globals
 * for the document root sit in the `tokens` layer (see `globalLayer`).
 */
const { styles, global } = createTypeStyles({
  scopeId: 'example-app',
  mode: 'semantic',
  layers: ['tokens', 'components', 'utilities'] as const,
  tokenLayer: 'tokens',
  globalLayer: 'tokens',
});

const componentLayer = { layer: 'components' } as const;

global.style('html', {
  minHeight: '100%',
  backgroundColor: t.color.background.app,
  color: t.color.text.primary,
});

export const site = {
  page: styles.class(
    'app-site-page',
    {
      maxWidth: '920px',
      margin: '0 auto',
      padding: '32px 20px',
    },
    componentLayer,
  ),
  header: styles.class(
    'app-site-header',
    {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    componentLayer,
  ),
} as const;
