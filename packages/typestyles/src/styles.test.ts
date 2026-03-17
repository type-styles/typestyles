import { describe, it, expect, beforeEach } from 'vitest';
import { createStyles, createClass, createHashClass, compose } from './styles.js';
import { reset, flushSync } from './sheet.js';

describe('createClass', () => {
  beforeEach(() => {
    reset();
  });

  it('returns the class name string', () => {
    const card = createClass('card', { padding: '1rem', borderRadius: '8px' });
    expect(card).toBe('card');
  });

  it('injects CSS into the style sheet', () => {
    createClass('class-test', { color: 'red', fontSize: '14px' });
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    expect(style).not.toBeNull();
    const rule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === '.class-test'
    ) as CSSStyleRule;
    expect(rule).toBeDefined();
    expect(rule.style.color).toBe('red');
  });

  it('supports nested selectors', () => {
    createClass('hover-card', {
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

describe('createStyles', () => {
  beforeEach(() => {
    reset();
  });

  it('returns a selector function', () => {
    const button = createStyles('button', {
      base: { color: 'red' },
    });

    expect(typeof button).toBe('function');
  });

  it('generates class names from namespace and variant', () => {
    const button = createStyles('btn', {
      base: { color: 'red' },
      primary: { backgroundColor: 'blue' },
    });

    expect(button('base')).toBe('btn-base');
    expect(button('primary')).toBe('btn-primary');
  });

  it('composes multiple variants', () => {
    const text = createStyles('text', {
      base: { fontFamily: 'system-ui' },
      bold: { fontWeight: 700 },
      muted: { opacity: 0.7 },
    });

    expect(text('base', 'bold', 'muted')).toBe('text-base text-bold text-muted');
  });

  it('filters out falsy variants', () => {
    const card = createStyles('card', {
      base: { display: 'flex' },
      active: { borderColor: 'blue' },
      disabled: { opacity: 0.5 },
    });

    // eslint-disable-next-line no-constant-binary-expression
    expect(card('base', false && 'active', null, undefined)).toBe('card-base');
    // eslint-disable-next-line no-constant-binary-expression
    expect(card('base', true && 'active')).toBe('card-base card-active');
  });

  it('returns empty string when no variants passed', () => {
    const box = createStyles('box', {
      base: { display: 'block' },
    });

    expect(box()).toBe('');
  });

  it('injects CSS into the style sheet', () => {
    createStyles('inject-test', {
      root: { color: 'red', fontSize: '14px' },
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    expect(style).not.toBeNull();
    expect(style.sheet?.cssRules.length).toBeGreaterThan(0);

    const rule = style.sheet?.cssRules[0] as CSSStyleRule;
    expect(rule.selectorText).toBe('.inject-test-root');
  });

  it('injects nested selector rules', () => {
    createStyles('hover-test', {
      link: {
        color: 'blue',
        '&:hover': { color: 'red' },
      },
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rules = Array.from(style.sheet?.cssRules ?? []) as CSSStyleRule[];
    const selectors = rules.map((r) => r.selectorText);

    expect(selectors).toContain('.hover-test-link');
    expect(selectors).toContain('.hover-test-link:hover');
  });

  it('injects selector-list attribute rules for data/aria state', () => {
    createStyles('state-list-test', {
      trigger: {
        '[data-state="open"], [aria-expanded="true"]': { opacity: 1 },
      },
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rules = Array.from(style.sheet?.cssRules ?? []) as CSSStyleRule[];
    const selectors = rules.map((r) => r.selectorText);

    expect(selectors).toContain(
      '.state-list-test-trigger[data-state="open"], .state-list-test-trigger[aria-expanded="true"]',
    );
  });

  describe('three-argument form (base + variants)', () => {
    it('always includes base and applies variants', () => {
      const button = createStyles(
        'btn',
        { padding: '8px 16px', borderRadius: '6px' },
        {
          default: { backgroundColor: '#0066ff', color: '#fff' },
          outline: { border: '1px solid', backgroundColor: 'transparent' },
          large: { padding: '12px 24px' },
        }
      );

      expect(button()).toBe('btn-base');
      expect(button('default')).toBe('btn-base btn-default');
      expect(button('outline', 'large')).toBe('btn-base btn-outline btn-large');
    });

    it('filters falsy variants', () => {
      const button = createStyles(
        'btn2',
        { padding: '8px' },
        { primary: { color: 'blue' }, disabled: { opacity: 0.5 } }
      );

      const isDisabled = false;
      expect(button('primary', isDisabled && 'disabled')).toBe(
        'btn2-base btn2-primary'
      );
    });
  });
});

describe('createHashClass', () => {
  beforeEach(() => {
    reset();
  });

  it('returns deterministic class names for identical styles', () => {
    const a = createHashClass({ color: 'red', padding: '8px' });
    const b = createHashClass({ color: 'red', padding: '8px' });
    expect(a).toBe(b);
  });

  it('returns different class names for different styles', () => {
    const a = createHashClass({ color: 'red' });
    const b = createHashClass({ color: 'blue' });
    expect(a).not.toBe(b);
  });

  it('supports labels for readability', () => {
    const cls = createHashClass({ color: 'red' }, 'button-primary');
    expect(cls.startsWith('ts-button-primary-')).toBe(true);
  });

  it('injects CSS for the hashed selector', () => {
    const cls = createHashClass({ color: 'red', fontSize: '14px' }, 'hash-test');
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rule = Array.from(style.sheet?.cssRules ?? []).find(
      (r) => r instanceof CSSStyleRule && r.selectorText === `.${cls}`,
    ) as CSSStyleRule;
    expect(rule).toBeDefined();
    expect(rule.style.color).toBe('red');
  });
});

describe('compose', () => {
  beforeEach(() => {
    reset();
  });

  it('composes multiple SelectorFunctions with shared variants', () => {
    const base = createStyles('base', {
      root: { padding: '8px' },
    });
    const primary = createStyles('primary', {
      root: { color: 'blue' },
    });
    const button = compose(base, primary);

    expect(button('root')).toBe('base-root primary-root');
  });

  it('composes SelectorFunctions with strings', () => {
    const baseStyles = createStyles('base', {
      root: { padding: '8px' },
    });
    const composed = compose(baseStyles, 'custom-class');

    expect(composed('root')).toBe('base-root custom-class');
  });

  it('filters falsy values', () => {
    const baseStyles = createStyles('base2', {
      root: { padding: '8px' },
    });
    const composed = compose(baseStyles, false, null, undefined, 'valid');

    expect(composed('root')).toBe('base2-root valid');
  });

  it('returns empty string when all selectors return empty', () => {
    const a = createStyles('compose-a', {
      x: { color: 'red' },
    });
    const b = createStyles('compose-b', {
      y: { color: 'blue' },
    });
    const composed = compose(a, b);

    expect(composed()).toBe('');
  });

  it('handles string-only composition', () => {
    const composed = compose('class-a', 'class-b', 'class-c');

    expect(composed()).toBe('class-a class-b class-c');
  });

  it('handles mixed composition with conditional variants', () => {
    const baseStyles = createStyles('base3', {
      root: { padding: '8px' },
      active: { backgroundColor: 'blue' },
    });

    const composed = compose(baseStyles, 'extra-class');
    const isActive = true;
    const isDisabled = false;

    expect(composed('root', isActive && 'active', isDisabled && 'disabled')).toBe(
      'base3-root base3-active extra-class',
    );
  });

  it('composes multiple style groups with overlapping variants', () => {
    const layout = createStyles('layout', {
      flex: { display: 'flex' },
      block: { display: 'block' },
    });
    const spacing = createStyles('spacing', {
      flex: { gap: '8px' },
      block: { marginBottom: '8px' },
    });

    const composed = compose(layout, spacing);

    expect(composed('flex')).toBe('layout-flex spacing-flex');
    expect(composed('block')).toBe('layout-block spacing-block');
  });
});
