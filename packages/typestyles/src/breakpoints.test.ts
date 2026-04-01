import { describe, it, expect, beforeEach } from 'vitest';
import { createComponent } from './component.js';
import { reset, flushSync, getRegisteredCss } from './sheet.js';
import { resetClassNaming } from './class-naming.js';
import { configureBreakpoints, resetBreakpoints } from './breakpoints.js';

describe('responsive variants', () => {
  beforeEach(() => {
    reset();
    resetClassNaming();
    resetBreakpoints();
  });

  it('generates breakpoint-prefixed classes when breakpoints are configured', () => {
    configureBreakpoints({ sm: '640px', md: '768px' });

    createComponent('btn', {
      variants: {
        size: {
          sm: { fontSize: '12px' },
          lg: { fontSize: '18px' },
        },
      },
    });

    const css = getRegisteredCss();
    // Should generate media-query-wrapped classes for each breakpoint + variant combo
    expect(css).toContain('@media (min-width: 640px)');
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('sm-btn-size-sm');
    expect(css).toContain('md-btn-size-lg');
  });

  it('accepts plain variant values (backward-compatible)', () => {
    configureBreakpoints({ md: '768px' });

    const btn = createComponent('plain', {
      variants: {
        size: {
          sm: { fontSize: '12px' },
          lg: { fontSize: '18px' },
        },
      },
    });

    expect(btn({ size: 'sm' })).toBe('plain-size-sm');
    expect(btn({ size: 'lg' })).toBe('plain-size-lg');
  });

  it('accepts responsive variant objects', () => {
    configureBreakpoints({ md: '768px', lg: '1024px' });

    const btn = createComponent('resp', {
      base: { display: 'inline-flex' },
      variants: {
        size: {
          sm: { fontSize: '12px' },
          lg: { fontSize: '18px' },
        },
      },
    });

    const result = btn({ size: { initial: 'sm', md: 'lg' } });
    expect(result).toContain('resp-base');
    expect(result).toContain('resp-size-sm');   // initial value
    expect(result).toContain('md-resp-size-lg'); // md breakpoint value
    expect(result).not.toContain('lg-');         // lg not specified, should not appear
  });

  it('handles responsive objects without an initial value', () => {
    configureBreakpoints({ md: '768px' });

    const btn = createComponent('noinit', {
      variants: {
        size: {
          sm: { fontSize: '12px' },
          lg: { fontSize: '18px' },
        },
      },
    });

    const result = btn({ size: { md: 'lg' } });
    const classes = result.split(' ');
    expect(classes).toContain('md-noinit-size-lg');
    // Base variant class should not appear (no initial value)
    expect(classes).not.toContain('noinit-size-sm');
    expect(classes).not.toContain('noinit-size-lg');
  });

  it('does not generate breakpoint classes when no breakpoints are configured', () => {
    createComponent('nobp', {
      variants: {
        size: {
          sm: { fontSize: '12px' },
        },
      },
    });

    const css = getRegisteredCss();
    expect(css).not.toContain('@media');
  });

  it('wraps breakpoint classes in the correct media queries', () => {
    configureBreakpoints({ md: '768px' });

    createComponent('mq', {
      variants: {
        color: {
          red: { color: 'red' },
          blue: { color: 'blue' },
        },
      },
    });

    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('md-mq-color-red');
    expect(css).toContain('md-mq-color-blue');
  });
});
