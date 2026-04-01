import { describe, it, expect, beforeEach } from 'vitest';
import { collectStyles, createUseServerInsertedHTML } from './server.js';
import { resetClassNaming } from './class-naming.js';
import { createStyles } from './styles.js';
import { createTokens } from './tokens.js';
import { reset } from './sheet.js';

describe('collectStyles', () => {
  beforeEach(() => {
    reset();
    resetClassNaming();
  });

  it('collects CSS from styles created during render', () => {
    const { html, css } = collectStyles(() => {
      createStyles('ssr-btn', {
        base: { color: 'red' },
      });
      return '<button class="ssr-btn-base">Click</button>';
    });

    expect(html).toBe('<button class="ssr-btn-base">Click</button>');
    expect(css).toContain('.ssr-btn-base');
    expect(css).toContain('color: red');
  });

  it('collects CSS from tokens created during render', () => {
    const { css } = collectStyles(() => {
      createTokens('ssr-color', { primary: '#0066ff' });
      return '';
    });

    expect(css).toContain('--ssr-color-primary');
    expect(css).toContain('#0066ff');
  });

  it('collects both tokens and styles', () => {
    const { css } = collectStyles(() => {
      const color = createTokens('ssr-theme', { bg: '#fff' });
      createStyles('ssr-card', {
        root: { backgroundColor: color.bg },
      });
      return '';
    });

    expect(css).toContain('--ssr-theme-bg');
    expect(css).toContain('.ssr-card-root');
  });
});

describe('createUseServerInsertedHTML', () => {
  beforeEach(() => {
    reset();
    resetClassNaming();
  });

  it('returns null when no styles have been registered', () => {
    const getNewCSS = createUseServerInsertedHTML();
    expect(getNewCSS()).toBeNull();
  });

  it('returns CSS registered before the first call', () => {
    createStyles('stream-btn', { base: { color: 'red' } });

    const getNewCSS = createUseServerInsertedHTML();
    const css = getNewCSS();

    expect(css).not.toBeNull();
    expect(css).toContain('.stream-btn-base');
    expect(css).toContain('color: red');
  });

  it('returns only new CSS on subsequent calls (incremental)', () => {
    createStyles('first', { base: { color: 'red' } });

    const getNewCSS = createUseServerInsertedHTML();

    const chunk1 = getNewCSS();
    expect(chunk1).toContain('.first-base');

    // Register more styles (simulating a Suspense boundary resolving)
    createStyles('second', { base: { color: 'blue' } });

    const chunk2 = getNewCSS();
    expect(chunk2).toContain('.second-base');
    expect(chunk2).not.toContain('.first-base'); // already emitted

    // No more styles — should return null
    expect(getNewCSS()).toBeNull();
  });

  it('each call to createUseServerInsertedHTML is independent', () => {
    createStyles('shared', { base: { display: 'flex' } });

    const getCSS1 = createUseServerInsertedHTML();
    const getCSS2 = createUseServerInsertedHTML();

    // Both start at index 0 — both return the same first chunk
    expect(getCSS1()).toContain('.shared-base');
    expect(getCSS2()).toContain('.shared-base');
  });
});

