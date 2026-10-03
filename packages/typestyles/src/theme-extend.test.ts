import { describe, it, expect, beforeEach } from 'vitest';
import { reset, getRegisteredCss, flushSync } from './sheet';
import { createTypeStyles } from './create-type-styles';

describe('createTheme({ extend })', () => {
  beforeEach(() => reset());

  it('registers extend namespaces and exposes refs on ThemeSurface.tokens', () => {
    const { tokens } = createTypeStyles({ scopeId: 'ext', colorModes: ['light', 'dark'] });
    const theme = tokens.createTheme('brand', {
      extend: {
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

  it('re-create theme with same name does not duplicate extend namespace registration', () => {
    const { tokens } = createTypeStyles({ scopeId: 're' });
    tokens.createTheme('x', { extend: { brand: { primary: '#111' } } });
    tokens.createTheme('x', { extend: { brand: { primary: '#222' } } });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('#222');
    expect(css).not.toContain('#111');
  });
});
