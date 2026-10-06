/**
 * Compile-only: `ThemeSurface.tokens` typing (#234) and `ThemeSurface.override` patches.
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

const light = {
  color: {
    brand: 'red',
    red: { 10: '#f90' },
  },
} as const;

const defaultTheme = tokens.createTheme({
  name: 'default',
  tokens: light,
  colorMode: { light, dark: { color: { brand: 'green' } } },
});

const myTheme = defaultTheme.override({
  name: 'my-theme',
  tokens: {
    color: {
      brand: 'blue',
    },
  },
});
void myTheme;

defaultTheme.override({
  name: 'mode-patch',
  colorMode: {
    dark: {
      color: {
        brand: 'navy',
      },
    },
  },
});

defaultTheme.override({
  name: 'bad-key',
  tokens: {
    color: {
      // @ts-expect-error — unknown token path under color
      nope: 'x',
    },
  },
});

defaultTheme.override({
  name: 'bad-ns',
  tokens: {
    // @ts-expect-error — unknown namespace
    space: { sm: '4px' },
  },
});
