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

  it('returns RegisteredPropertyRef leaves and registers @property for declared schema tokens', () => {
    const api = createTokens();
    const motionDecl = api.declare('motion', {
      duration: { syntax: '<time>', inherits: false },
      easing: true,
    });
    const motion = api.create(
      'motion',
      { duration: '200ms', easing: 'ease' },
      { decl: motionDecl },
    );

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
    expect(css).toContain('initial-value: 0s');
  });

  it('registers @property with automatic transparent placeholder for a declare-built color-mix value', () => {
    const api = createTokens();
    const color = api.declare('color', {
      accent: { default: { syntax: '<color>', inherits: false } },
      accentSubtle: { syntax: '<color>', inherits: false },
    });

    api.create(
      'color',
      {
        accent: { default: '#0066ff' },
        accentSubtle: `color-mix(in oklch, ${color.accent.default} 24%, white)`,
      },
      { decl: color },
    );
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('@property --color-accentSubtle');
    expect(css).toContain('initial-value: transparent');
    expect(css).toContain(
      '--color-accentSubtle: color-mix(in oklch, var(--color-accent-default) 24%, white)',
    );
  });

  it('uses an explicit schema `initial` as the @property placeholder for dependent values', () => {
    const api = createTokens();
    const base = api.create('base', { accent: '#0066ff' });
    const derivedDecl = api.declare('derived', {
      accentSubtle: { syntax: '<color>', inherits: false, initial: 'hotpink' },
    });
    api.create(
      'derived',
      { accentSubtle: `color-mix(in oklch, ${base.accent} 30%, white)` },
      { decl: derivedDecl },
    );
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('@property --derived-accentSubtle');
    expect(css).toContain('initial-value: hotpink');
    expect(css).toContain(
      '--derived-accentSubtle: color-mix(in oklch, var(--base-accent) 30%, white)',
    );
  });

  it('exposes schema refs from tokens.use after create', () => {
    const api = createTokens();
    const colorDecl = api.declare('color', {
      accent: { syntax: '<color>', inherits: false },
    });
    api.create('color', { accent: '#0066ff' }, { decl: colorDecl });
    flushSync();

    const used = api.use('color');
    expect(used.accent).toMatchObject({
      name: '--color-accent',
      var: 'var(--color-accent)',
    });
  });

  it('throws when create() uses a TokenDescriptor inline', () => {
    const api = createTokens();
    expect(() =>
      api.create('color', {
        accent: { value: '#0066ff', syntax: '<color>' },
      }),
    ).toThrow(/TokenDescriptor/);
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

    it('registers @property on templated names for declared schema leaves', () => {
      const api = createTokens();
      const motionDecl = api.declare(
        'motion',
        { duration: { syntax: '<time>', inherits: false } },
        { nameTemplate: ({ path }) => `--motion-${path}` },
      );
      api.create('motion', { duration: '200ms' }, { decl: motionDecl });
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

describe('tokens.declare', () => {
  beforeEach(() => {
    reset();
  });

  it('declare(schema) emits @property for syntax leaves immediately', () => {
    const api = createTokens();
    api.declare('color', {
      accent: { default: { syntax: '<color>', inherits: false } },
    });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@property --color-accent-default');
    expect(css).toContain('initial-value: transparent');
  });

  it('declare deep-merges schemas across calls', () => {
    const api = createTokens();
    api.declare('color', { accent: { default: { syntax: '<color>', inherits: false } } });
    api.declare('color', {
      accent: { subtle: { syntax: '<color>', inherits: false } },
      meta: { version: true },
    });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@property --color-accent-default');
    expect(css).toContain('@property --color-accent-subtle');
  });

  it('declare throws in dev when re-declaring a path with conflicting schema', () => {
    const api = createTokens();
    api.declare('color', { accent: { default: { syntax: '<color>', inherits: false } } });
    expect(() => api.declare('color', { accent: { default: true } })).toThrow(
      /conflicting schema/i,
    );
  });

  it('declare returns a typed ref that coerces to var()', () => {
    const api = createTokens();
    const color = api.declare('color', {
      accent: { default: { syntax: '<color>', inherits: false } },
    });
    expect(`${color.accent.default}`).toBe('var(--color-accent-default)');
    expectTypeOf(color.accent.default).toMatchTypeOf<{ name: string; var: string }>();
  });

  it('resolves nested paths to var() strings via template-literal coercion', () => {
    const api = createTokens();
    const color = api.declare('color', {
      accent: { default: true },
      background: { app: true },
    });
    expect(`${color.accent.default}`).toBe('var(--color-accent-default)');
    expect(`${color.background.app}`).toBe('var(--color-background-app)');
  });

  it('resolves arbitrarily deep paths', () => {
    const api = createTokens();
    const color = api.declare('color', { a: { b: { c: { d: true } } } });
    expect(`${color.a.b.c.d}`).toBe('var(--color-a-b-c-d)');
  });

  it('coerces via String() and valueOf, not just template literals', () => {
    const api = createTokens();
    const color = api.declare('color', { accent: { default: true } });
    expect(String(color.accent.default)).toBe('var(--color-accent-default)');
    expect(color.accent.default.valueOf()).toBe('var(--color-accent-default)');
  });

  it('respects scopeId', () => {
    const api = createTokens({ scopeId: 'acme' });
    const color = api.declare('color', { accent: true });
    expect(`${color.accent}`).toBe('var(--acme-color-accent)');
  });

  it('create merges values across calls for the same namespace', () => {
    const api = createTokens();
    const color = api.declare('color', {
      accent: {
        default: { syntax: '<color>', inherits: false },
        subtle: { syntax: '<color>', inherits: false },
      },
    });

    api.create('color', { accent: { default: '#0066ff' } }, { decl: color });
    api.create('color', { accent: { subtle: '#aabbcc' } }, { decl: color });
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('--color-accent-default: #0066ff');
    expect(css).toContain('--color-accent-subtle: #aabbcc');
  });

  it('create throws in dev when a value path is not in the declared schema', () => {
    const api = createTokens();
    const color = api.declare('color', {
      accent: { default: { syntax: '<color>', inherits: false } },
    });
    expect(() => api.create('color', { bogus: 'x' }, { decl: color })).toThrow(
      /not in the declared schema/i,
    );
  });

  it('create throws in dev when decl namespace does not match', () => {
    const api = createTokens();
    const color = api.declare('color', {
      accent: { default: { syntax: '<color>', inherits: false } },
    });
    expect(() => api.create('spacing', { sm: '8px' }, { decl: color })).toThrow(/decl handle for/i);
  });

  it('produces names matching a later tokens.create call in the same namespace', () => {
    const api = createTokens();
    const color = api.declare('color', {
      accent: { default: true, subtle: true },
    });
    const built = api.create('color', {
      accent: {
        default: '#0066ff',
        subtle: `color-mix(in oklch, ${color.accent.default} 24%, white)`,
      },
    });
    flushSync();

    expect(built.accent.default).toBe('var(--color-accent-default)');
    const css = getRegisteredCss();
    expect(css).toContain(
      '--color-accent-subtle: color-mix(in oklch, var(--color-accent-default) 24%, white)',
    );
  });

  it('reuses the nameTemplate declared earlier when create() omits its own', () => {
    const api = createTokens();
    const template = ({ path }: { path: string }) => `--ds-color-${path}`;
    const color = api.declare('color', { accent: true }, { nameTemplate: template });
    expect(`${color.accent}`).toBe('var(--ds-color-accent)');

    const built = api.create('color', { accent: '#0066ff' });
    expect(built.accent).toBe('var(--ds-color-accent)');
  });

  it('throws in dev mode when create() passes a different nameTemplate than declare() used', () => {
    const api = createTokens();
    api.declare('color', { accent: true }, { nameTemplate: ({ path }) => `--a-${path}` });

    expect(() =>
      api.create('color', { accent: '#0066ff' }, { nameTemplate: ({ path }) => `--b-${path}` }),
    ).toThrow(/different nameTemplate/);
  });

  it('does not throw when create() passes the same nameTemplate reference declare() used', () => {
    const api = createTokens();
    const template = ({ path }: { path: string }) => `--ds-color-${path}`;
    api.declare('color', { accent: true }, { nameTemplate: template });

    expect(() =>
      api.create('color', { accent: '#0066ff' }, { nameTemplate: template }),
    ).not.toThrow();
  });

  it('supports the Var UI colorRefShape pattern: multiple self-referencing derived tokens in one create() call', () => {
    const api = createTokens({ scopeId: 'acme' });
    const color = api.declare('color', {
      background: { app: true },
      accent: { default: true, subtle: true },
      danger: { default: true, subtle: true },
    });

    const built = api.create('color', {
      background: { app: '#0a0a0a' },
      accent: {
        default: '#0066ff',
        subtle: `color-mix(in oklch, ${color.accent.default} 24%, ${color.background.app})`,
      },
      danger: {
        default: '#ef4444',
        subtle: `color-mix(in oklch, ${color.danger.default} 12%, transparent)`,
      },
    });
    flushSync();

    expect(built.accent.subtle).toBe('var(--acme-color-accent-subtle)');

    const css = getRegisteredCss();
    expect(css).toContain(
      '--acme-color-accent-subtle: color-mix(in oklch, var(--acme-color-accent-default) 24%, var(--acme-color-background-app))',
    );
    expect(css).toContain(
      '--acme-color-danger-subtle: color-mix(in oklch, var(--acme-color-danger-default) 12%, transparent)',
    );
  });

  it('supports two namespaces referencing each other without a real import cycle', () => {
    const api = createTokens();

    const colorBRef = api.declare('colorB', { accent: true });
    const colorA = api.create('colorA', {
      accent: `color-mix(in oklch, ${colorBRef.accent} 50%, black)`,
    });

    const colorARef = api.declare('colorA', { accent: true });
    const colorB = api.create('colorB', {
      accent: `color-mix(in oklch, ${colorARef.accent} 50%, white)`,
    });

    flushSync();

    expect(colorA.accent).toBe('var(--colorA-accent)');
    expect(colorB.accent).toBe('var(--colorB-accent)');

    const css = getRegisteredCss();
    expect(css).toContain('--colorA-accent: color-mix(in oklch, var(--colorB-accent) 50%, black)');
    expect(css).toContain('--colorB-accent: color-mix(in oklch, var(--colorA-accent) 50%, white)');
  });

  it('throws in dev mode when create() introduces an explicit nameTemplate after declare() used the default', () => {
    const api = createTokens();
    const color = api.declare('color', { accent: true });
    expect(`${color.accent}`).toBe('var(--color-accent)');

    expect(() =>
      api.create(
        'color',
        { accent: '#0066ff' },
        { nameTemplate: ({ path }) => `--custom-${path}` },
      ),
    ).toThrow(/different nameTemplate/);
  });

  it('throws in dev mode when declare() is called with a different nameTemplate than create() already used', () => {
    const api = createTokens();
    api.create('color', { accent: '#0066ff' }, { nameTemplate: ({ path }) => `--a-${path}` });

    expect(() =>
      api.declare('color', { accent: true }, { nameTemplate: ({ path }) => `--b-${path}` }),
    ).toThrow(/different nameTemplate/);
  });

  it('throws in dev mode when declare() is called twice with different nameTemplates before create()', () => {
    const api = createTokens();
    api.declare('color', { accent: true }, { nameTemplate: ({ path }) => `--a-${path}` });

    expect(() =>
      api.declare('color', { accent: true }, { nameTemplate: ({ path }) => `--b-${path}` }),
    ).toThrow(/different nameTemplate.*previous tokens\.declare/);
  });

  it('declare() after create() picks up the already-created template without repeating nameTemplate', () => {
    const api = createTokens();
    api.create(
      'color',
      { accent: '#0066ff' },
      { nameTemplate: ({ path }) => `--ds-color-${path}` },
    );

    const color = api.declare('color', { accent: true });
    expect(`${color.accent}`).toBe('var(--ds-color-accent)');
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
