import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { serializeStyle } from './serialize-style';
import { expandColorModeProperty, isColorModeObject, acceptsLightDark } from './color-modes';

describe('colorModes serialization', () => {
  const colorModes = ['light', 'dark'] as const;

  it('detects mode objects', () => {
    expect(isColorModeObject({ light: 'a', dark: 'b' }, colorModes)).toBe(true);
    expect(isColorModeObject({ base: '8px', md: '16px' }, colorModes)).toBe(false);
  });

  it('expands color properties to light-dark()', () => {
    expect(acceptsLightDark('color')).toBe(true);
    expect(acceptsLightDark('fontWeight')).toBe(false);
    expect(expandColorModeProperty('color', { light: 'a', dark: 'b' }, colorModes)).toBe(
      'light-dark(a, b)',
    );
  });

  it('serializes mode values in serializeStyle', () => {
    const rules = serializeStyle(
      '.card',
      { borderColor: { light: 'red', dark: 'blue' } },
      { colorModes },
    );
    expect(rules[0].css).toContain('border-color: light-dark(red, blue)');
  });

  it('leaves scalar values unchanged', () => {
    const rules = serializeStyle('.card', { color: 'red' }, { colorModes });
    expect(rules[0].css).toContain('color: red');
  });

  describe('dev warnings', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('warns when colorModes is not configured', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      serializeStyle('.card', { color: { light: 'a', dark: 'b' } });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('colorModes'));
      warn.mockRestore();
    });

    it('warns on structural properties', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expandColorModeProperty('fontWeight', { light: 400, dark: 600 }, colorModes);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('light-dark()'));
      warn.mockRestore();
    });
  });
});
