/**
 * Compile-only: `ThemeSurface.tokens` typing for `createTheme({ tokens })` (#234).
 */
import { createTypeStyles } from './create-type-styles';
import { createTokens } from './tokens';

const { tokens } = createTypeStyles({ scopeId: 'tc' });
const bare = createTokens({ scopeId: 'bare' });

const brand = tokens.createTheme({
  name: 'brand',
  tokens: {
    brand: {
      glow: { default: '#0066ff' },
    },
  } as const,
});

const _ref: string = brand.tokens!.brand.glow.default;
void _ref;

const bareTheme = bare.createTheme({
  name: 'brand',
  tokens: {
    brand: {
      glow: { default: '#0066ff' },
    },
  },
});
const _bareRef: string = bareTheme.tokens!.brand.glow.default;
void _bareRef;

tokens.createTheme({
  name: 'preset',
  from: {
    tokens: {
      metrics: { radius: { sm: '4px' } },
    },
  },
  tokens: {
    metrics: { radius: { lg: '8px' } },
  },
});
