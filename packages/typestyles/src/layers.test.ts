import { describe, it, expect, beforeEach } from 'vitest';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { createStyles } from './styles';
import { createTokens } from './tokens';
import { createTypeStyles } from './create-type-styles';
import { resolveCascadeLayers } from './layers';

describe('cascade layers', () => {
  beforeEach(() => {
    reset();
  });

  it('emits @layer preamble before wrapped rules and orders bootstrap first when prepended', () => {
    const styles = createStyles({
      scopeId: 'ds',
      layers: { order: ['reset', 'components'] as const, prependFrameworkLayers: ['bootstrap'] },
    });

    styles.class('box', { margin: 0 }, { layer: 'reset' });
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('@layer bootstrap, reset, components;');
    const preambleIdx = css.indexOf('@layer bootstrap, reset, components;');
    const wrappedIdx = css.indexOf('@layer reset');
    expect(preambleIdx).toBeLessThan(wrappedIdx);
    expect(css).toContain('@layer reset');
    expect(css).toContain('.box');
  });

  it('requires layer on class when layers are enabled', () => {
    const styles = createStyles({
      layers: ['a', 'b'] as const,
    });
    expect(() => {
      (styles as { class(n: string, p: { color: string }): string }).class('x', { color: 'red' });
    }).toThrow(/layer/);
  });

  it('rejects unknown layer names', () => {
    const styles = createStyles({
      layers: ['reset', 'utilities'] as const,
    });
    expect(() => {
      styles.class('x', { color: 'red' }, { layer: 'unknown' as 'reset' });
    }).toThrow(/Invalid/);
  });

  it('wraps component rules in the given layer', () => {
    const styles = createStyles({
      layers: ['components'] as const,
    });
    styles.component(
      'btn',
      {
        base: { padding: '8px' },
        variants: {
          size: { sm: { fontSize: '12px' } },
        },
        defaultVariants: { size: 'sm' },
      },
      { layer: 'components' },
    );
    flushSync();
    const css = getRegisteredCss();
    expect(css).toMatch(/@layer components/);
    expect(css).toContain('btn-base');
  });

  it('layered component: function config + internal vars uses dimensioned overload (intent selection types)', () => {
    const styles = createStyles({
      scopeId: 'layer-fn',
      layers: ['components'] as const,
    });
    const btn = styles.component(
      'layered-fn-btn',
      (c) => {
        const v = c.vars({
          fg: { value: '#111', syntax: '<color>', inherits: false },
        });
        return {
          base: { color: v.fg.var },
          variants: {
            intent: {
              primary: { [v.fg.name]: '#fff', backgroundColor: '#336699' },
              ghost: { [v.fg.name]: '#222', backgroundColor: 'transparent' },
            },
          },
          defaultVariants: { intent: 'ghost' as const },
        };
      },
      { layer: 'components' },
    );
    const classes = btn({ intent: 'primary' });
    expect(classes).toContain('layered-fn-btn');
    flushSync();
    expect(getRegisteredCss()).toContain('@layer components');
  });

  it('createTokens emits :root inside tokenLayer', () => {
    createTokens({
      scopeId: 'app',
      layers: ['tokens', 'components'] as const,
      tokenLayer: 'tokens',
    }).create('color', { primary: '#336699' });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@layer tokens');
    expect(css).toContain(':root');
    expect(css).toContain('--app-color-primary');
  });

  it('createTypeStyles shares stack between styles and tokens', () => {
    const { styles, tokens } = createTypeStyles({
      scopeId: 'ds',
      layers: ['tokens', 'components'] as const,
      tokenLayer: 'tokens',
    });
    tokens.create('space', { md: '16px' });
    styles.class('card', { padding: '8px' }, { layer: 'components' });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@layer tokens, components;');
    expect(css).toContain('@layer tokens');
    expect(css).toContain('@layer components');
  });

  it('tokens.create can override tokenLayer', () => {
    const { tokens } = createTypeStyles({
      scopeId: 'ov',
      layers: ['tokens', 'components'] as const,
      tokenLayer: 'tokens',
    });
    tokens.create('space', { md: '8px' });
    tokens.create('radius', { sm: '4px' }, { layer: 'components' });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toMatch(/@layer tokens[\s\S]*:root/);
    expect(css).toMatch(/@layer components[\s\S]*:root/);
    expect(css).toContain('--ov-space-md');
    expect(css).toContain('--ov-radius-sm');
  });

  it('resolveCascadeLayers throws on duplicate layer names', () => {
    expect(() => resolveCascadeLayers(['a', 'a'], undefined)).toThrow(/Duplicate/);
  });
});
