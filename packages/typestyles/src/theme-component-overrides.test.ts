import { describe, it, expect, beforeEach } from 'vitest';
import { reset, getRegisteredCss, flushSync } from './sheet';
import { createTypeStyles } from './create-type-styles';

describe('createTheme({ components })', () => {
  beforeEach(() => {
    reset();
  });

  it('applies scoped overrides for registered namespaces', () => {
    const { recipe, tokens } = createTypeStyles({ scopeId: 'tc' });
    recipe('button', {
      base: { color: 'black' },
      variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },
    });

    const theme = tokens.createTheme({
      name: 'brand',
      components: {
        button: {
          base: { color: 'rebeccapurple' },
        },
      },
    });
    flushSync();

    const css = getRegisteredCss();
    expect(theme.className).toBe('theme-tc-brand');
    expect(css).toContain('.theme-tc-brand');
    expect(css).toMatch(/rebeccapurple/);
  });

  it('accepts components on the theme input object', () => {
    const { recipe, tokens } = createTypeStyles({ scopeId: 'tc3' });
    recipe('button', { base: { color: 'black' } });

    tokens.createTheme({
      name: 'brand',
      tokens: { fontSize: { md: '14px' } },
      components: {
        button: { base: { color: 'rebeccapurple' } },
      },
    });
    flushSync();
    expect(getRegisteredCss()).toMatch(/rebeccapurple/);
  });

  it('throws in dev for unknown namespace', () => {
    const { tokens } = createTypeStyles({ scopeId: 'tc2' });
    expect(() =>
      tokens.createTheme({
        name: 'x',
        components: { ghost: { base: { color: 'red' } } },
      }),
    ).toThrow(/unknown component namespace "ghost"/);
  });
});
