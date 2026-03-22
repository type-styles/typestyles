import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { configureClassNaming, resetClassNaming } from './class-naming.js';
import { createStyles, createClass, createHashClass } from './styles.js';
import { createComponent } from './component.js';
import { reset, flushSync } from './sheet.js';
import { registeredNamespaces } from './registry.js';

describe('class naming modes', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
    resetClassNaming();
  });

  afterEach(() => {
    resetClassNaming();
  });

  it('semantic mode keeps readable create() class strings', () => {
    configureClassNaming({ mode: 'semantic' });
    const button = createStyles('btn', {
      base: { color: 'red' },
      primary: { backgroundColor: 'blue' },
    });
    expect(button('base', 'primary')).toBe('btn-base btn-primary');
  });

  it('hashed mode yields stable prefixed class names for create()', () => {
    configureClassNaming({ mode: 'hashed', prefix: 'app' });
    const a = createStyles('card', {
      root: { padding: '8px' },
    });
    const b = createStyles('card', {
      root: { padding: '8px' },
    });
    const ca = a('root');
    const cb = b('root');
    expect(ca).toMatch(/^app-card-/);
    expect(ca).toBe(cb);
  });

  it('scopeId changes hashed output for the same logical recipe', () => {
    configureClassNaming({ mode: 'hashed', scopeId: 'pkg-a' });
    const x = createStyles('box', { main: { margin: 0 } })('main');
    reset();
    registeredNamespaces.clear();
    resetClassNaming();
    configureClassNaming({ mode: 'hashed', scopeId: 'pkg-b' });
    const y = createStyles('box', { main: { margin: 0 } })('main');
    expect(x).not.toBe(y);
  });

  it('atomic mode omits the namespace slug in class strings', () => {
    configureClassNaming({ mode: 'atomic', prefix: 'x' });
    const button = createStyles('btn', {
      base: { color: 'red' },
    });
    expect(button('base')).toMatch(/^x-[a-z0-9]+$/);
    expect(button('base')).not.toContain('btn');
  });

  it('styles.class respects naming mode', () => {
    configureClassNaming({ mode: 'hashed', prefix: 't' });
    const cls = createClass('hero', { display: 'flex' });
    expect(cls).toMatch(/^t-hero-/);
  });

  it('createComponent resolves variant keys to hashed classes', () => {
    configureClassNaming({ mode: 'hashed', prefix: 'c' });
    const btn = createComponent('cb', {
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

  it('createHashClass stays backward compatible when scopeId is empty', () => {
    configureClassNaming({ scopeId: '' });
    const cls = createHashClass({ color: 'red' }, 'lbl');
    expect(cls.startsWith('ts-lbl-')).toBe(true);
  });

  it('createHashClass includes scopeId in the hash when set', () => {
    const a = createHashClass({ width: 10 }, 'x');
    reset();
    registeredNamespaces.clear();
    resetClassNaming();
    configureClassNaming({ scopeId: 's1' });
    const b = createHashClass({ width: 10 }, 'x');
    expect(a).not.toBe(b);
  });
});
