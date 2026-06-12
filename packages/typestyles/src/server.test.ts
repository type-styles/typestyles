import { describe, it, expect, beforeEach } from 'vitest';
import { collectStyles } from './server';
import { defaultClassNamingConfig } from './class-naming';
import { createComponent } from './component';
import { createTokens } from './tokens';
import { insertRule, reset } from './sheet';

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

  it('supports async render functions', async () => {
    const { html, css } = await collectStyles(async () => {
      await Promise.resolve();
      createComponent(defaultClassNamingConfig, 'async-btn', {
        base: { color: 'green' },
      });
      return '<button>async</button>';
    });

    expect(html).toBe('<button>async</button>');
    expect(css).toContain('.async-btn-base');
    expect(css).toContain('color: green');
  });

  it('isolates concurrent async collectStyles on Node', async () => {
    const [a, b] = await Promise.all([
      collectStyles(async () => {
        await new Promise((resolve) => setTimeout(resolve, 15));
        insertRule('.iso-a', '.iso-a { color: red; }');
        return 'a';
      }),
      collectStyles(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        insertRule('.iso-b', '.iso-b { color: blue; }');
        return 'b';
      }),
    ]);

    expect(a.html).toBe('a');
    expect(a.css).toContain('.iso-a');
    expect(a.css).not.toContain('.iso-b');

    expect(b.html).toBe('b');
    expect(b.css).toContain('.iso-b');
    expect(b.css).not.toContain('.iso-a');
  });
});
