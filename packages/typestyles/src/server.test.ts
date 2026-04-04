import { describe, it, expect, beforeEach } from 'vitest';
import { collectStyles } from './server.js';
import { defaultClassNamingConfig } from './class-naming.js';
import { createComponent } from './component.js';
import { createTokens } from './tokens.js';
import { reset } from './sheet.js';

describe('collectStyles', () => {
  beforeEach(() => {
    reset();
  });

  it('collects CSS from styles created during render', () => {
    const { html, css } = collectStyles(() => {
      createComponent(defaultClassNamingConfig, 'ssr-btn', {
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
      createTokens().create('ssr-color', { primary: '#0066ff' });
      return '';
    });

    expect(css).toContain('--ssr-color-primary');
    expect(css).toContain('#0066ff');
  });

  it('collects both tokens and styles', () => {
    const { css } = collectStyles(() => {
      const color = createTokens().create('ssr-theme', { bg: '#fff' });
      createComponent(defaultClassNamingConfig, 'ssr-card', {
        root: { backgroundColor: color.bg },
      });
      return '';
    });

    expect(css).toContain('--ssr-theme-bg');
    expect(css).toContain('.ssr-card-root');
  });
});
