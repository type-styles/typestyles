import { describe, it, expect, beforeEach } from 'vitest';
import { invalidatePrefix, invalidateKeys, createOverrideHmrSlot } from './hmr';
import { createStyles } from './styles';
import { registeredNamespaces } from './registry';
import {
  insertRule,
  flushSync,
  reset,
  invalidateComponentNamespaceForDev,
  invalidateClassNamespaceForDev,
  getRegisteredCss,
} from './sheet';

describe('invalidatePrefix', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('allows re-insertion of rules after invalidating by prefix', () => {
    insertRule('.button-base', '.button-base { color: red; }');
    insertRule('.button-primary', '.button-primary { color: blue; }');
    insertRule('.card-base', '.card-base { display: flex; }');
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    expect(style.sheet?.cssRules.length).toBe(3);

    // Invalidate button- styles
    invalidatePrefix('.button-');

    // Re-insert with updated values
    insertRule('.button-base', '.button-base { color: green; }');
    insertRule('.button-primary', '.button-primary { color: yellow; }');
    flushSync();

    // card-base (1 original) + button-base + button-primary (2 re-inserted)
    expect(style.sheet?.cssRules.length).toBe(3);

    // Verify updated rules are present
    const rules = Array.from(style.sheet?.cssRules ?? []) as CSSStyleRule[];
    const buttonBase = rules.find((r) => r.selectorText === '.button-base');
    expect(buttonBase).toBeDefined();
  });

  it('does not affect rules with a different prefix', () => {
    insertRule('.button-base', '.button-base { color: red; }');
    insertRule('.card-base', '.card-base { display: flex; }');
    flushSync();

    invalidatePrefix('.button-');

    // card-base should still be deduped
    insertRule('.card-base', '.card-base { display: block; }');
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    // Only card-base remains (button was removed), no duplicate card
    expect(style.sheet?.cssRules.length).toBe(1);
    const rule = style.sheet?.cssRules[0] as CSSStyleRule;
    expect(rule.selectorText).toBe('.card-base');
  });
});

describe('invalidateKeys', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('invalidates exact keys', () => {
    insertRule('tokens:color', ':root { --color-primary: #0066ff; }');
    insertRule('keyframes:fadeIn', '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }');
    flushSync();

    invalidateKeys(['tokens:color'], []);

    // tokens:color should be re-insertable
    insertRule('tokens:color', ':root { --color-primary: #ff0000; }');
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    // keyframes (1 original) + tokens (1 re-inserted)
    expect(style.sheet?.cssRules.length).toBe(2);
  });

  it('invalidates both keys and prefixes together', () => {
    insertRule('.button-base', '.button-base { color: red; }');
    insertRule('tokens:color', ':root { --color-primary: #0066ff; }');
    flushSync();

    invalidateKeys(['tokens:color'], ['.button-']);

    // Both should be re-insertable
    insertRule('.button-base', '.button-base { color: green; }');
    insertRule('tokens:color', ':root { --color-primary: #ff0000; }');
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    expect(style.sheet?.cssRules.length).toBe(2);
  });

  it('does nothing with empty arrays', () => {
    insertRule('.button-base', '.button-base { color: red; }');
    flushSync();

    invalidateKeys([], []);

    // Rule should still be deduped
    insertRule('.button-base', '.button-base { color: green; }');
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    expect(style.sheet?.cssRules.length).toBe(1);
  });

  it('invalidates semantic class family at boundaries without touching prefix siblings', () => {
    insertRule('.button', '.button { color: red; }');
    insertRule('.button--intent-primary', '.button--intent-primary { color: blue; }');
    insertRule('.button__icon', '.button__icon { width: 1rem; }');
    insertRule('.button[data-size="lg"]', '.button[data-size="lg"] { padding: 16px; }');
    insertRule('.buttongroup', '.buttongroup { display: flex; }');
    insertRule('.button-group', '.button-group { gap: 8px; }');
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    expect(style.sheet?.cssRules.length).toBe(6);

    invalidateComponentNamespaceForDev('button', 'button');

    const selectors = Array.from(style.sheet?.cssRules ?? []).map(
      (r) => (r as CSSStyleRule).selectorText,
    );
    expect(selectors.sort()).toEqual(['.button-group', '.buttongroup']);
  });

  it('preserves styles.override rules when a component namespace is invalidated', () => {
    const styles = createStyles();
    const button = styles.component('hmr-ov-btn', {
      base: { color: 'black' },
      variants: { intent: { primary: { color: 'blue' } } },
    });
    styles.override(button, {
      base: { borderRadius: '999px' },
      variants: { intent: { primary: { textTransform: 'uppercase' } } },
    });
    flushSync();

    invalidateComponentNamespaceForDev('hmr-ov-btn', 'hmr-ov-btn');
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('border-radius: 999px');
    expect(css).toContain('text-transform: uppercase');
    expect(css).toContain('.hmr-ov-btn {');
    expect(css).toContain('.hmr-ov-btn--intent-primary {');
    // Recipe rules were dropped; only override CSS remains for those selectors.
    expect(css).not.toContain('color: black');
    expect(css).not.toContain('color: blue');
  });

  it('updates styles.override CSS when the same keys are re-registered with new values', () => {
    const styles = createStyles();
    const button = styles.component('hmr-ov-replace', {
      base: { color: 'black' },
    });
    styles.override(button, { base: { borderRadius: '4px' } });
    flushSync();
    expect(getRegisteredCss()).toContain('border-radius: 4px');

    styles.override(button, { base: { borderRadius: '999px' } });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('border-radius: 999px');
    expect(css).not.toContain('border-radius: 4px');
  });

  it('upserts conflicting override rules even when NODE_ENV is production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const styles = createStyles();
      const button = styles.component('hmr-ov-prod', {
        base: { color: 'black' },
      });
      styles.override(button, { base: { borderRadius: '4px' } });
      flushSync();
      styles.override(button, { base: { borderRadius: '999px' } });
      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('border-radius: 999px');
      expect(css).not.toContain('border-radius: 4px');
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('dispose does not drop sibling override rules that share attribute substrings', () => {
    const styles = createStyles({ mode: 'attribute' });
    const button = styles.component('hmr-ov-attr', {
      base: { color: 'black' },
      variants: {
        intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
      },
    });

    const themeA = createOverrideHmrSlot();
    themeA.activate();
    styles.override(
      button,
      { variants: { intent: { primary: { textTransform: 'uppercase' } } } },
      { selectorPrefix: '.theme-a' },
    );
    themeA.deactivate();

    const themeB = createOverrideHmrSlot();
    themeB.activate();
    styles.override(
      button,
      { variants: { intent: { primary: { fontWeight: 700 } } } },
      { selectorPrefix: '.theme-b' },
    );
    themeB.deactivate();
    flushSync();

    expect(getRegisteredCss()).toContain('.theme-a .hmr-ov-attr[data-intent="primary"]');
    expect(getRegisteredCss()).toContain('.theme-b .hmr-ov-attr[data-intent="primary"]');

    themeA.dispose();
    flushSync();

    const css = getRegisteredCss();
    expect(css).not.toContain('text-transform: uppercase');
    expect(css).toContain('.theme-b .hmr-ov-attr[data-intent="primary"]');
    expect(css).toContain('font-weight: 700');
    // Recipe CSS remains.
    expect(css).toContain('color: black');
  });

  it('dispose of an override HMR slot drops tracked override rules (theme module HMR)', () => {
    const styles = createStyles();
    const button = styles.component('hmr-ov-slot', {
      base: { color: 'black' },
      variants: { intent: { primary: { color: 'blue' } } },
    });

    const slot = createOverrideHmrSlot();
    slot.activate();
    styles.override(
      button,
      { base: { borderRadius: '999px' }, variants: { intent: { primary: { fontWeight: 700 } } } },
      { selectorPrefix: '.theme-acme' },
    );
    slot.deactivate();
    flushSync();

    expect(getRegisteredCss()).toContain('.theme-acme .hmr-ov-slot');
    expect(getRegisteredCss()).toContain('border-radius: 999px');

    slot.dispose();
    flushSync();

    const css = getRegisteredCss();
    expect(css).not.toContain('border-radius: 999px');
    expect(css).not.toContain('font-weight: 700');
    // Recipe CSS from styles.component is untouched.
    expect(css).toContain('color: black');
    expect(css).toContain('color: blue');
  });

  it('invalidates styles.class rules without dropping component modifiers', () => {
    insertRule('.button', '.button { color: red; }');
    insertRule('.button--intent-primary', '.button--intent-primary { color: blue; }');
    insertRule('.button:hover', '.button:hover { opacity: 0.9; }');
    insertRule('.button-group', '.button-group { gap: 8px; }');
    flushSync();

    invalidateClassNamespaceForDev('button');

    const selectors = Array.from(
      (document.getElementById('typestyles') as HTMLStyleElement).sheet?.cssRules ?? [],
    ).map((r) => (r as CSSStyleRule).selectorText);
    expect(selectors.sort()).toEqual(['.button--intent-primary', '.button-group']);
  });

  it('releases component namespace reservations so the same module can re-register (HMR)', () => {
    const styles = createStyles({ scopeId: 'docs' });
    styles.component('docs-sidebar', { base: { color: 'red' } });

    invalidateKeys([], ['.docs-sidebar-']);

    expect(() => styles.component('docs-sidebar', { base: { color: 'blue' } })).not.toThrow();
  });
});
