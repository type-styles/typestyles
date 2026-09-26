import { describe, it, expect, beforeEach } from 'vitest';
import { reset, getRegisteredCss, flushSync } from './sheet';
import { createTypeStyles } from './create-type-styles';
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
});
