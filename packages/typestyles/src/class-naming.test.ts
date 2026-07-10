import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  fileScopeId,
  mergeClassNaming,
  buildBemBlockClassName,
  buildBemElementClassName,
  buildBemModifierClassName,
  resolveClassNameTemplate,
  buildTemplateClassName,
  type ClassNameTemplate,
} from './class-naming';
import { createStyles } from './styles';
import { reset, flushSync } from './sheet';
import { registeredNamespaces } from './registry';

describe('fileScopeId', () => {
  it('is stable for the same url and differs for different paths', () => {
    const a = fileScopeId({ url: 'file:///app/src/Button.tsx' });
    const b = fileScopeId({ url: 'file:///app/src/Button.tsx' });
    const c = fileScopeId({ url: 'file:///app/src/Input.tsx' });
    expect(a).toMatch(/^file-[a-z0-9]+$/);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('class naming modes', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('semantic mode keeps readable component() class strings', () => {
    const styles = createStyles({ mode: 'semantic' });
    const button = styles.component('btn', {
      base: { color: 'red' },
      primary: { backgroundColor: 'blue' },
    });
    expect(button.base).toBe('btn-base');
    expect(button.primary).toBe('btn-primary');
  });

  it('hashed mode yields stable prefixed class names for component()', () => {
    const styles = createStyles({ mode: 'hashed', prefix: 'app' });
    const a = styles.component('card', {
      root: { padding: '8px' },
    });
    registeredNamespaces.clear();
    const b = styles.component('card', {
      root: { padding: '8px' },
    });
    expect(a.root).toMatch(/^app-card-/);
    expect(a.root).toBe(b.root);
  });

  it('scopeId changes hashed output for the same logical component styles', () => {
    const sa = createStyles({ mode: 'hashed', scopeId: 'pkg-a' });
    const x = sa.component('box', { main: { margin: 0 } }).main;
    reset();
    registeredNamespaces.clear();
    const sb = createStyles({ mode: 'hashed', scopeId: 'pkg-b' });
    const y = sb.component('box', { main: { margin: 0 } }).main;
    expect(x).not.toBe(y);
  });

  it('compact mode omits the namespace slug in class strings', () => {
    const styles = createStyles({ mode: 'compact', prefix: 'x' });
    const button = styles.component('btn', {
      base: { color: 'red' },
    });
    expect(button.base).toMatch(/^x-[a-z0-9]+$/);
    expect(button.base).not.toContain('btn');
  });

  it('atomic mode emits one class per declaration', () => {
    const styles = createStyles({ mode: 'atomic', prefix: 'x' });
    const button = styles.component('btn', {
      base: { color: 'red', padding: '8px' },
    });
    const parts = button.base.split(' ');
    expect(parts).toHaveLength(2);
    for (const p of parts) {
      expect(p).toMatch(/^x-[a-z0-9]+$/);
    }
  });

  it('styles.class respects naming mode', () => {
    const styles = createStyles({ mode: 'hashed', prefix: 't' });
    const cls = styles.class('hero', { display: 'flex' });
    expect(cls).toMatch(/^t-hero-/);
  });

  it('createComponent resolves variant keys to hashed classes', () => {
    const styles = createStyles({ mode: 'hashed', prefix: 'c' });
    const btn = styles.component('cb', {
      base: { padding: '4px' },
      variants: {
        intent: {
          primary: { color: 'blue' },
        },
      },
    });
    const out = btn({ intent: 'primary' });
    expect(out).toMatch(/c-cb-/);
    expect(out).not.toContain('cb-intent-primary');
    flushSync();
    const style = document.getElementById('typestyles') as HTMLStyleElement;
    const parts = out.split(' ');
    for (const p of parts) {
      const found = Array.from(style.sheet?.cssRules ?? []).some(
        (r) => r instanceof CSSStyleRule && r.selectorText === `.${p}`,
      );
      expect(found, `selector .${p}`).toBe(true);
    }
  });

  it('createHashClass uses default prefix when scopeId is empty', () => {
    const styles = createStyles({ scopeId: '' });
    const cls = styles.hashClass({ color: 'red' }, 'lbl');
    expect(cls.startsWith('ts-lbl-')).toBe(true);
  });

  it('createHashClass includes scopeId in the hash when set', () => {
    const sa = createStyles();
    const a = sa.hashClass({ width: 10 }, 'x');
    reset();
    registeredNamespaces.clear();
    const sb = createStyles({ scopeId: 's1' });
    const b = sb.hashClass({ width: 10 }, 'x');
    expect(a).not.toBe(b);
  });
});

describe('semantic mode with scopeId', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('prefixes component class names with the sanitized scope', () => {
    const styles = createStyles({ scopeId: 'my-ui' });
    const button = styles.component('button', {
      base: { color: 'red' },
      variants: { intent: { primary: { color: 'blue' } } },
    });
    expect(button.base).toBe('my-ui-button-base');
    expect(button['intent-primary']).toBe('my-ui-button-intent-primary');
    expect(button({ intent: 'primary' })).toBe('my-ui-button-base my-ui-button-intent-primary');
  });

  it('sanitizes package-style scope ids', () => {
    const styles = createStyles({ scopeId: '@acme/design-system' });
    const cls = styles.class('card', { padding: '1rem' });
    expect(cls).toBe('acme-design-system-card');
  });

  it('keeps unscoped names unchanged', () => {
    const styles = createStyles();
    const cls = styles.class('card', { padding: '1rem' });
    expect(cls).toBe('card');
  });

  it('isolates the same logical namespace across scopes', () => {
    const sa = createStyles({ scopeId: 'pkg-a' });
    const sb = createStyles({ scopeId: 'pkg-b' });
    const a = sa.component('button', { base: { color: 'red' } });
    const b = sb.component('button', { base: { color: 'blue' } });
    expect(a.base).not.toBe(b.base);
  });
});

describe('class name collision detection (dev)', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('errors when two different definitions emit the same class string', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // scope 'docs' + namespace 'button' and no scope + namespace 'docs-button'
    // both emit "docs-button-base"
    const scoped = createStyles({ scopeId: 'docs' });
    const unscoped = createStyles();
    scoped.component('button', { base: { color: 'red' } });
    unscoped.component('docs-button', { base: { color: 'blue' } });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Class name collision'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('docs-button-base'));
  });

  it('does not error when the same definition re-registers (HMR)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const styles = createStyles({ scopeId: 'app' });
    styles.component('button', { base: { color: 'red' } });
    // Same scope + namespace re-registered with edited styles — dev HMR path
    styles.component('button', { base: { color: 'blue' } });
    const collisionCalls = errorSpy.mock.calls.filter(
      (args) => typeof args[0] === 'string' && args[0].includes('Class name collision'),
    );
    expect(collisionCalls).toHaveLength(0);
  });

  it('does not error for identical hashClass payloads (intentional dedup)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const styles = createStyles();
    const a = styles.hashClass({ color: 'red' });
    const b = styles.hashClass({ color: 'red' });
    expect(a).toBe(b);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe('unscoped collision warning (dev)', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns when the same component namespace is registered twice without scopeId', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a = createStyles();
    const b = createStyles();
    a.component('card', { base: { color: 'red' } });
    b.component('card', { base: { color: 'blue' } });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("styles.component('card'"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('without a scopeId'));
  });

  it('does not warn when scoped components re-register (HMR)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const styles = createStyles({ scopeId: 'app' });
    styles.component('button', { base: { color: 'red' } });
    styles.component('button', { base: { color: 'blue' } });
    const unscopedCalls = warnSpy.mock.calls.filter(
      (args) => typeof args[0] === 'string' && args[0].includes('without a scopeId'),
    );
    expect(unscopedCalls).toHaveLength(0);
  });

  it('warns only once per namespace', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a = createStyles();
    const b = createStyles();
    const c = createStyles();
    a.component('tag', { base: { color: 'red' } });
    b.component('tag', { base: { color: 'blue' } });
    c.component('tag', { base: { color: 'green' } });
    const unscopedCalls = warnSpy.mock.calls.filter(
      (args) => typeof args[0] === 'string' && args[0].includes("styles.component('tag'"),
    );
    expect(unscopedCalls).toHaveLength(1);
  });
});

describe('BEM naming helpers', () => {
  it('buildBemBlockClassName returns the bare namespace (no scope)', () => {
    const cfg = mergeClassNaming({ mode: 'bem' });
    expect(buildBemBlockClassName(cfg, 'button')).toBe('button');
  });

  it('buildBemBlockClassName prefixes the sanitized scopeId when set', () => {
    const cfg = mergeClassNaming({ mode: 'bem', scopeId: 'My UI' });
    expect(buildBemBlockClassName(cfg, 'button')).toBe('my-ui-button');
  });

  it('buildBemElementClassName appends __slot to the block name', () => {
    const cfg = mergeClassNaming({ mode: 'bem' });
    expect(buildBemElementClassName(cfg, 'dialog', 'trigger')).toBe('dialog__trigger');
  });

  it('buildBemModifierClassName appends --option to a given block/element class name', () => {
    const cfg = mergeClassNaming({ mode: 'bem' });
    const block = buildBemBlockClassName(cfg, 'button');
    expect(buildBemModifierClassName(cfg, 'button', block, 'primary')).toBe('button--primary');
    const element = buildBemElementClassName(cfg, 'dialog', 'trigger');
    expect(buildBemModifierClassName(cfg, 'dialog', element, 'primary')).toBe(
      'dialog__trigger--primary',
    );
  });
});

describe('generic classname template engine (buildTemplateClassName / resolveClassNameTemplate)', () => {
  it('resolveClassNameTemplate returns the built-in BEM preset for mode: bem', () => {
    const cfg = mergeClassNaming({ mode: 'bem' });
    const template = resolveClassNameTemplate(cfg);
    expect(
      template({
        scope: '',
        namespace: 'button',
        element: undefined,
        dimension: undefined,
        modifier: undefined,
      }),
    ).toBe('button');
    expect(
      template({
        scope: '',
        namespace: 'button',
        element: undefined,
        dimension: 'variant',
        modifier: 'primary',
      }),
    ).toBe('button--primary');
    expect(
      template({
        scope: '',
        namespace: 'dialog',
        element: 'trigger',
        dimension: undefined,
        modifier: undefined,
      }),
    ).toBe('dialog__trigger');
    expect(
      template({
        scope: '',
        namespace: 'dialog',
        element: 'trigger',
        dimension: 'variant',
        modifier: 'primary',
      }),
    ).toBe('dialog__trigger--primary');
  });

  it('resolveClassNameTemplate returns the user-supplied classNameTemplate for mode: template', () => {
    const custom: ClassNameTemplate = (ctx) => `x-${ctx.namespace}`;
    const cfg = mergeClassNaming({ mode: 'template', classNameTemplate: custom });
    expect(resolveClassNameTemplate(cfg)).toBe(custom);
  });

  it('buildTemplateClassName matches the old BEM builders exactly (block, element, modifier, scoped)', () => {
    const cfg = mergeClassNaming({ mode: 'bem', scopeId: 'My UI' });
    expect(
      buildTemplateClassName(cfg, {
        namespace: 'button',
        element: undefined,
        dimension: undefined,
        modifier: undefined,
      }),
    ).toBe(buildBemBlockClassName(mergeClassNaming({ mode: 'bem', scopeId: 'My UI' }), 'button'));
    expect(
      buildTemplateClassName(cfg, {
        namespace: 'dialog',
        element: 'trigger',
        dimension: undefined,
        modifier: undefined,
      }),
    ).toBe(
      buildBemElementClassName(
        mergeClassNaming({ mode: 'bem', scopeId: 'My UI' }),
        'dialog',
        'trigger',
      ),
    );
    expect(
      buildTemplateClassName(cfg, {
        namespace: 'button',
        element: undefined,
        dimension: 'variant',
        modifier: 'primary',
      }),
    ).toBe('my-ui-button--primary');
  });

  it('buildTemplateClassName calls the user template with a fully-populated ClassNameContext, including scope', () => {
    const seen: unknown[] = [];
    const cfg = mergeClassNaming({
      mode: 'template',
      scopeId: 'acme',
      classNameTemplate: (ctx) => {
        seen.push(ctx);
        return 'ok';
      },
    });
    buildTemplateClassName(cfg, {
      namespace: 'button',
      element: 'icon',
      dimension: 'intent',
      modifier: 'primary',
    });
    expect(seen).toEqual([
      {
        scope: 'acme-',
        namespace: 'button',
        element: 'icon',
        dimension: 'intent',
        modifier: 'primary',
      },
    ]);
  });

  it('throws in dev when the template returns an invalid CSS class name', () => {
    const cfg = mergeClassNaming({
      mode: 'template',
      classNameTemplate: () => '1-not-a-valid-start',
    });
    expect(() =>
      buildTemplateClassName(cfg, {
        namespace: 'button',
        element: undefined,
        dimension: undefined,
        modifier: undefined,
      }),
    ).toThrow(/invalid CSS class name/);
  });

  it('accepts template output starting with a hyphen (valid CSS identifier)', () => {
    const cfg = mergeClassNaming({
      mode: 'template',
      classNameTemplate: () => '-webkit-style-button',
    });
    expect(() =>
      buildTemplateClassName(cfg, {
        namespace: 'button',
        element: undefined,
        dimension: undefined,
        modifier: undefined,
      }),
    ).not.toThrow();
  });
});
