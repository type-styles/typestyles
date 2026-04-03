import { describe, it, expect, beforeEach } from 'vitest';
import { createComponent } from './component.js';
import { resetClassNaming } from './class-naming.js';
import { reset, flushSync, getRegisteredCss } from './sheet.js';
import { registeredNamespaces } from './registry.js';

describe('createComponent — dimensioned variants', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
    resetClassNaming();
  });

  it('returns a callable function', () => {
    const btn = createComponent('btn', {
      base: { padding: '8px' },
      variants: { intent: { primary: { color: 'blue' } } },
    });
    expect(typeof btn).toBe('function');
  });

  it('includes base class when called with no args', () => {
    const btn = createComponent('btn', {
      base: { padding: '8px' },
    });
    expect(btn()).toBe('btn-base');
    expect(btn({})).toBe('btn-base');
  });

  it('is destructurable — base property returns the base class string', () => {
    const btn = createComponent('btn', {
      base: { padding: '8px' },
      variants: {
        intent: { primary: { color: 'blue' } },
      },
    });
    expect(btn.base).toBe('btn-base');
  });

  it('is destructurable — variant properties return individual class strings', () => {
    const btn = createComponent('btn', {
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

    expect(btn['intent-primary']).toBe('btn-intent-primary');
    expect(btn['intent-ghost']).toBe('btn-intent-ghost');
    expect(btn['size-sm']).toBe('btn-size-sm');
    expect(btn['size-lg']).toBe('btn-size-lg');
  });

  it('supports Object.keys() for enumeration', () => {
    const btn = createComponent('btn', {
      base: { padding: '8px' },
      variants: {
        intent: { primary: { color: 'blue' } },
      },
    });

    const keys = Object.keys(btn);
    expect(keys).toContain('base');
    expect(keys).toContain('intent-primary');
  });

  it('does not include base class when base is not defined', () => {
    const btn = createComponent('btn-nobase', {
      variants: {
        intent: { primary: { color: 'blue' } },
      },
    });
    expect(btn({ intent: 'primary' })).toBe('btn-nobase-intent-primary');
  });

  it('applies variant classes from selections', () => {
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
      'vbtn-base vbtn-intent-primary vbtn-size-sm',
    );
    expect(btn({ intent: 'ghost', size: 'lg' })).toBe('vbtn-base vbtn-intent-ghost vbtn-size-lg');
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

    const noCompound = btn();
    expect(noCompound).not.toContain('cbtn-compound-0');

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
        intent: { primary: { color: 'blue' } },
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

describe('createComponent — flat variants', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
    resetClassNaming();
  });

  it('returns a callable function', () => {
    const card = createComponent('card', {
      base: { padding: '16px' },
      elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    });
    expect(typeof card).toBe('function');
  });

  it('base always auto-applied on function call', () => {
    const card = createComponent('card', {
      base: { padding: '16px' },
      elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    });
    expect(card()).toBe('card-base');
  });

  it('applies flat variants via boolean selections', () => {
    const card = createComponent('card', {
      base: { padding: '16px' },
      elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      compact: { padding: '8px' },
    });

    expect(card({ elevated: true })).toBe('card-base card-elevated');
    expect(card({ elevated: true, compact: true })).toBe('card-base card-elevated card-compact');
    expect(card({ elevated: false })).toBe('card-base');
  });

  it('is destructurable', () => {
    const card = createComponent('card', {
      base: { padding: '16px' },
      elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    });

    expect(card.base).toBe('card-base');
    expect(card.elevated).toBe('card-elevated');
  });

  it('supports Object.keys() for enumeration', () => {
    const card = createComponent('card', {
      base: { padding: '16px' },
      elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    });

    const keys = Object.keys(card);
    expect(keys).toContain('base');
    expect(keys).toContain('elevated');
  });

  it('injects CSS for all flat variants', () => {
    createComponent('flatcss', {
      base: { display: 'block' },
      active: { borderColor: 'blue' },
    });

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('.flatcss-base');
    expect(css).toContain('.flatcss-active');
  });

  it('works without base', () => {
    const card = createComponent('nobase', {
      elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    });

    expect(card()).toBe('');
    expect(card({ elevated: true })).toBe('nobase-elevated');
  });
});

describe('createComponent with slots', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
    resetClassNaming();
  });

  it('returns per-slot class maps with defaults', () => {
    const tabs = createComponent('tabs', {
      slots: ['root', 'trigger', 'content'] as const,
      base: {
        root: { display: 'grid' },
        trigger: { cursor: 'pointer' },
      },
      variants: {
        size: {
          sm: {
            trigger: { fontSize: '12px' },
            content: { padding: '8px' },
          },
          lg: {
            trigger: { fontSize: '16px' },
            content: { padding: '12px' },
          },
        },
      },
      defaultVariants: { size: 'sm' },
    });

    const defaults = tabs();
    expect(defaults.root).toBe('tabs-root');
    expect(defaults.trigger).toBe('tabs-trigger tabs-trigger-size-sm');
    expect(defaults.content).toBe('tabs-content-size-sm');

    const large = tabs({ size: 'lg' });
    expect(large.trigger).toBe('tabs-trigger tabs-trigger-size-lg');
    expect(large.content).toBe('tabs-content-size-lg');
  });

  it('applies slot compound variants to targeted slots', () => {
    const tabs = createComponent('tabs-cv', {
      slots: ['root', 'trigger', 'content'] as const,
      variants: {
        intent: {
          primary: { trigger: { color: 'blue' } },
          ghost: { trigger: { color: 'gray' } },
        },
        size: {
          sm: { content: { padding: '8px' } },
          lg: { content: { padding: '12px' } },
        },
      },
      compoundVariants: [
        {
          variants: { intent: ['primary', 'ghost'], size: 'lg' },
          style: { trigger: { fontWeight: 700 } },
        },
      ],
      defaultVariants: { intent: 'primary', size: 'sm' },
    });

    const noMatch = tabs();
    expect(noMatch.trigger).not.toContain('tabs-cv-trigger-compound-0');

    const withMatch = tabs({ size: 'lg' });
    expect(withMatch.trigger).toContain('tabs-cv-trigger-compound-0');
    expect(withMatch.content).not.toContain('tabs-cv-content-compound-0');
  });

  it('injects per-slot CSS class rules', () => {
    createComponent('tabs-css', {
      slots: ['root', 'trigger'] as const,
      base: {
        root: { display: 'grid' },
      },
      variants: {
        intent: {
          primary: { trigger: { color: 'blue' } },
        },
      },
      compoundVariants: [
        {
          variants: { intent: 'primary' },
          style: { trigger: { fontWeight: 600 } },
        },
      ],
      defaultVariants: { intent: 'primary' },
    });

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('.tabs-css-root');
    expect(css).toContain('.tabs-css-trigger-intent-primary');
    expect(css).toContain('.tabs-css-trigger-compound-0');
  });
});

describe('createComponent — multi-slot (no variants)', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
    resetClassNaming();
  });

  it('returns a callable function that returns slot classes', () => {
    const checkbox = createComponent('checkbox', {
      slots: ['root', 'box', 'label'] as const,
      root: { display: 'flex', gap: '8px' },
      box: { width: '18px', height: '18px' },
      label: { fontSize: '14px' },
    });
    expect(typeof checkbox).toBe('function');
    const classes = checkbox();
    expect(classes.root).toBe('checkbox-root');
    expect(classes.box).toBe('checkbox-box');
    expect(classes.label).toBe('checkbox-label');
  });

  it('is destructurable — each slot returns its class string', () => {
    const checkbox = createComponent('chk', {
      slots: ['root', 'box'] as const,
      root: { display: 'flex' },
      box: { width: '20px' },
    });

    expect(checkbox.root).toBe('chk-root');
    expect(checkbox.box).toBe('chk-box');
  });

  it('supports optional slots with no styles', () => {
    const dialog = createComponent('dialog', {
      slots: ['overlay', 'modal', 'content'] as const,
      overlay: { position: 'fixed' },
      modal: { padding: '16px' },
    });

    const classes = dialog();
    expect(classes.overlay).toBe('dialog-overlay');
    expect(classes.modal).toBe('dialog-modal');
    expect(classes.content).toBe('');
  });

  it('supports Object.keys() for enumeration', () => {
    const card = createComponent('mscard', {
      slots: ['root', 'title', 'body'] as const,
      root: { padding: '16px' },
      title: { fontWeight: 'bold' },
    });

    const keys = Object.keys(card);
    expect(keys).toContain('root');
    expect(keys).toContain('title');
    expect(keys).toContain('body');
  });

  it('injects CSS for all slots', () => {
    createComponent('mscss', {
      slots: ['root', 'box'] as const,
      root: { display: 'flex' },
      box: { width: '24px' },
    });

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('.mscss-root');
    expect(css).toContain('.mscss-box');
  });
});
