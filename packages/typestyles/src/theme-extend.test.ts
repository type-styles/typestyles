import { describe, it, expect, beforeEach } from 'vitest';
import { reset, getRegisteredCss, flushSync } from './sheet';
import { createTypeStyles } from './create-type-styles';

describe('createTheme({ tokens })', () => {
  beforeEach(() => reset());

  it('registers token namespaces and exposes refs on ThemeSurface.tokens', () => {
    const { tokens } = createTypeStyles({ scopeId: 'ext', colorModes: ['light', 'dark'] });
    const theme = tokens.createTheme({
      name: 'brand',
      tokens: {
        brand: {
          accent: { default: { light: '#0066ff', dark: '#3399ff' } },
        },
      },
    });

    expect(theme.tokens).toBeDefined();
    expect(theme.tokens?.brand).toBeDefined();
    expect(theme.tokens?.brand.accent.default).toMatch(/var\(--/);
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('.theme-ext-brand');
    expect(css).toMatch(/--ext-brand-accent-default:\s*light-dark\(#0066ff, #3399ff\)/);
  });

  it('ensureNamespace creates once and returns use refs', () => {
    const { tokens } = createTypeStyles({ scopeId: 'ens' });
    const a = tokens.ensureNamespace('metrics', { radius: { sm: '4px' } });
    const b = tokens.ensureNamespace('metrics', { radius: { sm: '4px' } });
    expect(a.radius.sm).toBe(b.radius.sm);
    flushSync();
    expect(getRegisteredCss()).toContain('--ens-metrics-radius-sm');
  });

  it('tokens refs match ensureNamespace for the same namespace', () => {
    const { tokens } = createTypeStyles({ scopeId: 'match' });
    const ensured = tokens.ensureNamespace('brand', {
      glow: { default: '#abc' },
    });
    const theme = tokens.createTheme({
      name: 't',
      tokens: {
        brand: {
          glow: { default: '#abc' },
        },
      },
    });
    expect(theme.tokens?.brand.glow.default).toBe(ensured.glow.default);
  });

  it('merges tokens from from preset and top-level overrides', () => {
    const { tokens } = createTypeStyles({ scopeId: 'fp-ext' });
    const theme = tokens.createTheme({
      name: 'app',
      from: {
        tokens: {
          brand: { primary: '#111' },
        },
      },
      tokens: {
        brand: { accent: { default: '#0066ff' } },
      },
    });
    expect(theme.tokens?.brand.primary).toMatch(/var\(--/);
    expect(theme.tokens?.brand.accent.default).toMatch(/var\(--/);
    flushSync();
    expect(getRegisteredCss()).toContain('--fp-ext-brand-accent-default');
  });

  it('re-create theme with same name does not duplicate token namespace registration', () => {
    const { tokens } = createTypeStyles({ scopeId: 're' });
    tokens.createTheme({ name: 'x', tokens: { brand: { primary: '#111' } } });
    tokens.createTheme({ name: 'x', tokens: { brand: { primary: '#222' } } });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('#222');
    expect(css).not.toContain('#111');
  });
});
