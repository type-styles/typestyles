import { describe, it, expect, beforeEach } from 'vitest';
import { configureLayer, reset, flushSync, getRegisteredCss } from './sheet.js';
import { resetClassNaming } from './class-naming.js';
import { createStyles } from './styles.js';
import { createTokens } from './tokens.js';
import { collectStyles } from './server.js';

describe('configureLayer', () => {
  beforeEach(() => {
    reset();
    resetClassNaming();
  });

  it('wraps injected CSS rules in the named layer', () => {
    configureLayer('ui');
    createStyles('btn', { base: { color: 'red' } });
    flushSync();

    const css = getRegisteredCss();
    // Layer declaration must come first
    expect(css).toContain('@layer ui;');
    // Each rule is wrapped in the layer block
    expect(css).toContain('@layer ui {');
    expect(css).toContain('.btn-base');
  });

  it('uses "typestyles" as the default layer name', () => {
    configureLayer();
    createStyles('card', { root: { padding: '8px' } });
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('@layer typestyles;');
    expect(css).toContain('@layer typestyles {');
  });

  it('wraps token :root rules in the layer', () => {
    configureLayer('ui');
    createTokens('color', { primary: '#0066ff' });
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('@layer ui {');
    expect(css).toContain('--color-primary');
  });

  it('emits unwrapped rules when no layer is configured', () => {
    createStyles('plain', { base: { display: 'flex' } });
    flushSync();

    const css = getRegisteredCss();
    expect(css).not.toContain('@layer');
    expect(css).toContain('.plain-base');
  });

  it('emits the layer declaration before any rules (SSR)', () => {
    configureLayer('ui');
    const { css } = collectStyles(() => {
      createStyles('ssr-btn', { base: { color: 'blue' } });
      return '';
    });

    const layerDeclIndex = css.indexOf('@layer ui;');
    const ruleIndex = css.indexOf('@layer ui {');
    expect(layerDeclIndex).toBeGreaterThanOrEqual(0);
    expect(ruleIndex).toBeGreaterThan(layerDeclIndex);
  });

  it('reset clears the layer configuration', () => {
    configureLayer('ui');
    reset();
    createStyles('after-reset', { base: { color: 'green' } });
    flushSync();

    const css = getRegisteredCss();
    expect(css).not.toContain('@layer');
  });
});
