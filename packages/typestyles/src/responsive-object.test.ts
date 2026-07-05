import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveBreakpoints,
  isResponsiveObject,
  expandResponsiveProperty,
  expandResponsiveInProperties,
  validateResponsiveObject,
} from './breakpoints';
import { serializeStyle } from './css';
import { createStyles } from './styles';
import { createTokens } from './tokens';
import { decomposeAtomicStyle } from './atomic-decompose';
import { mergeClassNaming } from './class-naming';
import { reset, getRegisteredCss } from './sheet';
import { registeredNamespaces } from './registry';

const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
};

describe('resolveBreakpoints', () => {
  it('returns explicit breakpoint map', () => {
    expect(resolveBreakpoints(breakpoints)).toEqual(breakpoints);
  });

  it('merges fromTokens with explicit entries winning on overlap', () => {
    const tokens = createTokens();
    const media = tokens.create('media', {
      sm: '(min-width: 640px)',
      md: '(min-width: 768px)',
    });

    expect(
      resolveBreakpoints({
        fromTokens: media,
        md: '(min-width: 800px)',
        lg: '(min-width: 1024px)',
      }),
    ).toEqual({
      sm: '(min-width: 640px)',
      md: '(min-width: 800px)',
      lg: '(min-width: 1024px)',
    });
  });
});

describe('expandResponsiveProperty', () => {
  it('expands base and breakpoint values into declarations and @media keys', () => {
    const expanded = expandResponsiveProperty('padding', { base: '8px', md: '16px' }, breakpoints);

    expect(expanded).toEqual({
      padding: '8px',
      '@media (min-width: 768px)': { padding: '16px' },
    });
  });

  it('treats _ as an alias for base', () => {
    const expanded = expandResponsiveProperty('padding', { _: '8px', md: '16px' }, breakpoints);

    expect(expanded.padding).toBe('8px');
  });

  it('emits only @media rules when base is omitted', () => {
    const expanded = expandResponsiveProperty('padding', { md: '16px' }, breakpoints);

    expect(expanded).toEqual({
      '@media (min-width: 768px)': { padding: '16px' },
    });
  });

  it('merges multiple properties into the same @media block', () => {
    const merged = expandResponsiveInProperties(
      {
        paddingLeft: { md: '24px' },
        paddingRight: { md: '24px' },
      },
      breakpoints,
    );

    expect(merged['@media (min-width: 768px)']).toEqual({
      paddingLeft: '24px',
      paddingRight: '24px',
    });
  });
});

describe('validateResponsiveObject', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('throws for unknown breakpoint keys', () => {
    expect(() => validateResponsiveObject('padding', { foo: '8px' }, breakpoints)).toThrow(
      /Unknown breakpoint "foo"/,
    );
  });

  it('throws for nested object values', () => {
    expect(() =>
      validateResponsiveObject(
        'padding',
        { md: { color: 'red' } as unknown as string },
        breakpoints,
      ),
    ).toThrow(/non-scalar entry/);
  });

  it('throws when breakpoints are unset', () => {
    expect(() => validateResponsiveObject('padding', { base: '8px' }, undefined)).toThrow(
      /requires `breakpoints`/,
    );
  });
});

describe('serializeStyle with responsive objects', () => {
  it('serializes responsive padding into base and @media rules', () => {
    const rules = serializeStyle(
      '.container-base',
      { padding: { base: '8px', md: '16px' } },
      { breakpoints },
    );

    expect(rules.map((r) => r.css)).toEqual([
      '.container-base { padding: 8px; }',
      '@media (min-width: 768px) { .container-base { padding: 16px; } }',
    ]);
  });

  it('expands responsive values inside pseudo selectors', () => {
    const rules = serializeStyle(
      '.button',
      {
        opacity: 1,
        '&:hover': { opacity: { base: 0.9, md: 1 } },
      },
      { breakpoints },
    );

    expect(rules.map((r) => r.css)).toEqual([
      '.button { opacity: 1; }',
      '.button:hover { opacity: 0.9; }',
      '@media (min-width: 768px) { .button:hover { opacity: 1; } }',
    ]);
  });

  it('combines manual @media keys with responsive objects', () => {
    const rules = serializeStyle(
      '.card',
      {
        display: 'flex',
        padding: { base: '8px', md: '16px' },
        '@media (min-width: 768px)': { gap: '12px' },
      },
      { breakpoints },
    );

    const css = rules.map((r) => r.css);
    expect(css[0]).toBe('.card { display: flex; padding: 8px; }');
    expect(css.some((c) => c.includes('padding: 16px'))).toBe(true);
    expect(css.some((c) => c.includes('gap: 12px'))).toBe(true);
  });
});

describe('createStyles integration', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('serializes responsive component styles when breakpoints are configured', () => {
    const styles = createStyles({ scopeId: 'test', breakpoints });
    styles.component('container', {
      base: {
        padding: { base: '8px', md: '16px' },
      },
    });

    const css = getRegisteredCss();
    expect(css).toContain('padding: 8px');
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('padding: 16px');
  });

  it('throws in development when breakpoints are unset', () => {
    const styles = createStyles({ scopeId: 'test-no-bp' });
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    expect(() =>
      styles.component('bad', {
        base: { padding: { base: '8px', md: '16px' } },
      }),
    ).toThrow(/requires `breakpoints`/);

    process.env.NODE_ENV = originalEnv;
  });
});

describe('atomic mode responsive objects', () => {
  const cfg = mergeClassNaming({ mode: 'atomic', prefix: 'a', breakpoints });

  it('wraps breakpoint-specific declarations in @media blocks', () => {
    const { rules } = decomposeAtomicStyle(cfg, {
      padding: { base: '8px', md: '16px' },
    });

    expect(rules).toHaveLength(2);
    expect(rules[0]?.css).toMatch(/^\.a-[a-z0-9]+ \{ padding: 8px; \}$/);
    expect(rules[1]?.css).toMatch(
      /^@media \(min-width: 768px\) \{ \.a-[a-z0-9]+ \{ padding: 16px; \} \}$/,
    );
  });
});

describe('isResponsiveObject', () => {
  it('detects responsive objects with configured breakpoints', () => {
    expect(isResponsiveObject({ base: '8px', md: '16px' }, breakpoints)).toBe(true);
    expect(isResponsiveObject({ md: '16px' }, breakpoints)).toBe(true);
    expect(isResponsiveObject({ foo: '8px' }, breakpoints)).toBe(false);
  });
});

describe('base and _ alias warning', () => {
  it('warns when both base and _ are present', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expandResponsiveProperty('padding', { base: '8px', _: '4px', md: '16px' }, breakpoints);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('both `base` and `_`'));
    warn.mockRestore();
  });
});
