import { describe, it, expect, beforeEach } from 'vitest';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { createTypeStyles } from './create-type-styles';

describe('createTypeStyles', () => {
  beforeEach(() => {
    reset();
  });

  it('createTypeStyles({ mode: "attribute" }) returns an attrs-returning recipe API', () => {
    const { recipe } = createTypeStyles({ mode: 'attribute', scopeId: 'cts-attr' });
    const btn = recipe('tbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });
    expect(btn({ variant: 'primary' }).attrs).toEqual({ 'data-variant': 'primary' });
  });

  it('exposes flat style/recipe/global surface with nested layers defaults', () => {
    const { style, recipe, global } = createTypeStyles({
      scopeId: 'flat',
      layers: {
        order: ['reset', 'tokens', 'components'],
        token: 'tokens',
        style: 'components',
        global: 'reset',
      },
    });
    style('card', { padding: '1rem' });
    recipe('btn', { base: { color: 'red' } });
    global.rules({ body: { margin: 0 } });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toMatch(/@layer components/);
    expect(css).toMatch(/@layer reset/);
    expect(css).toContain('padding: 1rem');
    expect(css).toContain('body { margin: 0');
  });
});
