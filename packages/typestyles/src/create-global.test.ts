import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { createGlobal } from './create-global';
import { createTypeStyles } from './create-type-styles';
import { boxSizing, body } from './globals';

describe('createGlobal', () => {
  beforeEach(() => {
    reset();
  });

  it('inserts unlayered rules when layers are omitted', () => {
    const g = createGlobal();
    g.style('body', { margin: 0 });
    flushSync();
    expect(getRegisteredCss()).toContain('body { margin: 0');
    expect(getRegisteredCss()).not.toMatch(/@layer/);
  });

  it('wraps rules in @layer when layers are set', () => {
    const g = createGlobal({
      layers: ['reset', 'components'] as const,
      globalLayer: 'reset',
    });
    g.style('body', { margin: 0 });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@layer reset, components;');
    expect(css).toMatch(/@layer reset\s*\{/);
    expect(css).toContain('body { margin: 0');
  });

  it('requires layer when no globalLayer', () => {
    const g = createGlobal({ layers: ['reset', 'components'] as const });
    expect(() => {
      g.style('body', { margin: 0 });
    }).toThrow(/globalLayer/);
    g.style('body', { margin: 0 }, { layer: 'reset' });
    flushSync();
    expect(getRegisteredCss()).toContain('body { margin: 0');
  });

  it('scopeId allows a second body rule alongside unscoped createGlobal (separate dedupe keys)', () => {
    const scoped = createGlobal({ scopeId: 'app' });
    scoped.style('body', { margin: 0 });
    const unscoped = createGlobal();
    unscoped.style('body', { padding: 0 });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toMatch(/body \{ margin: 0/);
    expect(css).toMatch(/body \{ padding: 0/);
  });

  it('warns when layer is passed without layers', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const g = createGlobal();
    g.style('p', { color: 'red' }, { layer: 'reset' });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('createTypeStyles().global accepts globals recipes as tuples', () => {
    const { global } = createTypeStyles({
      scopeId: 't',
      layers: ['reset', 'tokens', 'components'] as const,
      tokenLayer: 'tokens',
      globalLayer: 'reset',
    });
    global.style(boxSizing());
    global.style(body({ margin: 0 }));
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@layer reset, tokens, components;');
    expect(css).toContain('box-sizing: border-box');
    expect(css).toContain('body { margin: 0');
  });

  it('recipe tuple can override globalLayer', () => {
    const { global } = createTypeStyles({
      layers: ['reset', 'tokens', 'components'] as const,
      tokenLayer: 'tokens',
      globalLayer: 'reset',
    });
    global.style(body({ margin: 0 }, { layer: 'components' }));
    flushSync();
    const css = getRegisteredCss();
    expect(css).toMatch(/@layer components/);
    expect(css).toContain('body { margin: 0');
  });

  it('createTypeStyles rejects globalLayer without layers', () => {
    expect(() => {
      createTypeStyles({ scopeId: 'x', globalLayer: 'reset' } as never);
    }).toThrow(/globalLayer/);
  });
});
