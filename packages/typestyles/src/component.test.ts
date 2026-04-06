import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createComponent } from './component';
import { defaultClassNamingConfig, mergeClassNaming } from './class-naming';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { registeredNamespaces } from './registry';

describe('createComponent — dimensioned variants', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('returns a callable function', () => {
    const btn = createComponent(defaultClassNamingConfig, 'btn', {
      base: { padding: '8px' },
      variants: { intent: { primary: { color: 'blue' } } },
    });
    expect(typeof btn).toBe('function');
  });

  it('includes base class when called with no args', () => {
    const btn = createComponent(defaultClassNamingConfig, 'btn', {
      base: { padding: '8px' },
    });
    expect(btn()).toBe('btn-base');
    expect(btn({})).toBe('btn-base');
  });

  it('is destructurable — base property returns the base class string', () => {
    const btn = createComponent(defaultClassNamingConfig, 'btn', {
      base: { padding: '8px' },
      variants: {
        intent: { primary: { color: 'blue' } },
      },
    });
    expect(btn.base).toBe('btn-base');
  });

  it('is destructurable — variant properties return individual class strings', () => {
    const btn = createComponent(defaultClassNamingConfig, 'btn', {
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
    const btn = createComponent(defaultClassNamingConfig, 'btn', {
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
    const btn = createComponent(defaultClassNamingConfig, 'btn-nobase', {
      variants: {
        intent: { primary: { color: 'blue' } },
      },
    });
    expect(btn({ intent: 'primary' })).toBe('btn-nobase-intent-primary');
  });

  it('applies variant classes from selections', () => {
    const btn = createComponent(defaultClassNamingConfig, 'vbtn', {
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
    const btn = createComponent(defaultClassNamingConfig, 'dbtn', {
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
    const btn = createComponent(defaultClassNamingConfig, 'obtn', {
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
    const btn = createComponent(defaultClassNamingConfig, 'cbtn', {
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
    const btn = createComponent(defaultClassNamingConfig, 'pbtn', {
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
    createComponent(defaultClassNamingConfig, 'style-test', {
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
    createComponent(defaultClassNamingConfig, 'cv-test', {
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
    const btn = createComponent(defaultClassNamingConfig, 'arrbtn', {
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
    const btn = createComponent(defaultClassNamingConfig, 'boolbtn', {
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
  });

  it('returns a callable function', () => {
    const card = createComponent(defaultClassNamingConfig, 'card', {
      base: { padding: '16px' },
      elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    });
    expect(typeof card).toBe('function');
  });

  it('base always auto-applied on function call', () => {
    const card = createComponent(defaultClassNamingConfig, 'card', {
      base: { padding: '16px' },
      elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    });
    expect(card()).toBe('card-base');
  });

  it('applies flat variants via boolean selections', () => {
    const card = createComponent(defaultClassNamingConfig, 'card', {
      base: { padding: '16px' },
      elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      compact: { padding: '8px' },
    });

    expect(card({ elevated: true })).toBe('card-base card-elevated');
    expect(card({ elevated: true, compact: true })).toBe('card-base card-elevated card-compact');
    expect(card({ elevated: false })).toBe('card-base');
  });

  it('is destructurable', () => {
    const card = createComponent(defaultClassNamingConfig, 'card', {
      base: { padding: '16px' },
      elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    });

    expect(card.base).toBe('card-base');
    expect(card.elevated).toBe('card-elevated');
  });

  it('supports Object.keys() for enumeration', () => {
    const card = createComponent(defaultClassNamingConfig, 'card', {
      base: { padding: '16px' },
      elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    });

    const keys = Object.keys(card);
    expect(keys).toContain('base');
    expect(keys).toContain('elevated');
  });

  it('injects CSS for all flat variants', () => {
    createComponent(defaultClassNamingConfig, 'flatcss', {
      base: { display: 'block' },
      active: { borderColor: 'blue' },
    });

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('.flatcss-base');
    expect(css).toContain('.flatcss-active');
  });

  it('works without base', () => {
    const card = createComponent(defaultClassNamingConfig, 'nobase', {
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
  });

  it('returns per-slot class maps with defaults', () => {
    const tabs = createComponent(defaultClassNamingConfig, 'tabs', {
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
    const tabs = createComponent(defaultClassNamingConfig, 'tabs-cv', {
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
    createComponent(defaultClassNamingConfig, 'tabs-css', {
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
  });

  it('returns a callable function that returns slot classes', () => {
    const checkbox = createComponent(defaultClassNamingConfig, 'checkbox', {
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
    const checkbox = createComponent(defaultClassNamingConfig, 'chk', {
      slots: ['root', 'box'] as const,
      root: { display: 'flex' },
      box: { width: '20px' },
    });

    expect(checkbox.root).toBe('chk-root');
    expect(checkbox.box).toBe('chk-box');
  });

  it('supports optional slots with no styles', () => {
    const dialog = createComponent(defaultClassNamingConfig, 'dialog', {
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
    const card = createComponent(defaultClassNamingConfig, 'mscard', {
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
    createComponent(defaultClassNamingConfig, 'mscss', {
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

describe('createComponent — function config & internal vars', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('accepts a callback that returns dimensioned config; vars scope to component', () => {
    const badge = createComponent(defaultClassNamingConfig, 'cb-badge', (c) => {
      const v = c.vars({
        textColor: '#333',
        borderColor: { value: '#ccc', syntax: '<color>', inherits: false },
      });
      return {
        base: {
          color: v.textColor.var,
          borderColor: v.borderColor.var,
          borderWidth: '1px',
        },
        variants: {
          tone: {
            neutral: {},
            danger: {
              [v.textColor.name]: '#900',
              [v.borderColor.name]: '#f00',
            },
          },
        },
        defaultVariants: { tone: 'neutral' },
      };
    });

    expect(badge()).toBe('cb-badge-base cb-badge-tone-neutral');
    expect(badge({ tone: 'danger' })).toBe('cb-badge-base cb-badge-tone-danger');

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@property --cb-badge-bordercolor');
    expect(css).toContain('--cb-badge-textcolor: #333');
    expect(css).toContain('--cb-badge-bordercolor: #ccc');
    expect(css).toContain('color: var(--cb-badge-textcolor)');
    expect(css).toContain('border-color: var(--cb-badge-bordercolor)');
  });

  it('prefixes internal var names with scopeId', () => {
    const scoped = mergeClassNaming({ scopeId: 'acme' });
    createComponent(scoped, 'pill', (c) => {
      const x = c.var('ink', { value: '#111' });
      return {
        base: { color: x.var },
      };
    });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('--acme-pill-ink: #111');
  });

  it('registers @property when syntax and value are set on ctx.var', () => {
    createComponent(defaultClassNamingConfig, 'prop-chip', (c) => {
      c.var('opacity', {
        value: '1',
        syntax: '<number>',
        inherits: false,
      });
      return { base: { padding: '4px' } };
    });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@property --prop-chip-opacity');
    expect(css).toContain('syntax: "<number>"');
    expect(css).toContain('initial-value: 1');
  });

  it('warns once on duplicate var id in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    createComponent(defaultClassNamingConfig, 'dup-var', (c) => {
      c.var('same');
      c.var('same');
      return { base: { color: c.var('same').var } };
    });

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('supports flat variant config via function', () => {
    const card = createComponent(defaultClassNamingConfig, 'fn-flat', (c) => {
      const e = c.var('elev');
      return {
        base: { boxShadow: e.var },
        elevated: { [e.name]: '0 2px 8px rgba(0,0,0,0.1)' },
      };
    });

    expect(card()).toBe('fn-flat-base');
    expect(card({ elevated: true })).toBe('fn-flat-base fn-flat-elevated');
  });

  it('supports multi-slot config via function', () => {
    const ui = createComponent(defaultClassNamingConfig, 'fn-slot', (c) => {
      const gap = c.var('g');
      return {
        slots: ['root', 'item'] as const,
        root: { gap: gap.var },
        item: { padding: '2px' },
      };
    });

    const classes = ui();
    expect(classes.root).toBe('fn-slot-root');
    expect(classes.item).toBe('fn-slot-item');
    flushSync();
    expect(getRegisteredCss()).toContain('gap: var(--fn-slot-g)');
  });

  it('supports nested vars object like tokens.create', () => {
    createComponent(defaultClassNamingConfig, 'nestv', (c) => {
      const v = c.vars({
        text: { primary: '#222', muted: '#888' },
      });
      return {
        base: { color: v.text.primary.var },
        variants: {
          dim: {
            on: { [v.text.primary.name]: '#fff' },
          },
        },
      };
    });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('--nestv-text-primary: #222');
    expect(css).toContain('color: var(--nestv-text-primary)');
  });
});
