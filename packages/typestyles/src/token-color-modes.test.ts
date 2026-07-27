import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { colorModes } from './color-modes';
import {
  canUseLightDarkForTokenValue,
  expandModeAwareTokenValues,
  mergeThemeColorModePatches,
  mergeTokenTreesWithColorModes,
} from './token-color-modes';

describe('token-color-modes', () => {
  it('detects color vs shadow token leaves', () => {
    expect(canUseLightDarkForTokenValue('oklch(55% 0.2 290)')).toBe(true);
    expect(canUseLightDarkForTokenValue('var(--color-accent)')).toBe(true);
    expect(canUseLightDarkForTokenValue('0 0 0 3px oklch(90% 0.08 290)')).toBe(false);
  });

  it('expands mode-aware leaves to light-dark()', () => {
    const { expanded } = expandModeAwareTokenValues(
      { accent: { light: '#111', dark: '#eee' } },
      colorModes,
    );
    expect(expanded).toEqual({ accent: 'light-dark(#111, #eee)' });
  });

  it('keeps identical mode-aware leaves as scalars', () => {
    const { expanded } = expandModeAwareTokenValues(
      { border: { light: '#000', dark: '#000' } },
      colorModes,
    );
    expect(expanded).toEqual({ border: '#000' });
  });

  it('splits incompatible leaves into darkOnly', () => {
    const { expanded, darkOnly } = expandModeAwareTokenValues(
      { glow: { light: '0 0 0 3px blue', dark: '0 0 16px navy' } },
      colorModes,
    );
    expect(expanded).toEqual({ glow: '0 0 0 3px blue' });
    expect(darkOnly).toEqual({ glow: '0 0 16px navy' });
  });

  it('merges theme colorMode patches to light-dark on base', () => {
    const { merged } = mergeThemeColorModePatches(
      { color: { accent: { default: '#111' } } },
      undefined,
      { color: { accent: { default: '#eee' } } },
      colorModes,
    );
    expect(merged).toEqual({
      color: { accent: { default: 'light-dark(#111, #eee)' } },
    });
  });

  it('merges token trees with light-dark leaves', () => {
    const { merged } = mergeTokenTreesWithColorModes(
      { accent: { default: '#111' } },
      { accent: { default: '#eee' } },
    );
    expect(merged).toEqual({ accent: { default: 'light-dark(#111, #eee)' } });
  });

  describe('dev warnings', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    afterEach(() => {
      vi.stubEnv('NODE_ENV', originalEnv ?? 'test');
      vi.restoreAllMocks();
    });

    it('warns when colorModes is not configured', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expandModeAwareTokenValues({ accent: { light: '#111', dark: '#eee' } }, undefined);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('colorModes'));
    });
  });
});
