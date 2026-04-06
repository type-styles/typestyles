import { describe, it, expect, beforeEach } from 'vitest';
import { createClass, createHashClass, compose, createStylesWithUtils } from './styles.js';
import { cx } from './index.js';
import { createComponent } from './component.js';
import { defaultClassNamingConfig } from './class-naming.js';
import { reset, flushSync } from './sheet.js';
import { registeredNamespaces } from './registry.js';

describe('createClass', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('returns the class name string', () => {
    const card = createClass(defaultClassNamingConfig, 'card', {
      padding: '1rem',
      borderRadius: '8px',
    });
    expect(card).toBe('card');
  });

  it('injects CSS into the style sheet', () => {
    createClass(defaultClassNamingConfig, 'class-test', { color: 'red', fontSize: '14px' });
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    expect(style).not.toBeNull();
    const rule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === '.class-test',
    ) as CSSStyleRule;
    expect(rule).toBeDefined();
    expect(rule.style.color).toBe('red');
  });

  it('supports nested selectors', () => {
    createClass(defaultClassNamingConfig, 'hover-card', {
      padding: '1rem',
      '&:hover': { color: 'blue' },
    });
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rules = Array.from(style.sheet?.cssRules ?? []) as CSSStyleRule[];
    const selectors = rules.map((r) => r.selectorText);
    expect(selectors).toContain('.hover-card');
    expect(selectors).toContain('.hover-card:hover');
  });
});

describe('createHashClass', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('returns deterministic class names for identical styles', () => {
    const a = createHashClass(defaultClassNamingConfig, { color: 'red', padding: '8px' });
    const b = createHashClass(defaultClassNamingConfig, { color: 'red', padding: '8px' });
    expect(a).toBe(b);
  });

  it('returns different class names for different styles', () => {
    const a = createHashClass(defaultClassNamingConfig, { color: 'red' });
    const b = createHashClass(defaultClassNamingConfig, { color: 'blue' });
    expect(a).not.toBe(b);
  });

  it('supports labels for readability', () => {
    const cls = createHashClass(defaultClassNamingConfig, { color: 'red' }, 'button-primary');
    expect(cls.startsWith('ts-button-primary-')).toBe(true);
  });

  it('injects CSS for the hashed selector', () => {
    const cls = createHashClass(
      defaultClassNamingConfig,
      { color: 'red', fontSize: '14px' },
      'hash-test',
    );
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === `.${cls}`,
    ) as CSSStyleRule;
    expect(rule).toBeDefined();
    expect(rule.style.color).toBe('red');
  });
});

describe('cx', () => {
  it('joins class strings', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cx('a', false, null, undefined, '', 0, 'b')).toBe('a b');
  });

  it('returns empty string for no truthy values', () => {
    expect(cx(false, null, undefined)).toBe('');
  });

  it('works with component results', () => {
    const flags = { active: true, disabled: false };
    expect(cx('card-base', flags.active && 'active', flags.disabled && 'disabled')).toBe(
      'card-base active',
    );
  });
});

describe('compose', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('composes multiple component functions', () => {
    const base = createComponent(defaultClassNamingConfig, 'base', { base: { padding: '8px' } });
    const primary = createComponent(defaultClassNamingConfig, 'primary', {
      base: { color: 'blue' },
    });
    const button = compose(base, primary);

    expect(button()).toBe('base-base primary-base');
  });

  it('composes functions with strings', () => {
    const base = createComponent(defaultClassNamingConfig, 'base2', { base: { padding: '8px' } });
    const composed = compose(base, 'custom-class');

    expect(composed()).toBe('base2-base custom-class');
  });

  it('filters falsy values', () => {
    const base = createComponent(defaultClassNamingConfig, 'base3', { base: { padding: '8px' } });
    const composed = compose(base, false, null, undefined, 'valid');

    expect(composed()).toBe('base3-base valid');
  });

  it('handles string-only composition', () => {
    const composed = compose('class-a', 'class-b', 'class-c');
    expect(composed()).toBe('class-a class-b class-c');
  });
});

describe('createStylesWithUtils', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('expands utility keys in class()', () => {
    const u = createStylesWithUtils({
      marginX: (value: string | number) => ({ marginLeft: value, marginRight: value }),
      size: (value: string | number) => ({ width: value, height: value }),
    });

    const cls = u.class('util-class-test', {
      marginX: 16,
      size: 24,
    });

    expect(cls).toBe('util-class-test');
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === '.util-class-test',
    ) as CSSStyleRule;

    expect(rule.style.getPropertyValue('margin-left')).toBe('16px');
    expect(rule.style.getPropertyValue('margin-right')).toBe('16px');
    expect(rule.style.getPropertyValue('width')).toBe('24px');
    expect(rule.style.getPropertyValue('height')).toBe('24px');
  });

  it('expands utility keys in component() with dimensioned variants', () => {
    const u = createStylesWithUtils({
      paddingY: (value: string | number) => ({ paddingTop: value, paddingBottom: value }),
    });

    const card = u.component('util-comp', {
      base: { paddingY: 12 },
      variants: {
        size: {
          lg: { paddingY: 24 },
        },
      },
    });

    // Should be callable
    expect(card()).toContain('util-comp-base');

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === '.util-comp-base',
    ) as CSSStyleRule;

    expect(rule.style.getPropertyValue('padding-top')).toBe('12px');
    expect(rule.style.getPropertyValue('padding-bottom')).toBe('12px');
  });

  it('expands utility keys when component() uses a function config', () => {
    const u = createStylesWithUtils({
      padY: (value: string | number) => ({ paddingTop: value, paddingBottom: value }),
    });

    const box = u.component('util-fn-comp', (c) => {
      const ink = c.var('ink');
      return {
        base: { padY: 8, color: ink.var },
        variants: {
          t: {
            hi: { [ink.name]: '#f00', padY: 20 },
          },
        },
      };
    });

    expect(box({ t: 'hi' })).toContain('util-fn-comp-base');
    flushSync();
    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const baseRule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === '.util-fn-comp-base',
    ) as CSSStyleRule;
    const hiRule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === '.util-fn-comp-t-hi',
    ) as CSSStyleRule;
    expect(baseRule.style.getPropertyValue('padding-top')).toBe('8px');
    expect(hiRule.style.getPropertyValue('padding-top')).toBe('20px');
  });

  it('expands utility keys in component() with flat variants', () => {
    const u = createStylesWithUtils({
      marginX: (value: string | number) => ({ marginLeft: value, marginRight: value }),
    });

    const card = u.component('util-flat', {
      base: { marginX: 10 },
      active: { marginX: 20 },
    });

    expect(card()).toContain('util-flat-base');
    expect(card({ active: true })).toContain('util-flat-active');

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const baseRule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === '.util-flat-base',
    ) as CSSStyleRule;
    const activeRule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === '.util-flat-active',
    ) as CSSStyleRule;

    expect(baseRule.style.getPropertyValue('margin-left')).toBe('10px');
    expect(baseRule.style.getPropertyValue('margin-right')).toBe('10px');
    expect(activeRule.style.getPropertyValue('margin-left')).toBe('20px');
    expect(activeRule.style.getPropertyValue('margin-right')).toBe('20px');
  });

  it('allows utility output to include nested selectors', () => {
    const u = createStylesWithUtils({
      hoverColor: (value: string) => ({ '&:hover': { color: value } }),
    });

    u.class('util-nested-test', {
      hoverColor: 'red',
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const selectors = Array.from(style.sheet?.cssRules ?? []).map(
      (rule) => (rule as CSSStyleRule).selectorText,
    );

    expect(selectors).toContain('.util-nested-test:hover');
  });

  it('preserves declaration order so direct props can override utility output', () => {
    const u = createStylesWithUtils({
      marginX: (value: string | number) => ({ marginLeft: value, marginRight: value }),
    });

    u.class('util-order-test', {
      marginX: 8,
      marginLeft: 20,
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === '.util-order-test',
    ) as CSSStyleRule;

    expect(rule.style.getPropertyValue('margin-left')).toBe('20px');
    expect(rule.style.getPropertyValue('margin-right')).toBe('8px');
  });

  it('expands utility keys in hashClass()', () => {
    const u = createStylesWithUtils({
      size: (value: string | number) => ({ width: value, height: value }),
    });

    const cls = u.hashClass({ size: 30 }, 'avatar');
    expect(cls.startsWith('ts-avatar-')).toBe(true);

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === `.${cls}`,
    ) as CSSStyleRule;

    expect(rule.style.getPropertyValue('width')).toBe('30px');
    expect(rule.style.getPropertyValue('height')).toBe('30px');
  });
});
