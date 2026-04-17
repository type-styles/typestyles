import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import type { ResolvedConfig } from 'vite';
import { discoverDefaultExtractModules, extractNamespaces } from './index';

/** Vite plugin hooks may be a function or `{ handler }`. */
function viteHookFn<F>(hook: F | { handler: F } | undefined | null): F | undefined {
  if (hook == null) return undefined;
  if (typeof hook === 'function') return hook;
  return (hook as { handler: F }).handler;
}

describe('discoverDefaultExtractModules', () => {
  it('returns the first existing candidate path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'typestyles-disc-'));
    mkdirSync(join(dir, 'src', 'styles'), { recursive: true });
    writeFileSync(join(dir, 'src/typestyles.ts'), '\n');
    expect(discoverDefaultExtractModules(dir)).toEqual(['src/typestyles.ts']);
  });
});

describe('extractNamespaces', () => {
  it('extracts styles.component namespaces as prefixes', () => {
    const code = `
      import { styles } from 'typestyles';
      const button = styles.component('button', {
        base: { color: 'red' },
      });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['.button-']);
    expect(result.keys).toEqual([]);
  });

  it('extracts styles.class namespaces as prefixes', () => {
    const code = `
      import { styles } from 'typestyles';
      styles.class('card', { padding: '1rem' });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['.card-']);
    expect(result.keys).toEqual([]);
  });

  it('extracts tokens.create namespaces as keys', () => {
    const code = `
      import { tokens } from 'typestyles';
      const color = tokens.create('color', { primary: '#0066ff' });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['tokens:color']);
    expect(result.prefixes).toEqual([]);
  });

  it('extracts createTheme as theme keys', () => {
    const code = `
      import { tokens } from 'typestyles';
      const dark = tokens.createTheme('dark', { base: { color: { primary: '#fff' } } });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['theme:dark']);
  });

  it('extracts standalone createTheme calls', () => {
    const code = `
      import { createTheme } from 'typestyles';
      const dark = createTheme('dark', { base: { color: { primary: '#fff' } } });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['theme:dark']);
  });

  it('extracts keyframes.create as keyframe keys', () => {
    const code = `
      import { keyframes } from 'typestyles';
      const fadeIn = keyframes.create('fadeIn', {
        from: { opacity: 0 },
        to: { opacity: 1 },
      });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['keyframes:fadeIn']);
    expect(result.prefixes).toEqual([]);
  });

  it('extracts multiple namespaces from a single module', () => {
    const code = `
      import { styles, tokens, keyframes } from 'typestyles';
      const color = tokens.create('color', { primary: '#0066ff' });
      const fadeIn = keyframes.create('fadeIn', { from: { opacity: 0 }, to: { opacity: 1 } });
      const button = styles.component('button', { base: { color: color.primary } });
      const card = styles.component('card', { base: { animation: fadeIn } });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['tokens:color', 'keyframes:fadeIn']);
    expect(result.prefixes).toEqual(['.button-', '.card-']);
  });

  it('handles double-quoted strings', () => {
    const code = `
      const button = styles.component("button", { base: { color: 'red' } });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['.button-']);
  });

  it('extracts styles.component namespaces as prefixes', () => {
    const code = `
      import { styles } from 'typestyles';
      const button = styles.component('button', {
        base: { color: 'red' },
      });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['.button-']);
    expect(result.keys).toEqual([]);
  });

  it('extracts global.style selectors as prefixes', () => {
    const code = `
      import { global } from 'typestyles';
      global.style('body', { margin: 0 });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['body']);
    expect(result.keys).toEqual([]);
  });

  it('extracts global.fontFace as font-face prefixes', () => {
    const code = `
      import { global } from 'typestyles';
      global.fontFace('Inter', { src: "url('/Inter.woff2')" });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['font-face:Inter']);
    expect(result.keys).toEqual([]);
  });

  it('returns empty arrays for code with no typestyles calls', () => {
    const code = `
      const x = 1 + 2;
      console.log(x);
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual([]);
    expect(result.prefixes).toEqual([]);
  });
});

describe('typestyles vite plugin', () => {
  it('exports a default function', async () => {
    const mod = await import('./index');
    expect(typeof mod.default).toBe('function');
  });

  it('returns a plugin object with correct name', async () => {
    const mod = await import('./index');
    const plugin = mod.default();
    expect(plugin.name).toBe('typestyles');
  });

  it('defaults to build mode when extract.modules is set — runtime disabled only on vite build', async () => {
    const mod = await import('./index');
    const plugin = mod.default({ extract: { modules: ['src/entry.ts'] } });
    const config = viteHookFn(plugin.config);
    const serve = await Promise.resolve(config?.({}, { command: 'serve', mode: 'development' }));
    expect(serve?.define?.['__TYPESTYLES_RUNTIME_DISABLED__']).toBeUndefined();
    const build = await Promise.resolve(config?.({}, { command: 'build', mode: 'production' }));
    expect(build?.define?.__TYPESTYLES_RUNTIME_DISABLED__).toBe(JSON.stringify('true'));
  });

  it('defaults to runtime mode when no extraction modules resolve', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'typestyles-vite-empty-'));
    const mod = await import('./index');
    const plugin = mod.default();
    const config = viteHookFn(plugin.config);
    const build = await Promise.resolve(
      config?.({ root: dir }, { command: 'build', mode: 'production' }),
    );
    expect(build?.define?.__TYPESTYLES_RUNTIME_DISABLED__).toBeUndefined();
  });

  it('discovers a convention entry and defaults to build on vite build', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'typestyles-vite-disco-'));
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src/typestyles-entry.ts'), "import 'typestyles';\n");
    const mod = await import('./index');
    const plugin = mod.default();
    const config = viteHookFn(plugin.config);
    const serve = await Promise.resolve(
      config?.({ root: dir }, { command: 'serve', mode: 'development' }),
    );
    expect(serve?.define?.['__TYPESTYLES_RUNTIME_DISABLED__']).toBeUndefined();
    const build = await Promise.resolve(
      config?.({ root: dir }, { command: 'build', mode: 'production' }),
    );
    expect(build?.define?.__TYPESTYLES_RUNTIME_DISABLED__).toBe(JSON.stringify('true'));
  });

  it('honors mode: runtime with extract on build', async () => {
    const mod = await import('./index');
    const plugin = mod.default({
      mode: 'runtime',
      extract: { modules: ['a.ts'] },
    });
    const config = viteHookFn(plugin.config);
    const build = await Promise.resolve(config?.({}, { command: 'build', mode: 'production' }));
    expect(build?.define?.__TYPESTYLES_RUNTIME_DISABLED__).toBeUndefined();
  });

  it('injects HMR dispose when styles are imported from a local re-export (not from typestyles package string)', async () => {
    const mod = await import('./index');
    const plugin = mod.default();
    viteHookFn(plugin.configResolved)?.({ command: 'serve' } as ResolvedConfig);
    const code = `import { styles } from './typestyles';
styles.component('docs-sidebar', { base: { color: 'red' } });`;
    const ctx = { warn: () => {} };
    const transform = viteHookFn(plugin.transform);
    if (transform == null) throw new Error('expected plugin.transform');
    const result = await transform.call(ctx as never, code, '/src/styles/sidebar.ts');
    expect(result).not.toBeNull();
    if (result == null) throw new Error('expected transform result');
    expect(result.code).toContain("from 'typestyles/hmr'");
    expect(result.code).toContain('__typestylesInvalidateKeys');
    expect(result.code).toContain('.docs-sidebar-');
  });

  it('errors when the same style namespace is used in another module', async () => {
    const mod = await import('./index');
    const plugin = mod.default();
    const transform = viteHookFn(plugin.transform);
    if (transform == null) throw new Error('expected plugin.transform');
    const codeA = `import { styles } from 'typestyles';
styles.component('shared-ns', { base: { color: 'red' } });`;
    const codeB = `import { styles } from 'typestyles';
styles.component('shared-ns', { base: { color: 'blue' } });`;

    const ctx = {
      error(message: string) {
        throw new Error(message);
      },
    };

    await transform.call(ctx as never, codeA, '/src/a.ts');
    expect(() => transform.call(ctx as never, codeB, '/src/b.ts')).toThrow(
      /\[typestyles\] Style namespace "shared-ns"/,
    );
  });

  it('does not inject HMR during vite build', async () => {
    const mod = await import('./index');
    const plugin = mod.default();
    viteHookFn(plugin.configResolved)?.({ command: 'build' } as ResolvedConfig);
    const code = `import { styles } from 'typestyles';
styles.component('x', { base: {} });`;
    const transform = viteHookFn(plugin.transform);
    if (transform == null) throw new Error('expected plugin.transform');
    const result = await transform.call({ warn: () => {} } as never, code, '/src/a.ts');
    expect(result).toBeNull();
  });
});
