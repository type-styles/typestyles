import { describe, it, expect, beforeEach } from 'vitest';
import { reset, getRegisteredCss, flushSync } from './sheet';
import { createTypeStyles } from './create-type-styles';

describe('createTheme({ components })', () => {
  beforeEach(() => {
    reset();
  });

  it('applies scoped overrides for registered namespaces', () => {
    const { styles, tokens } = createTypeStyles({ scopeId: 'tc' });
    styles.component('button', {
      base: { color: 'black' },
      variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },
    });

    const theme = tokens.createTheme('brand', {
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

  it('throws in dev for unknown namespace', () => {
    const { tokens } = createTypeStyles({ scopeId: 'tc2' });
    expect(() =>
      tokens.createTheme('x', {
        components: { ghost: { base: { color: 'red' } } },
      }),
    ).toThrow(/unknown component namespace "ghost"/);
  });
});
