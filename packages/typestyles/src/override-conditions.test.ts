import { describe, it, expect, beforeEach } from 'vitest';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { createStyles } from './styles';
import { conditional } from './override';
import { when } from './theme';
import { registeredNamespaces } from './registry';

describe('styles.override() conditions + colorModes', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('emits base rule and a conditional ancestor attr rule with selectorPrefix', () => {
    const styles = createStyles({ colorModes: ['light', 'dark'] });
    const button = styles.component('cond-btn', {
      base: { display: 'inline-flex' },
    });

    styles.override(
      button,
      {
        base: {
          letterSpacing: '0.02em',
          conditions: [
            {
              when: when.attr('data-mode', 'dark', { scope: 'ancestor' }),
              style: { letterSpacing: '0.06em' },
            },
          ],
        },
      },
      { selectorPrefix: '.theme-acme' },
    );

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('.theme-acme .cond-btn {');
    expect(css).toContain('letter-spacing: 0.02em');
    expect(css).toContain('.theme-acme [data-mode="dark"] .cond-btn');
    expect(css).toContain('letter-spacing: 0.06em');
  });

  it('wraps prefersDark in @media', () => {
    const styles = createStyles();
    const button = styles.component('cond-media-btn', { base: {} });

    styles.override(button, {
      base: {
        conditions: [conditional(when.prefersDark, { color: 'white' })],
      },
    });

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('color: white');
  });

  it('emits separate rules for when.or branches', () => {
    const styles = createStyles();
    const button = styles.component('cond-or-btn', { base: {} });

    styles.override(button, {
      base: {
        conditions: [
          conditional(
            when.or(when.attr('data-mode', 'dark', { scope: 'ancestor' }), when.prefersDark),
            { fontWeight: 600 },
          ),
        ],
      },
    });

    flushSync();
    const css = getRegisteredCss();
    expect(css).toMatch(/\[data-mode="dark"\].*font-weight: 600/);
    expect(css).toContain('@media (prefers-color-scheme: dark)');
  });

  it('applies conditions on variant options only', () => {
    const styles = createStyles();
    const button = styles.component('cond-variant-btn', {
      base: {},
      variants: {
        intent: { primary: { color: 'blue' } },
      },
    });

    styles.override(button, {
      variants: {
        intent: {
          primary: {
            conditions: [conditional(when.prefersDark, { color: 'cyan' })],
          },
        },
      },
    });

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('.cond-variant-btn--intent-primary');
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\).+color: cyan/);
  });

  it('serializes color mode values to light-dark() on color properties', () => {
    const styles = createStyles({ colorModes: ['light', 'dark'] });
    const button = styles.component('mode-color-btn', { base: {} });

    styles.override(button, {
      base: {
        color: { light: '#111', dark: '#eee' },
      },
    });

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('color: light-dark(#111, #eee)');
  });

  it('allows conditions-only base blocks', () => {
    const styles = createStyles();
    const button = styles.component('cond-only-btn', { base: {} });

    styles.override(button, {
      base: {
        conditions: [conditional(when.prefersDark, { opacity: 0.9 })],
      },
    });

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('opacity: 0.9');
    expect(css).not.toMatch(/\.cond-only-btn \{\s*\}/);
  });

  it('uses @layer when configured', () => {
    const styles = createStyles({
      layers: ['tokens', 'components', 'overrides'] as const,
    });
    const button = styles.component('cond-layer-btn', { base: {} }, { layer: 'components' });

    styles.override(
      button,
      {
        base: {
          conditions: [conditional(when.prefersDark, { color: 'red' })],
        },
      },
      { layer: 'overrides' },
    );

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@layer overrides');
    expect(css).toContain('color: red');
  });
});
