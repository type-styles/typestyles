import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createComponent } from './component';
import { mergeClassNaming } from './class-naming';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { registeredNamespaces } from './registry';

const bemMode = mergeClassNaming({ mode: 'bem' });

describe('createComponent — bem-mode dimensioned variants', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('base class has no -base suffix', () => {
    const btn = createComponent(bemMode, 'button', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });
    expect(btn.base).toBe('button');
  });

  it('modifier classes have no dimension name', () => {
    const btn = createComponent(bemMode, 'button2', {
      base: { padding: '8px' },
      variants: {
        variant: { primary: { color: 'blue' }, secondary: { color: 'gray' } },
        size: { small: { fontSize: '14px' }, large: { fontSize: '18px' } },
      },
    });
    expect(btn['variant-primary']).toBe('button2--primary');
    expect(btn['size-large']).toBe('button2--large');
  });

  it('call composes block + selected modifier classes', () => {
    const btn = createComponent(bemMode, 'button3', {
      base: { padding: '8px' },
      variants: {
        variant: { primary: { color: 'blue' }, secondary: { color: 'gray' } },
        size: { small: { fontSize: '14px' }, large: { fontSize: '18px' } },
      },
      defaultVariants: { variant: 'primary', size: 'small' },
    });
    expect(btn({ variant: 'primary', size: 'large' })).toBe(
      'button3 button3--primary button3--large',
    );
    expect(btn()).toBe('button3 button3--primary button3--small');
  });

  it('has no block class at all when base is omitted', () => {
    const btn = createComponent(bemMode, 'nobase', {
      variants: { variant: { primary: { color: 'blue' } } },
    });
    expect(btn.base).toBeUndefined();
    expect(btn({ variant: 'primary' })).toBe('nobase--primary');
  });

  it('logs console.error in dev for unknown variant dimension', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const btn = createComponent(bemMode, 'unknowndim', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });
    btn({ bogus: 'x' } as unknown as Record<string, unknown>);
    expect(err).toHaveBeenCalledWith(expect.stringContaining('Unknown variant dimension "bogus"'));
    err.mockRestore();
  });

  it('warns in dev when two dimensions collide on the same modifier class', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    createComponent(bemMode, 'collide', {
      variants: {
        intent: { primary: { color: 'blue' } },
        theme: { primary: { backgroundColor: 'black' } },
      },
    });
    expect(err).toHaveBeenCalledWith(expect.stringContaining('collide--primary'));
    err.mockRestore();
  });

  it('merges colliding dimensions into one rule instead of dropping one', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    createComponent(bemMode, 'collide2', {
      variants: {
        intent: { primary: { color: 'blue' } },
        theme: { primary: { backgroundColor: 'black' } },
      },
    });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('.collide2--primary { color: blue; background-color: black; }');
    err.mockRestore();
  });

  describe('CSS emission', () => {
    it('emits block and modifier classes as independent top-level rules', () => {
      createComponent(bemMode, 'css-basic', {
        base: { padding: '8px' },
        variants: {
          variant: { primary: { color: 'blue' }, secondary: { color: 'gray' } },
        },
      });
      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('.css-basic { padding: 8px; }');
      expect(css).toContain('.css-basic--primary { color: blue; }');
      expect(css).toContain('.css-basic--secondary { color: gray; }');
    });

    it('compiles a compound variant to a chained modifier selector, no synthetic class', () => {
      const btn = createComponent(bemMode, 'css-compound', {
        variants: {
          variant: { primary: { color: 'blue' }, secondary: { color: 'gray' } },
          size: { small: { fontSize: '14px' }, large: { fontSize: '18px' } },
        },
        compoundVariants: [
          { variants: { variant: 'primary', size: 'large' }, style: { fontWeight: 700 } },
        ],
      });
      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('.css-compound--primary.css-compound--large { font-weight: 700; }');
      expect(Object.keys(btn)).not.toContain('compound-0');
    });

    it('compiles a compound variant with an array value to :is(...)', () => {
      createComponent(bemMode, 'css-compound-arr', {
        variants: {
          tone: {
            success: { color: 'green' },
            warning: { color: 'orange' },
            danger: { color: 'red' },
          },
          size: { lg: { fontSize: '18px' } },
        },
        compoundVariants: [
          {
            variants: { tone: ['success', 'warning'], size: 'lg' },
            style: { textTransform: 'uppercase' },
          },
        ],
      });
      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain(
        ':is(.css-compound-arr--success, .css-compound-arr--warning).css-compound-arr--lg { text-transform: uppercase; }',
      );
    });
  });
});
