import { describe, it, expect, beforeEach } from 'vitest';
import { createTokens } from './tokens';
import { createTheme } from './theme';
import { reset, flushSync } from './sheet';

describe('createTokens factory', () => {
  it('exposes scopeId on the instance', () => {
    expect(createTokens().scopeId).toBeUndefined();
    expect(createTokens({ scopeId: 'ds' }).scopeId).toBe('ds');
  });

  it('prefixes CSS variable namespaces when scopeId is set', () => {
    const t = createTokens({ scopeId: 'my-pkg' });
    const color = t.create('color', { primary: '#0066ff' });
    expect(color.primary).toBe('var(--my-pkg-color-primary)');
  });
});

describe('tokens.create', () => {
  beforeEach(() => {
    reset();
  });

  it('returns an object with var() references', () => {
    const api = createTokens();
    const color = api.create('color', {
      primary: '#0066ff',
      secondary: '#6b7280',
    });

    expect(color.primary).toBe('var(--color-primary)');
    expect(color.secondary).toBe('var(--color-secondary)');
  });

  it('injects :root CSS with custom properties', () => {
    const api = createTokens();
    api.create('spacing', {
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
    const api = createTokens();
    const size = api.create('size', { base: '16px' });
    expect(typeof size.base).toBe('string');
    expect(size.base).toContain('var(');
  });

  it('supports nested token objects', () => {
    const api = createTokens();
    const color = api.create('color', {
      text: { primary: '#111827', secondary: '#6b7280' },
      background: { surface: '#ffffff', subtle: '#f9fafb' },
      border: { default: '#e5e7eb' },
    });

    expect(color.text.primary).toBe('var(--color-text-primary)');
    expect(color.text.secondary).toBe('var(--color-text-secondary)');
    expect(color.background.surface).toBe('var(--color-background-surface)');
    expect(color.background.subtle).toBe('var(--color-background-subtle)');
    expect(color.border.default).toBe('var(--color-border-default)');

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rule = style.sheet?.cssRules[0] as CSSStyleRule;
    expect(rule.cssText).toContain('--color-text-primary');
    expect(rule.cssText).toContain('--color-background-surface');
    expect(rule.cssText).toContain('--color-border-default');
  });

  it('supports deeply nested token objects', () => {
    const api = createTokens();
    const color = api.create('color', {
      brand: {
        primary: { DEFAULT: '#0066ff', hover: '#0052cc' },
      },
    });

    expect(color.brand.primary.DEFAULT).toBe('var(--color-brand-primary-DEFAULT)');
    expect(color.brand.primary.hover).toBe('var(--color-brand-primary-hover)');
  });

  it('supports flat values alongside nested objects', () => {
    const api = createTokens();
    const tokens = api.create('test', {
      simple: 'value',
      nested: { key: 'nested-value' },
    });

    expect(tokens.simple).toBe('var(--test-simple)');
    expect(tokens.nested.key).toBe('var(--test-nested-key)');
  });
});

describe('tokens.use', () => {
  beforeEach(() => {
    reset();
  });

  it('returns var() references without injecting CSS', () => {
    const api = createTokens();
    api.create('theme-color', { primary: '#000' });
    flushSync();

    const stylesBefore = document.getElementById('typestyles') as HTMLStyleElement;
    const ruleCountBefore = stylesBefore?.sheet?.cssRules.length ?? 0;

    const color = api.use('theme-color');
    flushSync();

    const rulesAfter = stylesBefore?.sheet?.cssRules.length ?? 0;
    expect(rulesAfter).toBe(ruleCountBefore);

    expect(color.primary).toBe('var(--theme-color-primary)');
  });

  it('creates var() references for any property name', () => {
    const api = createTokens();
    const tokens = api.use('anything');
    expect(tokens.foo).toBe('var(--anything-foo)');
    expect(tokens.bar).toBe('var(--anything-bar)');
  });

  it('supports nested access for useTokens when tokens are created first', () => {
    const api = createTokens();
    api.create('color', { text: { primary: '#000' } });
    flushSync();
    const tokens = api.use('color');
    expect(tokens.text.primary).toBe('var(--color-text-primary)');
  });
});

describe('createTheme', () => {
  beforeEach(() => {
    reset();
  });

  it('returns a ThemeSurface with className and name', () => {
    const dark = createTheme('dark', {
      base: { color: { primary: '#66b3ff' } },
    });

    expect(dark.className).toBe('theme-dark');
    expect(dark.name).toBe('dark');
  });

  it('coerces to className via toString and Symbol.toPrimitive', () => {
    const acme = createTheme('acme', {
      base: { color: { primary: '#111' } },
    });

    expect(String(acme)).toBe('theme-acme');
    expect(`wrapper ${acme}`).toBe('wrapper theme-acme');
    expect(acme.toString()).toBe('theme-acme');
  });

  it('injects a CSS rule with custom property overrides', () => {
    createTheme('high-contrast', {
      base: {
        color: {
          primary: '#0000ff',
          text: '#000000',
        },
      },
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rules = Array.from(style.sheet?.cssRules ?? []);
    const themeRule = rules.find(
      (r) => (r as CSSStyleRule).selectorText === '.theme-high-contrast',
    ) as CSSStyleRule;

    expect(themeRule).toBeDefined();
    expect(themeRule.cssText).toContain('--color-primary');
    expect(themeRule.cssText).toContain('--color-text');
  });

  it('supports nested structures in createTheme', () => {
    createTheme('dark', {
      base: {
        color: {
          text: { primary: '#e0e0e0', secondary: '#a1a1aa' },
          background: { surface: '#1a1a2e', subtle: '#262640' },
        },
      },
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rules = Array.from(style.sheet?.cssRules ?? []);
    const themeRule = rules.find(
      (r) => (r as CSSStyleRule).selectorText === '.theme-dark',
    ) as CSSStyleRule;

    expect(themeRule).toBeDefined();
    expect(themeRule.cssText).toContain('--color-text-primary');
    expect(themeRule.cssText).toContain('--color-text-secondary');
    expect(themeRule.cssText).toContain('--color-background-surface');
    expect(themeRule.cssText).toContain('--color-background-subtle');
  });
});
