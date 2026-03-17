import { describe, it, expect, beforeEach } from 'vitest';
import { createComponent, createRecipe } from './component.js';
import { reset, flushSync, getRegisteredCss } from './sheet.js';
import { registeredNamespaces } from './registry.js';

describe('createComponent', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('returns a function', () => {
    const btn = createComponent('btn', {});
    expect(typeof btn).toBe('function');
  });

  it('includes base class when base is defined', () => {
    const btn = createComponent('btn', {
      base: { padding: '8px' },
    });
    expect(btn()).toBe('btn-base');
    expect(btn({})).toBe('btn-base');
  });

  it('does not include base class when base is not defined', () => {
    const btn = createComponent('btn-nobase', {
      variants: {
        intent: {
          primary: { color: 'blue' },
        },
      },
    });
    expect(btn({ intent: 'primary' })).toBe('btn-nobase-intent-primary');
  });

  it('applies variant classes', () => {
    const btn = createComponent('vbtn', {
      base: { padding: '8px' },
      variants: {
        intent: {
          primary: { backgroundColor: 'blue' },
          ghost: { backgroundColor: 'transparent' },
        },
        size: {
          sm: { fontSize: '12px' },
          lg: { fontSize: '18px' },
        },
      },
    });

    expect(btn({ intent: 'primary', size: 'sm' })).toBe(
      'vbtn-base vbtn-intent-primary vbtn-size-sm'
    );
    expect(btn({ intent: 'ghost', size: 'lg' })).toBe(
      'vbtn-base vbtn-intent-ghost vbtn-size-lg'
    );
  });

  it('applies defaultVariants when selection is omitted', () => {
    const btn = createComponent('dbtn', {
      base: { padding: '8px' },
      variants: {
        intent: {
          primary: { backgroundColor: 'blue' },
          ghost: { backgroundColor: 'transparent' },
        },
        size: {
          sm: { fontSize: '12px' },
          lg: { fontSize: '18px' },
        },
      },
      defaultVariants: { intent: 'primary', size: 'sm' },
    });

    expect(btn()).toBe('dbtn-base dbtn-intent-primary dbtn-size-sm');
    expect(btn({})).toBe('dbtn-base dbtn-intent-primary dbtn-size-sm');
    expect(btn({ size: 'lg' })).toBe('dbtn-base dbtn-intent-primary dbtn-size-lg');
  });

  it('explicit selection overrides defaultVariants', () => {
    const btn = createComponent('obtn', {
      variants: {
        intent: {
          primary: { color: 'blue' },
          ghost: { color: 'black' },
        },
      },
      defaultVariants: { intent: 'primary' },
    });

    expect(btn({ intent: 'ghost' })).toBe('obtn-intent-ghost');
  });

  it('applies compound variant class when all keys match', () => {
    const btn = createComponent('cbtn', {
      base: { padding: '8px' },
      variants: {
        intent: {
          primary: { backgroundColor: 'blue' },
          ghost: { backgroundColor: 'transparent' },
        },
        size: {
          sm: { fontSize: '12px' },
          lg: { fontSize: '18px' },
        },
      },
      compoundVariants: [
        {
          variants: { intent: 'primary', size: 'lg' },
          style: { fontWeight: 700 },
        },
      ],
      defaultVariants: { intent: 'primary', size: 'sm' },
    });

    // No compound match (size is sm by default)
    const noCompound = btn();
    expect(noCompound).not.toContain('cbtn-compound-0');

    // Compound match
    const withCompound = btn({ intent: 'primary', size: 'lg' });
    expect(withCompound).toContain('cbtn-compound-0');
    expect(withCompound).toContain('cbtn-base');
    expect(withCompound).toContain('cbtn-intent-primary');
    expect(withCompound).toContain('cbtn-size-lg');
  });

  it('does not apply compound variant when only partial match', () => {
    const btn = createComponent('pbtn', {
      variants: {
        intent: {
          primary: { color: 'blue' },
          ghost: { color: 'black' },
        },
        size: {
          sm: { fontSize: '12px' },
          lg: { fontSize: '18px' },
        },
      },
      compoundVariants: [
        {
          variants: { intent: 'primary', size: 'lg' },
          style: { fontWeight: 700 },
        },
      ],
    });

    expect(btn({ intent: 'primary', size: 'sm' })).not.toContain('pbtn-compound-0');
    expect(btn({ intent: 'ghost', size: 'lg' })).not.toContain('pbtn-compound-0');
  });

  it('injects CSS for base and variants into the stylesheet', () => {
    createComponent('style-test', {
      base: { display: 'flex' },
      variants: {
        intent: {
          primary: { color: 'blue' },
        },
      },
    });

    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('.style-test-base');
    expect(css).toContain('.style-test-intent-primary');
  });

  it('injects CSS for compound variants', () => {
    createComponent('cv-test', {
      variants: {
        intent: { primary: { color: 'blue' } },
        size: { lg: { fontSize: '18px' } },
      },
      compoundVariants: [
        { variants: { intent: 'primary', size: 'lg' }, style: { fontWeight: 700 } },
      ],
    });

    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('.cv-test-compound-0');
  });

  it('matches compound variants with array values', () => {
    const btn = createComponent('arrbtn', {
      variants: {
        intent: {
          primary: { color: 'blue' },
          secondary: { color: 'purple' },
          ghost: { color: 'gray' },
        },
        size: {
          sm: { fontSize: '12px' },
          lg: { fontSize: '18px' },
        },
      },
      compoundVariants: [
        {
          variants: { intent: ['primary', 'secondary'], size: 'lg' },
          style: { textTransform: 'uppercase' },
        },
      ],
    });

    expect(btn({ intent: 'primary', size: 'lg' })).toContain('arrbtn-compound-0');
    expect(btn({ intent: 'secondary', size: 'lg' })).toContain('arrbtn-compound-0');
    expect(btn({ intent: 'ghost', size: 'lg' })).not.toContain('arrbtn-compound-0');
  });

  it('supports boolean variant keys in selections and defaults', () => {
    const btn = createComponent('boolbtn', {
      variants: {
        outlined: {
          true: { border: '1px solid currentColor' },
          false: { border: 'none' },
        },
      },
      defaultVariants: { outlined: false },
    });

    expect(btn()).toBe('boolbtn-outlined-false');
    expect(btn({ outlined: true })).toBe('boolbtn-outlined-true');
    expect(btn({ outlined: false })).toBe('boolbtn-outlined-false');
  });
});

describe('createRecipe', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('is a first-class alias with recipe terminology', () => {
    const button = createRecipe('recipe-btn', {
      base: { padding: '8px' },
      variants: {
        intent: {
          primary: { color: 'blue' },
          ghost: { color: 'black' },
        },
        rounded: {
          true: { borderRadius: '9999px' },
          false: { borderRadius: '0' },
        },
      },
      compoundVariants: [
        {
          variants: { intent: ['primary', 'ghost'], rounded: true },
          style: { fontWeight: 700 },
        },
      ],
      defaultVariants: { intent: 'primary', rounded: false },
    });

    expect(button()).toBe('recipe-btn-base recipe-btn-intent-primary recipe-btn-rounded-false');
    expect(button({ rounded: true })).toContain('recipe-btn-compound-0');
  });
});
