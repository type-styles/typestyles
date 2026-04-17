import { createTypeStyles } from 'typestyles';

export const { styles, tokens, global } = createTypeStyles({
  scopeId: 'typewind',
  mode: 'semantic',
  layers: ['tokens', 'components', 'utilities'] as const,
  tokenLayer: 'tokens',
  globalLayer: 'tokens',
});
