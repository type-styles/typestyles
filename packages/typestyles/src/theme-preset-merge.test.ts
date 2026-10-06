import { describe, it, expect, beforeEach } from 'vitest';
import { reset, getRegisteredCss, flushSync } from './sheet';
import { createTypeStyles } from './create-type-styles';
import { when } from './theme';
import { applyThemeSurfaceOverride, mergeThemePresetConfig } from './theme-preset-merge';

describe('mergeThemePresetConfig', () => {
  it('deep-merges from and override token trees', () => {
    expect(
      mergeThemePresetConfig(
        { tokens: { color: { text: { primary: '#111' } } } },
        { tokens: { color: { accent: { default: '#0066ff' } } } },
      ).tokens,
    ).toEqual({
      color: { text: { primary: '#111' }, accent: { default: '#0066ff' } },
    });
  });

  it('merges modes by id so overrides win over preset', () => {
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

describe('ThemeSurface.override (via createTheme root)', () => {
  beforeEach(() => reset());

  it('emits merged root + override patches with mode-aware leaves', () => {
    const { tokens } = createTypeStyles({ scopeId: 'fp', colorModes: ['light', 'dark'] });
    const root = tokens.createTheme({
      name: 'root',
      tokens: {
        color: {
          canvas: { light: '#fff', dark: '#000' },
          accent: { default: '#111' },
        },
      },
    });
    root.override({
      name: 'app',
      tokens: {
        color: { accent: { default: '#0066ff' } },
      },
    });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toMatch(/--fp-color-canvas:\s*light-dark\(#fff, #000\)/);
    expect(css).toContain('--fp-color-accent-default: #0066ff');
  });

  it('merges modes by id when override patches a matching mode', () => {
    const { tokens } = createTypeStyles({ scopeId: 'md' });
    tokens.create('color', { text: { primary: '#111' } });
    const root = tokens.createTheme({
      name: 'root',
      modes: [
        {
          id: 'focus',
          when: when.prefersDark,
          overrides: { color: { text: { primary: '#222' } } },
        },
      ],
    });
    root.override({
      name: 'brand',
      modes: [
        {
          id: 'focus',
          when: when.prefersDark,
          overrides: { color: { text: { primary: '#eee' } } },
        },
      ],
    });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toMatch(/theme-md-brand.*#eee/s);
    expect(css).not.toMatch(/theme-md-brand[\s\S]*#222/);
  });

  it('applyThemeSurfaceOverride merges patches onto a source snapshot', () => {
    expect(
      applyThemeSurfaceOverride(
        { tokens: { color: { brand: 'red', muted: 'gray' } } },
        { name: 'child', tokens: { color: { brand: 'blue' } } },
      ).tokens,
    ).toEqual({
      color: { brand: 'blue', muted: 'gray' },
    });
  });
});
