import { createTypeStyles } from 'typestyles';

export const { styles, tokens, global } = createTypeStyles({
  scopeId: 'docs',
  mode: 'semantic',
  layers: ['reset', 'tokens', 'components'] as const,
  tokenLayer: 'tokens',
  globalLayer: 'reset',
});
