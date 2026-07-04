import { describe, it, expect, beforeEach } from 'vitest';
import { reset, flushSync, getRegisteredCss, startCollection } from './sheet';
import { createStyles } from './styles';
import { createScope } from './scope';
import { defaultClassNamingConfig } from './class-naming';

describe('styles.scope', () => {
  beforeEach(() => {
    reset();
  });

  it('wraps a plain properties object in @scope for the root selector', () => {
    const styles = createStyles();
    styles.scope({ root: '.theme-acme' }, 'button-intent-primary', {
      backgroundColor: 'rebeccapurple',
    });

    const css = getRegisteredCss();
    expect(css).toContain(
      '@scope (.theme-acme) {\n.button-intent-primary { background-color: rebeccapurple; }\n}',
    );
  });

  it('emits a lower boundary with `to`', () => {
    const styles = createStyles();
    styles.scope({ root: '.theme-acme', to: '.theme-beta' }, 'button-base', {
      borderRadius: '999px',
    });

    expect(getRegisteredCss()).toContain(
      '@scope (.theme-acme) to (.theme-beta) {\n.button-base { border-radius: 999px; }\n}',
    );
  });

  it('reuses serializeStyle recursion for pseudo-selectors and at-rules', () => {
    const styles = createStyles();
    styles.scope({ root: '.theme-acme' }, 'button-intent-primary', {
      backgroundColor: 'rebeccapurple',
      '&:hover': { backgroundColor: 'purple' },
      '@media (min-width: 600px)': { padding: '12px' },
    });

    const css = getRegisteredCss();
    expect(css).toContain(
      '@scope (.theme-acme) {\n.button-intent-primary { background-color: rebeccapurple; }\n}',
    );
    expect(css).toContain(
      '@scope (.theme-acme) {\n.button-intent-primary:hover { background-color: purple; }\n}',
    );
    expect(css).toContain(
      '@scope (.theme-acme) {\n@media (min-width: 600px) { .button-intent-primary { padding: 12px; } }\n}',
    );
  });

  it('accepts a class name with a leading dot', () => {
    const styles = createStyles();
    styles.scope({ root: '.theme-acme' }, '.card', { padding: 0 });
    expect(getRegisteredCss()).toContain('@scope (.theme-acme) {\n.card { padding: 0; }\n}');
  });

  it('nests @layer outside @scope via applyLayerToRules and registers the order preamble', () => {
    const styles = createStyles({
      scopeId: 'app',
      layers: ['components', 'overrides'] as const,
    });
    styles.scope({ root: '.theme-acme', layer: 'overrides' }, 'button-intent-primary', {
      backgroundColor: 'rebeccapurple',
    });
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('@layer components, overrides;');
    expect(css).toContain(
      '@layer overrides {\n@scope (.theme-acme) {\n.button-intent-primary { background-color: rebeccapurple; }\n}\n}',
    );
  });

  it('keeps `layer` optional on a layered instance (unlayered override beats layered styles)', () => {
    const styles = createStyles({ scopeId: 'opt', layers: ['components'] as const });
    styles.scope({ root: '.theme-acme' }, 'button-base', { color: 'red' });

    const css = getRegisteredCss();
    expect(css).toContain('@scope (.theme-acme) {\n.button-base { color: red; }\n}');
    expect(css).not.toContain('@layer components {\n@scope');
  });

  it('validates `layer` against the instance layer stack', () => {
    const styles = createStyles({ scopeId: 'val', layers: ['components'] as const });
    expect(() =>
      styles.scope(
        { root: '.theme-acme', layer: 'nope' as unknown as 'components' },
        'button-base',
        { color: 'red' },
      ),
    ).toThrow(/Invalid `layer: "nope"`/);
  });

  it('throws when `layer` is passed without createStyles({ layers })', () => {
    const styles = createStyles();
    expect(() =>
      styles.scope({ root: '.theme-acme', layer: 'overrides' }, 'button-base', { color: 'red' }),
    ).toThrow(/requires `createStyles\({ layers/);
  });

  it('throws on an empty root or class name', () => {
    const styles = createStyles();
    expect(() => styles.scope({ root: '  ' }, 'button-base', { color: 'red' })).toThrow(
      /non-empty `root`/,
    );
    expect(() => styles.scope({ root: '.theme-acme' }, ' . ', { color: 'red' })).toThrow(
      /non-empty class name/,
    );
  });

  it('dedupes repeated registrations by rule key', () => {
    const styles = createStyles();
    styles.scope({ root: '.theme-acme' }, 'button-base', { color: 'red' });
    styles.scope({ root: '.theme-acme' }, 'button-base', { color: 'red' });

    const css = getRegisteredCss();
    const occurrences = css.split('@scope (.theme-acme)').length - 1;
    expect(occurrences).toBe(1);
  });

  it('keeps distinct roots for the same class name as separate rules', () => {
    const styles = createStyles();
    styles.scope({ root: '.theme-acme' }, 'button-base', { color: 'red' });
    styles.scope({ root: '.theme-beta' }, 'button-base', { color: 'blue' });

    const css = getRegisteredCss();
    expect(css).toContain('@scope (.theme-acme) {\n.button-base { color: red; }\n}');
    expect(css).toContain('@scope (.theme-beta) {\n.button-base { color: blue; }\n}');
  });

  it('is captured by SSR collection like every other registered rule', () => {
    const stop = startCollection();
    createScope(defaultClassNamingConfig, { root: '.theme-acme' }, 'button-base', {
      color: 'red',
    });
    const css = stop();
    expect(css).toContain('@scope (.theme-acme) {\n.button-base { color: red; }\n}');
  });

  it('inserts into the managed <style> element at runtime', () => {
    const styles = createStyles();
    styles.scope({ root: '.theme-acme' }, 'runtime-btn', { color: 'red' });
    flushSync();

    const el = document.getElementById('typestyles') as HTMLStyleElement | null;
    expect(el).not.toBeNull();
    const sheetCss = Array.from(el?.sheet?.cssRules ?? [])
      .map((r) => r.cssText)
      .join('\n');
    const textCss = el?.textContent ?? '';
    // jsdom's CSSOM may not parse @scope; the sheet falls back to a text node.
    expect(sheetCss + textCss).toContain('.runtime-btn');
  });

  it('expands utils inside overrides on a withUtils instance', () => {
    const styles = createStyles();
    const u = styles.withUtils({
      paddingX: (value: string | number) => ({ paddingLeft: value, paddingRight: value }),
    });
    u.scope({ root: '.theme-acme' }, 'button-base', { paddingX: 12 });

    expect(getRegisteredCss()).toContain(
      '@scope (.theme-acme) {\n.button-base { padding-left: 12px; padding-right: 12px; }\n}',
    );
  });
});
