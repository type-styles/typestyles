import { describe, it, expect, beforeEach } from 'vitest';
import { createStyles } from './styles.js';
import { reset, flushSync } from './sheet.js';
import { registeredNamespaces } from './registry.js';

describe('class naming modes', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('semantic mode keeps readable component() class strings', () => {
    const styles = createStyles({ mode: 'semantic' });
    const button = styles.component('btn', {
      base: { color: 'red' },
      primary: { backgroundColor: 'blue' },
    });
    expect(button.base).toBe('btn-base');
    expect(button.primary).toBe('btn-primary');
  });

  it('hashed mode yields stable prefixed class names for component()', () => {
    const styles = createStyles({ mode: 'hashed', prefix: 'app' });
    const a = styles.component('card', {
      root: { padding: '8px' },
    });
    registeredNamespaces.clear();
    const b = styles.component('card', {
      root: { padding: '8px' },
    });
    expect(a.root).toMatch(/^app-card-/);
    expect(a.root).toBe(b.root);
  });

  it('scopeId changes hashed output for the same logical component styles', () => {
    const sa = createStyles({ mode: 'hashed', scopeId: 'pkg-a' });
    const x = sa.component('box', { main: { margin: 0 } }).main;
    reset();
    registeredNamespaces.clear();
    const sb = createStyles({ mode: 'hashed', scopeId: 'pkg-b' });
    const y = sb.component('box', { main: { margin: 0 } }).main;
    expect(x).not.toBe(y);
  });

  it('atomic mode omits the namespace slug in class strings', () => {
    const styles = createStyles({ mode: 'atomic', prefix: 'x' });
    const button = styles.component('btn', {
      base: { color: 'red' },
    });
    expect(button.base).toMatch(/^x-[a-z0-9]+$/);
    expect(button.base).not.toContain('btn');
  });

  it('styles.class respects naming mode', () => {
    const styles = createStyles({ mode: 'hashed', prefix: 't' });
    const cls = styles.class('hero', { display: 'flex' });
    expect(cls).toMatch(/^t-hero-/);
  });

  it('createComponent resolves variant keys to hashed classes', () => {
    const styles = createStyles({ mode: 'hashed', prefix: 'c' });
    const btn = styles.component('cb', {
      base: { padding: '4px' },
      variants: {
        intent: {
          primary: { color: 'blue' },
        },
      },
    });
    const out = btn({ intent: 'primary' });
    expect(out).toMatch(/c-cb-/);
    expect(out).not.toContain('cb-intent-primary');
    flushSync();
    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const parts = out.split(' ');
    for (const p of parts) {
      const found = Array.from(style.sheet?.cssRules ?? []).some(
        (r) => r instanceof CSSStyleRule && r.selectorText === `.${p}`,
      );
      expect(found, `selector .${p}`).toBe(true);
    }
  });

  it('createHashClass uses default prefix when scopeId is empty', () => {
    const styles = createStyles({ scopeId: '' });
    const cls = styles.hashClass({ color: 'red' }, 'lbl');
    expect(cls.startsWith('ts-lbl-')).toBe(true);
  });

  it('createHashClass includes scopeId in the hash when set', () => {
    const sa = createStyles();
    const a = sa.hashClass({ width: 10 }, 'x');
    reset();
    registeredNamespaces.clear();
    const sb = createStyles({ scopeId: 's1' });
    const b = sb.hashClass({ width: 10 }, 'x');
    expect(a).not.toBe(b);
  });
});
