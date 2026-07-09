import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createComponent } from './component';
import { defaultClassNamingConfig, mergeClassNaming } from './class-naming';
import { createStyles } from './styles';
import { cx } from './cx';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { registeredNamespaces } from './registry';

describe('createComponent — attribute-strategy dimensioned variants', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('returns a callable function', () => {
    const btn = createComponent(defaultClassNamingConfig, 'attrbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
      variantStrategy: 'attribute',
    });
    expect(typeof btn).toBe('function');
  });

  it('exposes only the base class — no per-option destructurable keys', () => {
    const btn = createComponent(defaultClassNamingConfig, 'noopt', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
      variantStrategy: 'attribute',
    });
    expect(btn.base).toBe('noopt-base');
    expect(Object.keys(btn)).toEqual(['base']);
  });

  it('resolves className, attrs, and props for a single dimension', () => {
    const btn = createComponent(defaultClassNamingConfig, 'sbtn', {
      base: { padding: '8px' },
      variants: {
        variant: {
          primary: { backgroundColor: 'blue' },
          secondary: { backgroundColor: 'gray' },
        },
      },
      variantStrategy: 'attribute',
    });

    const b = btn({ variant: 'primary' });
    expect(b.className).toBe('sbtn-base');
    expect(b.attrs).toEqual({ 'data-variant': 'primary' });
    expect(b.props).toEqual({ className: 'sbtn-base', 'data-variant': 'primary' });
  });

  it('resolves className, attrs, and props for multiple dimensions', () => {
    const btn = createComponent(defaultClassNamingConfig, 'mbtn', {
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
      variantStrategy: 'attribute',
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
    const btn = createComponent(defaultClassNamingConfig, 'dbtn', {
      base: { padding: '8px' },
      variants: {
        variant: {
          primary: { backgroundColor: 'blue' },
          secondary: { backgroundColor: 'gray' },
        },
      },
      defaultVariants: { variant: 'primary' },
      variantStrategy: 'attribute',
    });

    expect(btn().attrs).toEqual({ 'data-variant': 'primary' });
    expect(btn({}).attrs).toEqual({ 'data-variant': 'primary' });
    expect(btn({ variant: 'secondary' }).attrs).toEqual({ 'data-variant': 'secondary' });
  });

  it('boolean dimension is presence-based: true -> empty-string attr, false -> omitted', () => {
    const btn = createComponent(defaultClassNamingConfig, 'boolbtn', {
      base: { padding: '8px' },
      variants: {
        disabled: {
          true: { opacity: 0.5 },
          false: {},
        },
      },
      variantStrategy: 'attribute',
    });

    expect(btn({ disabled: true }).attrs).toEqual({ 'data-disabled': '' });
    expect(btn({ disabled: false }).attrs).toEqual({});
    expect(btn().attrs).toEqual({});
  });

  it('String(result) and template coercion return the base class name', () => {
    const btn = createComponent(defaultClassNamingConfig, 'strbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
      variantStrategy: 'attribute',
    });

    const b = btn({ variant: 'primary' });
    expect(String(b)).toBe('strbtn-base');
    expect(`${b}`).toBe('strbtn-base');
  });

  it('interops with cx()', () => {
    const btn = createComponent(defaultClassNamingConfig, 'cxbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
      variantStrategy: 'attribute',
    });

    const b = btn({ variant: 'primary' });
    expect(cx(b, 'extra')).toBe('cxbtn-base extra');
  });

  it('logs console.error in dev for unknown variant dimension', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    const btn = createComponent(defaultClassNamingConfig, 'unknowndim', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
      variantStrategy: 'attribute',
    });

    btn({ bogus: 'x' } as unknown as Record<string, unknown>);

    expect(err).toHaveBeenCalledWith(expect.stringContaining('Unknown variant dimension "bogus"'));
    err.mockRestore();
  });

  it('logs console.error in dev for unknown variant option', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    const btn = createComponent(defaultClassNamingConfig, 'unknownopt', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
      variantStrategy: 'attribute',
    });

    btn({ variant: 'nope' as 'primary' });

    expect(err).toHaveBeenCalledWith(expect.stringContaining('Unknown variant "nope"'));
    err.mockRestore();
  });

  describe('CSS emission', () => {
    it('compiles each option to a &[data-dimension="option"] selector scoped under one base class', () => {
      createComponent(defaultClassNamingConfig, 'css-basic', {
        base: { padding: '8px' },
        variants: {
          variant: {
            primary: { backgroundColor: 'blue' },
            secondary: { backgroundColor: 'gray' },
          },
        },
        variantStrategy: 'attribute',
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('.css-basic-base { padding: 8px; }');
      expect(css).toContain('.css-basic-base[data-variant="primary"] { background-color: blue; }');
      expect(css).toContain(
        '.css-basic-base[data-variant="secondary"] { background-color: gray; }',
      );
      // No discrete per-option class is ever emitted.
      expect(css).not.toContain('.css-basic-variant-primary');
    });

    it('compiles a boolean dimension to presence / :not() selectors', () => {
      createComponent(defaultClassNamingConfig, 'css-bool', {
        variants: {
          disabled: {
            true: { opacity: 0.5 },
            false: { opacity: 1 },
          },
        },
        variantStrategy: 'attribute',
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('.css-bool-base[data-disabled] { opacity: 0.5; }');
      expect(css).toContain('.css-bool-base:not([data-disabled]) { opacity: 1; }');
    });

    it('skips CSS emission entirely for an empty option style block', () => {
      createComponent(defaultClassNamingConfig, 'css-empty-opt', {
        base: { padding: '8px' },
        variants: {
          disabled: {
            true: { opacity: 0.5 },
            false: {},
          },
        },
        variantStrategy: 'attribute',
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).not.toContain(':not([data-disabled])');
    });

    it('compiles a compound variant to a single combined attribute selector, no compound class', () => {
      createComponent(defaultClassNamingConfig, 'css-compound', {
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
        variantStrategy: 'attribute',
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain(
        '.css-compound-base[data-variant="primary"][data-size="large"] { font-weight: 700; }',
      );
      expect(css).not.toContain('compound-0');
    });

    it('compiles a compound variant with an array value to :is(...)', () => {
      createComponent(defaultClassNamingConfig, 'css-compound-arr', {
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
        variantStrategy: 'attribute',
      });

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain(
        '.css-compound-arr-base:is([data-tone="success"], [data-tone="warning"])[data-size="lg"] { text-transform: uppercase; }',
      );
    });

    it('atomic naming mode: attribute-branch declarations still scope under the base selector', () => {
      const cfg = mergeClassNaming({ mode: 'atomic', prefix: 'a' });
      const btn = createComponent(cfg, 'atomicbtn', {
        base: { padding: '8px' },
        variants: {
          variant: {
            primary: { backgroundColor: 'blue' },
          },
        },
        variantStrategy: 'attribute',
      });

      flushSync();
      const css = getRegisteredCss();
      // One atomic class for the base declaration, one for the attribute-branch declaration.
      expect(css).toMatch(/\.a-[a-z0-9]+ \{ padding: 8px; \}/);
      expect(css).toMatch(/\.a-[a-z0-9]+\[data-variant="primary"\] \{ background-color: blue; \}/);

      const b = btn({ variant: 'primary' });
      expect(b.className.split(' ')).toHaveLength(2);
      expect(b.attrs).toEqual({ 'data-variant': 'primary' });
    });
  });
});

describe('createStyles({ defaultVariantStrategy })', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('a component omitting variantStrategy inherits the global default', () => {
    const styles = createStyles({ defaultVariantStrategy: 'attribute', scopeId: 'ds-a' });
    const btn = styles.component('gbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    const b = btn({ variant: 'primary' });
    expect(b.attrs).toEqual({ 'data-variant': 'primary' });
  });

  it('a component setting variantStrategy: "class" overrides the global default back', () => {
    const styles = createStyles({ defaultVariantStrategy: 'attribute', scopeId: 'ds-b' });
    const btn = styles.component('cbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
      variantStrategy: 'class',
    });

    expect(btn({ variant: 'primary' })).toBe('ds-b-cbtn-base ds-b-cbtn-variant-primary');
  });

  it('defaults to class strategy when defaultVariantStrategy is unset', () => {
    const styles = createStyles({ scopeId: 'ds-c' });
    const btn = styles.component('plainbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });

    expect(btn({ variant: 'primary' })).toBe('ds-c-plainbtn-base ds-c-plainbtn-variant-primary');
  });
});
