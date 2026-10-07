import { createTypeStyles } from 'typestyles';

export const { style, recipe, tokens, global } = createTypeStyles({
  scopeId: 'typewind',
  mode: 'semantic',
  layers: {
    order: ['tokens', 'components', 'utilities'],
    token: 'tokens',
    style: 'components',
    global: 'tokens',
  },
});
