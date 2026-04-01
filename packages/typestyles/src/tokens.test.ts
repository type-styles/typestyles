import { describe, it, expect, beforeEach } from 'vitest';
import { createTokens, useTokens, createTheme, createThemeContract } from './tokens.js';
import { reset, flushSync } from './sheet.js';

describe('createTokens', () => {
  beforeEach(() => {
    reset();
  });

  it('returns an object with var() references', () => {
    const color = createTokens('color', {
      primary: '#0066ff',
      secondary: '#6b7280',
    });

    expect(color.primary).toBe('var(--color-primary)');
    expect(color.secondary).toBe('var(--color-secondary)');
  });

  it('injects :root CSS with custom properties', () => {
    createTokens('spacing', {
      sm: '8px',
      md: '16px',
      lg: '24px',
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    expect(style).not.toBeNull();

    const rule = style.sheet?.cssRules[0] as CSSStyleRule;
    expect(rule.cssText).toContain('--spacing-sm');
    expect(rule.cssText).toContain('--spacing-md');
    expect(rule.cssText).toContain('--spacing-lg');
  });

  it('token values are usable as CSS strings', () => {
    const size = createTokens('size', { base: '16px' });
    // Token refs are just strings — they work wherever a CSS value is expected
    expect(typeof size.base).toBe('string');
    expect(size.base).toContain('var(');
  });
});

describe('useTokens', () => {
  beforeEach(() => {
    reset();
  });

  it('returns var() references without injecting CSS', () => {
    // Create the tokens first so the namespace exists
    createTokens('theme-color', { primary: '#000' });
    flushSync();

    const stylesBefore = document.getElementById('typestyles') as HTMLStyleElement;
    const ruleCountBefore = stylesBefore?.sheet?.cssRules.length ?? 0;

    const color = useTokens('theme-color');
    flushSync();

    const rulesAfter = stylesBefore?.sheet?.cssRules.length ?? 0;
    expect(rulesAfter).toBe(ruleCountBefore); // No new rules added

    expect(color.primary).toBe('var(--theme-color-primary)');
  });

  it('creates var() references for any property name', () => {
    const tokens = useTokens('anything');
    expect(tokens.foo).toBe('var(--anything-foo)');
    expect(tokens.bar).toBe('var(--anything-bar)');
  });
});

describe('createTheme', () => {
  beforeEach(() => {
    reset();
  });

  it('returns a theme class name', () => {
    const dark = createTheme('dark', {
      color: { primary: '#66b3ff' },
    });

    expect(dark).toBe('theme-dark');
  });

  it('injects a CSS rule with custom property overrides', () => {
    createTheme('high-contrast', {
      color: {
        primary: '#0000ff',
        text: '#000000',
      },
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rules = Array.from(style.sheet?.cssRules ?? []);
    const themeRule = rules.find(
      (r) => (r as CSSStyleRule).selectorText === '.theme-high-contrast'
    ) as CSSStyleRule;

    expect(themeRule).toBeDefined();
    expect(themeRule.cssText).toContain('--color-primary');
    expect(themeRule.cssText).toContain('--color-text');
  });
});

describe('createThemeContract', () => {
  beforeEach(() => {
    reset();
  });

  it('returns var() references like a token ref', () => {
    const contract = createThemeContract('color', {
      primary: '',
      secondary: '',
    });

    expect(contract.primary).toBe('var(--color-primary)');
    expect(contract.secondary).toBe('var(--color-secondary)');
  });

  it('does not inject any CSS', () => {
    createThemeContract('no-css', { primary: '' });
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement | null;
    expect(style).toBeNull();
  });

  it('carries contract metadata', () => {
    const contract = createThemeContract('spacing', { sm: '', md: '', lg: '' });
    expect(contract.__contract).toBe(true);
    expect(contract.__namespace).toBe('spacing');
    expect(contract.__keys).toEqual(expect.arrayContaining(['sm', 'md', 'lg']));
  });
});

describe('createTheme with contract', () => {
  beforeEach(() => {
    reset();
  });

  it('creates a theme class from a contract', () => {
    const contract = createThemeContract('color', {
      primary: '',
      surface: '',
    });

    const dark = createTheme('dark', contract, {
      primary: '#66b3ff',
      surface: '#1a1a2e',
    });

    expect(dark).toBe('theme-dark');
  });

  it('injects CSS with the correct namespace from the contract', () => {
    const contract = createThemeContract('brand', {
      accent: '',
      bg: '',
    });

    createTheme('custom', contract, {
      accent: '#ff6b35',
      bg: '#f7f7f7',
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rules = Array.from(style.sheet?.cssRules ?? []);
    const themeRule = rules.find(
      (r) => (r as CSSStyleRule).selectorText === '.theme-custom',
    ) as CSSStyleRule;

    expect(themeRule).toBeDefined();
    expect(themeRule.cssText).toContain('--brand-accent');
    expect(themeRule.cssText).toContain('--brand-bg');
  });

  it('backward-compatible: createTheme still accepts plain ThemeOverrides', () => {
    const dark = createTheme('compat', {
      color: { primary: '#66b3ff' },
    });
    expect(dark).toBe('theme-compat');
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => (r as CSSStyleRule).selectorText === '.theme-compat',
    ) as CSSStyleRule;
    expect(rule.cssText).toContain('--color-primary');
  });
});
