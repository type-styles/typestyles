import { describe, it, expect, beforeEach, expectTypeOf } from 'vitest';
import { createTokens } from './tokens';
import { createTheme } from './theme';
import { reset, flushSync, getRegisteredCss } from './sheet';
import type { TokenRef, TokenValues } from './types';

describe('createTokens factory', () => {
  it('exposes scopeId on the instance', () => {
    expect(createTokens().scopeId).toBeUndefined();
    expect(createTokens({ scopeId: 'ds' }).scopeId).toBe('ds');
  });

  it('prefixes CSS variable namespaces when scopeId is set', () => {
    const t = createTokens({ scopeId: 'my-pkg' });
    const color = t.create('color', { primary: '#0066ff' });
    expect(color.primary).toBe('var(--my-pkg-color-primary)');
  });
});

describe('tokens.create', () => {
  beforeEach(() => {
    reset();
  });

  it('returns an object with var() references', () => {
    const api = createTokens();
    const color = api.create('color', {
      primary: '#0066ff',
      secondary: '#6b7280',
    });

    expect(color.primary).toBe('var(--color-primary)');
    expect(color.secondary).toBe('var(--color-secondary)');
  });

  it('injects :root CSS with custom properties', () => {
    const api = createTokens();
    api.create('spacing', {
      sm: '8px',
      md: '16px',
      lg: '24px',
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    expect(style).not.toBeNull();

    const rule = style.sheet?.cssRules[0] as CSSStyleRule;
    expect(rule.cssText).toContain('--spacing-sm');
    expect(rule.cssText).toContain('--spacing-md');
    expect(rule.cssText).toContain('--spacing-lg');
  });

  it('token values are usable as CSS strings', () => {
    const api = createTokens();
    const size = api.create('size', { base: '16px' });
    expect(typeof size.base).toBe('string');
    expect(size.base).toContain('var(');
  });

  it('supports nested token objects', () => {
    const api = createTokens();
    const color = api.create('color', {
      text: { primary: '#111827', secondary: '#6b7280' },
      background: { surface: '#ffffff', subtle: '#f9fafb' },
      border: { default: '#e5e7eb' },
    });

    expect(color.text.primary).toBe('var(--color-text-primary)');
    expect(color.text.secondary).toBe('var(--color-text-secondary)');
    expect(color.background.surface).toBe('var(--color-background-surface)');
    expect(color.background.subtle).toBe('var(--color-background-subtle)');
    expect(color.border.default).toBe('var(--color-border-default)');

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rule = style.sheet?.cssRules[0] as CSSStyleRule;
    expect(rule.cssText).toContain('--color-text-primary');
    expect(rule.cssText).toContain('--color-background-surface');
    expect(rule.cssText).toContain('--color-border-default');
  });

  it('supports deeply nested token objects', () => {
    const api = createTokens();
    const color = api.create('color', {
      brand: {
        primary: { DEFAULT: '#0066ff', hover: '#0052cc' },
      },
    });

    expect(color.brand.primary.DEFAULT).toBe('var(--color-brand-primary-DEFAULT)');
    expect(color.brand.primary.hover).toBe('var(--color-brand-primary-hover)');
  });

  it('supports flat values alongside nested objects', () => {
    const api = createTokens();
    const tokens = api.create('test', {
      simple: 'value',
      nested: { key: 'nested-value' },
    });

    expect(tokens.simple).toBe('var(--test-simple)');
    expect(tokens.nested.key).toBe('var(--test-nested-key)');
  });

  it('returns RegisteredPropertyRef leaves and registers @property for descriptor tokens', () => {
    const api = createTokens();
    const motion = api.create('motion', {
      duration: { value: '200ms', syntax: '<time>', inherits: false },
      easing: 'ease',
    });

    expect(typeof motion.easing).toBe('string');
    expect(motion.easing).toBe('var(--motion-easing)');

    const duration = motion.duration;
    expect(duration).toMatchObject({
      name: '--motion-duration',
      var: 'var(--motion-duration)',
    });
    expect(String(duration)).toBe('var(--motion-duration)');
    expect(`${duration}`).toBe('var(--motion-duration)');

    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('--motion-duration: 200ms');
    expect(css).toContain('@property --motion-duration');
    expect(css).toContain('syntax: "<time>"');
    expect(css).toContain('initial-value: 200ms');
  });

  it('uses an explicit descriptor `initial` as the @property placeholder for dependent values', () => {
    const api = createTokens();
    const base = api.create('base', { accent: '#0066ff' });
    api.create('derived', {
      accentSubtle: {
        value: `color-mix(in oklch, ${base.accent} 30%, white)`,
        syntax: '<color>',
        inherits: false,
        initial: 'hotpink',
      },
    });
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('@property --derived-accentSubtle');
    expect(css).toContain('initial-value: hotpink');
    expect(css).toContain(
      '--derived-accentSubtle: color-mix(in oklch, var(--base-accent) 30%, white)',
    );
  });

  it('exposes descriptor refs from tokens.use after create', () => {
    const api = createTokens();
    api.create('color', {
      accent: { value: '#0066ff', syntax: '<color>' },
    });
    flushSync();

    const used = api.use('color');
    expect(used.accent).toMatchObject({
      name: '--color-accent',
      var: 'var(--color-accent)',
    });
  });

  describe('nameTemplate', () => {
    it('keeps default output when nameTemplate is omitted', () => {
      const api = createTokens({ scopeId: 'app' });
      const color = api.create('color', { primary: '#0066ff' });
      expect(color.primary).toBe('var(--app-color-primary)');
    });

    it('uses custom template for emission and proxy refs', () => {
      const api = createTokens({ scopeId: 'acme' });
      const color = api.create(
        'color',
        { brand: { 500: '#0066ff' } },
        {
          nameTemplate: ({ segments }) => `--color-${segments.join('-')}`,
        },
      );

      expect(color.brand[500]).toBe('var(--color-brand-500)');

      flushSync();
      const css = getRegisteredCss();
      expect(css).toContain('--color-brand-500: #0066ff');
      expect(css).not.toContain('--acme-color-brand-500');
    });

    it('joins segments with a custom separator', () => {
      const api = createTokens();
      const color = api.create(
        'color',
        { brand: { primary: '#0066ff' } },
        {
          nameTemplate: ({ segments }) => `--color-${segments.join('_')}`,
        },
      );

      expect(color.brand.primary).toBe('var(--color-brand_primary)');
    });

    it('applies instance default with per-namespace override', () => {
      const api = createTokens({
        scopeId: 'app',
        nameTemplate: ({ scope, namespace, path }) => `--${scope}-${namespace}-${path}`,
      });

      const scoped = api.create('space', { md: '16px' });
      expect(scoped.md).toBe('var(--app-space-md)');

      const plain = api.create(
        'color',
        { primary: '#0066ff' },
        { nameTemplate: ({ path }) => `--color-${path}` },
      );
      expect(plain.primary).toBe('var(--color-primary)');
    });

    it('registers @property on templated names for descriptor leaves', () => {
      const api = createTokens();
      api.create(
        'motion',
        { duration: { value: '200ms', syntax: '<time>' } },
        { nameTemplate: ({ path }) => `--motion-${path}` },
      );
      flushSync();

      const css = getRegisteredCss();
      expect(css).toContain('@property --motion-duration');
      expect(css).toContain('--motion-duration: 200ms');
    });

    it('throws on duplicate template output for distinct paths in dev', () => {
      const api = createTokens();
      expect(() =>
        api.create('color', { a: '#111', b: '#222' }, { nameTemplate: () => '--color-same' }),
      ).toThrow(/duplicate custom property name/);
    });

    it('tokens.use returns same var() strings after custom create', () => {
      const api = createTokens();
      api.create(
        'color',
        { primary: '#0066ff' },
        { nameTemplate: ({ path }) => `--ds-color-${path}` },
      );
      flushSync();

      const used = api.use('color');
      expect(used.primary).toBe('var(--ds-color-primary)');
    });
  });
});

describe('tokens.use', () => {
  beforeEach(() => {
    reset();
  });

  it('returns var() references without injecting CSS', () => {
    const api = createTokens();
    api.create('theme-color', { primary: '#000' });
    flushSync();

    const stylesBefore = document.getElementById('typestyles') as HTMLStyleElement;
    const ruleCountBefore = stylesBefore?.sheet?.cssRules.length ?? 0;

    const color = api.use('theme-color');
    flushSync();

    const rulesAfter = stylesBefore?.sheet?.cssRules.length ?? 0;
    expect(rulesAfter).toBe(ruleCountBefore);

    expect(color.primary).toBe('var(--theme-color-primary)');
  });

  it('creates var() references for any property name', () => {
    const api = createTokens();
    const tokens = api.use('anything');
    expect(tokens.foo).toBe('var(--anything-foo)');
    expect(tokens.bar).toBe('var(--anything-bar)');
  });

  it('supports nested access for useTokens when tokens are created first', () => {
    const api = createTokens();
    api.create('color', { text: { primary: '#000' } });
    flushSync();
    const tokens = api.use('color');
    expect(tokens.text.primary).toBe('var(--color-text-primary)');
  });

  it('infers token shape when passed a created ref', () => {
    const api = createTokens();
    const space = api.create('space', { sm: '8px', md: '16px' } as const);
    const used = api.use(space);

    expectTypeOf(used).toEqualTypeOf(space);
    expectTypeOf(used.sm).toBeString();
    expectTypeOf(used.md).toBeString();
    expect(used.sm).toBe('var(--space-sm)');
    expect(used.md).toBe('var(--space-md)');
  });

  it('resolves namespace from a created ref without injecting CSS', () => {
    const api = createTokens();
    const created = api.create('ref-space', { lg: '24px' });
    flushSync();

    const stylesBefore = document.getElementById('typestyles') as HTMLStyleElement;
    const ruleCountBefore = stylesBefore?.sheet?.cssRules.length ?? 0;

    const used = api.use(created);
    flushSync();

    const ruleCountAfter = stylesBefore?.sheet?.cssRules.length ?? 0;
    expect(ruleCountAfter).toBe(ruleCountBefore);
    expect(used.lg).toBe('var(--ref-space-lg)');
  });

  it('falls back to broad TokenValues for string-only use', () => {
    const api = createTokens();
    const used = api.use('anything');

    expectTypeOf(used).toEqualTypeOf<TokenRef<TokenValues>>();
    expect(used.foo).toBe('var(--anything-foo)');
  });

  it('infers from a shared registry generic when namespace is a known key', () => {
    type Registry = {
      space: { sm: '8px'; md: '16px' };
      color: { primary: '#000' };
    };
    const api = createTokens<Registry>();

    expectTypeOf(api.use('space')).toMatchObjectType<{ sm: string; md: string }>();
    expectTypeOf(api.use('color')).toMatchObjectType<{ primary: string }>();
  });
});

describe('createTheme', () => {
  beforeEach(() => {
    reset();
  });

  it('returns a ThemeSurface with className and name', () => {
    const dark = createTheme('dark', {
      base: { color: { primary: '#66b3ff' } },
    });

    expect(dark.className).toBe('theme-dark');
    expect(dark.name).toBe('dark');
  });

  it('coerces to className via toString and Symbol.toPrimitive', () => {
    const acme = createTheme('acme', {
      base: { color: { primary: '#111' } },
    });

    expect(String(acme)).toBe('theme-acme');
    expect(`wrapper ${acme}`).toBe('wrapper theme-acme');
    expect(acme.toString()).toBe('theme-acme');
  });

  it('injects a CSS rule with custom property overrides', () => {
    createTheme('high-contrast', {
      base: {
        color: {
          primary: '#0000ff',
          text: '#000000',
        },
      },
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rules = Array.from(style.sheet?.cssRules ?? []);
    const themeRule = rules.find(
      (r) => (r as CSSStyleRule).selectorText === '.theme-high-contrast',
    ) as CSSStyleRule;

    expect(themeRule).toBeDefined();
    expect(themeRule.cssText).toContain('--color-primary');
    expect(themeRule.cssText).toContain('--color-text');
  });

  it('supports nested structures in createTheme', () => {
    createTheme('dark', {
      base: {
        color: {
          text: { primary: '#e0e0e0', secondary: '#a1a1aa' },
          background: { surface: '#1a1a2e', subtle: '#262640' },
        },
      },
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rules = Array.from(style.sheet?.cssRules ?? []);
    const themeRule = rules.find(
      (r) => (r as CSSStyleRule).selectorText === '.theme-dark',
    ) as CSSStyleRule;

    expect(themeRule).toBeDefined();
    expect(themeRule.cssText).toContain('--color-text-primary');
    expect(themeRule.cssText).toContain('--color-text-secondary');
    expect(themeRule.cssText).toContain('--color-background-surface');
    expect(themeRule.cssText).toContain('--color-background-subtle');
  });

  it('uses templated custom property names from tokens.create', () => {
    const api = createTokens();
    api.create(
      'color',
      { primary: '#0066ff' },
      { nameTemplate: ({ path }) => `--ds-color-${path}` },
    );

    api.createTheme('brand', {
      base: { color: { primary: '#111827' } },
    });

    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const rules = Array.from(style.sheet?.cssRules ?? []);
    const themeRule = rules.find(
      (r) => (r as CSSStyleRule).selectorText === '.theme-brand',
    ) as CSSStyleRule;

    expect(themeRule).toBeDefined();
    expect(themeRule.cssText).toContain('--ds-color-primary: #111827');
    expect(themeRule.cssText).not.toContain('--color-primary');
  });
});
