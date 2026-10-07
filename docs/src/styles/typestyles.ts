import { createTypeStyles } from 'typestyles';

export const { style, recipe, tokens, global } = createTypeStyles({
  scopeId: 'docs',
  mode: 'semantic',
  layers: {
    order: ['reset', 'tokens', 'components'],
    token: 'tokens',
    style: 'components',
    global: 'reset',
  },
});
