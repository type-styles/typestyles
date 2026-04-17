import { describe, expect, it } from 'vitest';
import typestylesRollupPlugin, { extractNamespaces } from './index';

/** Rollup plugin hooks may be a function or `{ handler }`. */
function rollupHookFn<F>(hook: F | { handler: F } | undefined | null): F | undefined {
  if (hook == null) return undefined;
  if (typeof hook === 'function') return hook;
  return (hook as { handler: F }).handler;
}

describe('extractNamespaces', () => {
  it('extracts styles and tokens namespaces', () => {
    const code = `
      import { styles, tokens } from 'typestyles';
      const color = tokens.create('color', { primary: '#0066ff' });
      const button = styles.component('button', { base: { color: color.primary } });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['tokens:color']);
    expect(result.prefixes).toEqual(['.button-']);
  });

  it('extracts styles.class namespaces as prefixes', () => {
    const code = `
      import { styles } from 'typestyles';
      styles.class('hero', { display: 'flex' });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['.hero-']);
    expect(result.keys).toEqual([]);
  });
});

describe('typestylesRollupPlugin', () => {
  it('errors when the same style namespace is used in another module', async () => {
    const plugin = typestylesRollupPlugin();
    const transform = rollupHookFn(plugin.transform);
    if (transform == null) throw new Error('expected plugin.transform');
    const codeA = `import { styles } from 'typestyles';
styles.component('rollup-dup', { base: { color: 'red' } });`;
    const codeB = `import { styles } from 'typestyles';
styles.component('rollup-dup', { base: { color: 'blue' } });`;

    const ctx = {
      error(message: string) {
        throw new Error(message);
      },
    };

    await transform.call(ctx as never, codeA, '/src/a.ts');
    expect(() => transform.call(ctx as never, codeB, '/src/b.ts')).toThrow(
      /\[typestyles\] Style namespace "rollup-dup"/,
    );
  });
});
