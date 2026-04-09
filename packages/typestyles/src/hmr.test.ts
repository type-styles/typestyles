import { describe, it, expect, beforeEach } from 'vitest';
import { invalidatePrefix, invalidateKeys } from './hmr';
import { createStyles } from './styles';
import { registeredNamespaces } from './registry';
import { insertRule, flushSync, reset } from './sheet';

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

  it('releases component namespace reservations so the same module can re-register (HMR)', () => {
    const styles = createStyles({ scopeId: 'docs' });
    styles.component('docs-sidebar', { base: { color: 'red' } });

    invalidateKeys([], ['.docs-sidebar-']);

    expect(() => styles.component('docs-sidebar', { base: { color: 'blue' } })).not.toThrow();
  });
});
