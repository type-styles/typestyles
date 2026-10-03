import { describe, it, expect, beforeEach } from 'vitest';
import { reset, getRegisteredCss, flushSync } from './sheet';
import { createTypeStyles } from './create-type-styles';
import { when } from './theme';
import { mergeThemePresetConfig } from './theme-preset-merge';

describe('mergeThemePresetConfig', () => {
  it('deep-merges from and patch base trees', () => {
    expect(
      mergeThemePresetConfig(
        { base: { color: { text: { primary: '#111' } } } },
        { base: { color: { accent: { default: '#0066ff' } } } },
      ).base,
    ).toEqual({
      color: { text: { primary: '#111' }, accent: { default: '#0066ff' } },
    });
  });

  it('merges modes by id so patch overrides from', () => {
    const sharedWhen = when.prefersDark;
    expect(
      mergeThemePresetConfig(
        {
          modes: [
            {
              id: 'high-contrast',
              when: sharedWhen,
              overrides: { color: { text: { primary: '#111' }, bg: { canvas: '#fff' } } },
            },
          ],
        },
        {
          modes: [
            {
              id: 'high-contrast',
              when: sharedWhen,
              overrides: { color: { text: { primary: '#000' } } },
            },
            {
              id: 'compact',
              when: sharedWhen,
              overrides: { space: { unit: '4px' } },
            },
          ],
        },
      ).modes,
    ).toEqual([
      {
        id: 'high-contrast',
        when: sharedWhen,
        overrides: {
          color: { text: { primary: '#000' }, bg: { canvas: '#fff' } },
        },
      },
      {
        id: 'compact',
        when: sharedWhen,
        overrides: { space: { unit: '4px' } },
      },
    ]);
  });
});

describe('createTheme({ from, patch })', () => {
  beforeEach(() => reset());

  it('emits merged preset + patch with mode-aware leaves', () => {
    const { tokens } = createTypeStyles({ scopeId: 'fp', colorModes: ['light', 'dark'] });
    tokens.createTheme('app', {
      from: {
        base: {
          color: { canvas: { light: '#fff', dark: '#000' } },
        },
      },
      patch: {
        base: {
          color: { accent: { default: '#0066ff' } },
        },
      },
    });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toMatch(/--fp-color-canvas:\s*light-dark\(#fff, #000\)/);
    expect(css).toContain('--fp-color-accent-default: #0066ff');
  });

  it('applies patch mode overrides when id matches from preset', () => {
    const { tokens } = createTypeStyles({ scopeId: 'md' });
    tokens.create('color', { text: { primary: '#111' } });
    tokens.createTheme('brand', {
      from: {
        modes: [
          {
            id: 'focus',
            when: when.prefersDark,
            overrides: { color: { text: { primary: '#222' } } },
          },
        ],
      },
      patch: {
        modes: [
          {
            id: 'focus',
            when: when.prefersDark,
            overrides: { color: { text: { primary: '#eee' } } },
          },
        ],
      },
    });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toMatch(/theme-md-brand.*#eee/s);
    expect(css).not.toMatch(/theme-md-brand[\s\S]*#222/);
  });
});
