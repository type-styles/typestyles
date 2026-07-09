import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createComponent } from './component';
import { mergeClassNaming } from './class-naming';
import { createStyles } from './styles';
import { cx } from './cx';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { registeredNamespaces } from './registry';

const attributeMode = mergeClassNaming({ mode: 'attribute' });

describe('createComponent — attribute-mode dimensioned variants', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('returns a callable function', () => {
    const btn = createComponent(attributeMode, 'attrbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });
    expect(typeof btn).toBe('function');
  });

  it('exposes only the base class — no per-option destructurable keys', () => {
    const btn = createComponent(attributeMode, 'noopt', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });
    expect(btn.base).toBe('noopt-base');
    expect(Object.keys(btn)).toEqual(['base']);
  });

  it('resolves className, attrs, and props for a single dimension', () => {
    const btn = createComponent(attributeMode, 'sbtn', {
      base: { padding: '8px' },
      variants: {
        variant: {
          primary: { backgroundColor: 'blue' },
          secondary: { backgroundColor: 'gray' },
        },
      },
    });

    const b = btn({ variant: 'primary' });
    expect(b.className).toBe('sbtn-base');
    expect(b.attrs).toEqual({ 'data-variant': 'primary' });
    expect(b.props).toEqual({ className: 'sbtn-base', 'data-variant': 'primary' });
  });

  it('resolves className, attrs, and props for multiple dimensions', () => {
    const btn = createComponent(attributeMode, 'mbtn', {
      base: { padding: '8px' },
      variants: {
        variant: {
          primary: { backgroundColor: 'blue' },
          secondary: { backgroundColor: 'gray' },
        },
        size: {
          small: { fontSize: '14px' },
          large: { fontSize: '18px' },
        },
      },
    });

    const b = btn({ variant: 'primary', size: 'small' });
    expect(b.className).toBe('mbtn-base');
    expect(b.attrs).toEqual({ 'data-variant': 'primary', 'data-size': 'small' });
    expect(b.props).toEqual({
      className: 'mbtn-base',
      'data-variant': 'primary',
      'data-size': 'small',
    });
  });

  it('applies defaultVariants when selection is omitted', () => {
    const btn = createComponent(attributeMode, 'dbtn', {
      base: { padding: '8px' },
      variants: {
        variant: {
          primary: { backgroundColor: 'blue' },
          secondary: { backgroundColor: 'gray' },
        },
      },
      defaultVariants: { variant: 'primary' },
    });

    expect(btn().attrs).toEqual({ 'data-variant': 'primary' });
    expect(btn({}).attrs).toEqual({ 'data-variant': 'primary' });
    expect(btn({ variant: 'secondary' }).attrs).toEqual({ 'data-variant': 'secondary' });
  });

  it('boolean dimension is presence-based: true -> empty-string attr, false -> omitted', () => {
    const btn = createComponent(attributeMode, 'boolbtn', {
      base: { padding: '8px' },
      variants: {
        disabled: {
          true: { opacity: 0.5 },
          false: {},
        },
      },
    });

    expect(btn({ disabled: true }).attrs).toEqual({ 'data-disabled': '' });
    expect(btn({ disabled: false }).attrs).toEqual({});
    expect(btn().attrs).toEqual({});
  });

  it('String(result) and template coercion return the base class name', () => {
    const btn = createComponent(attributeMode, 'strbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    const b = btn({ variant: 'primary' });
    expect(String(b)).toBe('strbtn-base');
    expect(`${b}`).toBe('strbtn-base');
  });

  it('interops with cx()', () => {
    const btn = createComponent(attributeMode, 'cxbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    const b = btn({ variant: 'primary' });
    expect(cx(b, 'extra')).toBe('cxbtn-base extra');
  });

  it('logs console.error in dev for unknown variant dimension', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    const btn = createComponent(attributeMode, 'unknowndim', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    btn({ bogus: 'x' } as unknown as Record<string, unknown>);

    expect(err).toHaveBeenCalledWith(expect.stringContaining('Unknown variant dimension "bogus"'));
    err.mockRestore();
  });

  it('logs console.error in dev for unknown variant option', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    const btn = createComponent(attributeMode, 'unknownopt', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    btn({ variant: 'nope' as 'primary' });

    expect(err).toHaveBeenCalledWith(expect.stringContaining('Unknown variant "nope"'));
    err.mockRestore();
  });

  it('throws when a slots config is passed under mode: "attribute"', () => {
    expect(() =>
      createComponent(attributeMode, 'slotbtn', {
        slots: ['root', 'trigger'],
        base: { root: { display: 'grid' } },
      } as never),
    ).toThrow(/does not support|not supported/i);
  });

  describe('CSS emission', () => {
    it('compiles each option to a &[data-dimension="option"] selector scoped under one base class', () => {
      createComponent(attributeMode, 'css-basic', {
        base: { padding: '8px' },
        variants: {
          variant: {
            primary: { backgroundColor: 'blue' },
            secondary: { backgroundColor: 'gray' },
          },
        },
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('.css-basic-base { padding: 8px; }');
      expect(css).toContain('.css-basic-base[data-variant="primary"] { background-color: blue; }');
      expect(css).toContain(
        '.css-basic-base[data-variant="secondary"] { background-color: gray; }',
      );
      expect(css).not.toContain('.css-basic-variant-primary');
    });

    it('compiles a boolean dimension to presence / :not() selectors', () => {
      createComponent(attributeMode, 'css-bool', {
        variants: {
          disabled: {
            true: { opacity: 0.5 },
            false: { opacity: 1 },
          },
        },
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('.css-bool-base[data-disabled] { opacity: 0.5; }');
      expect(css).toContain('.css-bool-base:not([data-disabled]) { opacity: 1; }');
    });

    it('skips CSS emission entirely for an empty option style block', () => {
      createComponent(attributeMode, 'css-empty-opt', {
        base: { padding: '8px' },
        variants: {
          disabled: {
            true: { opacity: 0.5 },
            false: {},
          },
        },
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).not.toContain(':not([data-disabled])');
    });

    it('compiles a compound variant to a single combined attribute selector, no compound class', () => {
      createComponent(attributeMode, 'css-compound', {
        variants: {
          variant: {
            primary: { color: 'blue' },
            secondary: { color: 'gray' },
          },
          size: {
            small: { fontSize: '14px' },
            large: { fontSize: '18px' },
          },
        },
        compoundVariants: [
          {
            variants: { variant: 'primary', size: 'large' },
            style: { fontWeight: 700 },
          },
        ],
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain(
        '.css-compound-base[data-variant="primary"][data-size="large"] { font-weight: 700; }',
      );
      expect(css).not.toContain('compound-0');
    });

    it('compiles a compound variant with an array value to :is(...)', () => {
      createComponent(attributeMode, 'css-compound-arr', {
        variants: {
          tone: {
            success: { color: 'green' },
            warning: { color: 'orange' },
            danger: { color: 'red' },
          },
          size: {
            lg: { fontSize: '18px' },
          },
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
        '.css-compound-arr-base:is([data-tone="success"], [data-tone="warning"])[data-size="lg"] { text-transform: uppercase; }',
      );
    });
  });
});

describe('createStyles({ mode: "attribute" })', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('every dimensioned component from the instance compiles in attribute mode', () => {
    const styles = createStyles({ mode: 'attribute', scopeId: 'ds-a' });
    const btn = styles.component('gbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    const b = btn({ variant: 'primary' });
    expect(b.attrs).toEqual({ 'data-variant': 'primary' });
  });

  it('a plain (non-attribute-mode) instance compiles class-based variants as before', () => {
    const styles = createStyles({ scopeId: 'ds-c' });
    const btn = styles.component('plainbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    expect(btn({ variant: 'primary' })).toBe('ds-c-plainbtn-base ds-c-plainbtn-variant-primary');
  });
});
