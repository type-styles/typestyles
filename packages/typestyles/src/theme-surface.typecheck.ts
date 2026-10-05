/**
 * Compile-only: `ThemeSurface.tokens` typing for `createTheme({ extend })` (#234).
 */
import { createTypeStyles } from './create-type-styles';
import { createTokens } from './tokens';

const { tokens } = createTypeStyles({ scopeId: 'tc' });
const bare = createTokens({ scopeId: 'bare' });

const brand = tokens.createTheme(
  'brand',
  {
    extend: {
      brand: {
        glow: { default: '#0066ff' },
      },
    },
  },
  {
    components: {
      button: ({ tokens: t }) => ({
        base: { boxShadow: `0 0 12px ${t.brand.glow.default}` },
      }),
    },
  },
);

const _ref: string = brand.tokens!.brand.glow.default;
void _ref;

const bareTheme = bare.createTheme('brand', {
  extend: {
    brand: {
      glow: { default: '#0066ff' },
    },
  },
});
const _bareRef: string = bareTheme.tokens!.brand.glow.default;
void _bareRef;

tokens.createTheme('preset', {
  from: {
    extend: {
      metrics: { radius: { sm: '4px' } },
    },
  },
  patch: {
    extend: {
      metrics: { radius: { lg: '8px' } },
    },
  },
});
