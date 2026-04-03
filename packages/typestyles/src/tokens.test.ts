import { describe, it, expect, beforeEach } from 'vitest';
import { createTokens, useTokens, createTheme } from './tokens.js';
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
    expect(typeof size.base).toBe('string');
    expect(size.base).toContain('var(');
  });

  it('supports nested token objects', () => {
    const color = createTokens('color', {
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
    const color = createTokens('color', {
      brand: {
        primary: { DEFAULT: '#0066ff', hover: '#0052cc' },
      },
    });

    expect(color.brand.primary.DEFAULT).toBe('var(--color-brand-primary-DEFAULT)');
    expect(color.brand.primary.hover).toBe('var(--color-brand-primary-hover)');
  });

  it('supports flat values alongside nested objects', () => {
    const tokens = createTokens('test', {
      simple: 'value',
      nested: { key: 'nested-value' },
    });

    expect(tokens.simple).toBe('var(--test-simple)');
    expect(tokens.nested.key).toBe('var(--test-nested-key)');
  });
});

describe('useTokens', () => {
  beforeEach(() => {
    reset();
  });

  it('returns var() references without injecting CSS', () => {
    createTokens('theme-color', { primary: '#000' });
    flushSync();

    const stylesBefore = document.getElementById('typestyles') as HTMLStyleElement;
    const ruleCountBefore = stylesBefore?.sheet?.cssRules.length ?? 0;

    const color = useTokens('theme-color');
    flushSync();

    const rulesAfter = stylesBefore?.sheet?.cssRules.length ?? 0;
    expect(rulesAfter).toBe(ruleCountBefore);

    expect(color.primary).toBe('var(--theme-color-primary)');
  });

  it('creates var() references for any property name', () => {
    const tokens = useTokens('anything');
    expect(tokens.foo).toBe('var(--anything-foo)');
    expect(tokens.bar).toBe('var(--anything-bar)');
  });

  it('supports nested access for useTokens when tokens are created first', () => {
    createTokens('color', { text: { primary: '#000' } });
    flushSync();
    const tokens = useTokens('color');
    expect(tokens.text.primary).toBe('var(--color-text-primary)');
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
      (r) => (r as CSSStyleRule).selectorText === '.theme-high-contrast',
    ) as CSSStyleRule;

    expect(themeRule).toBeDefined();
    expect(themeRule.cssText).toContain('--color-primary');
    expect(themeRule.cssText).toContain('--color-text');
  });

  it('supports nested structures in createTheme', () => {
    createTheme('dark', {
      color: {
        text: { primary: '#e0e0e0', secondary: '#a1a1aa' },
        background: { surface: '#1a1a2e', subtle: '#262640' },
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
