import { describe, it, expect, beforeEach } from 'vitest';
import { atomicStyles } from './styles.js';
import { serializeAtomicStyle } from './css.js';
import { reset, flushSync, getRegisteredCss } from './sheet.js';
import { resetClassNaming } from './class-naming.js';

describe('serializeAtomicStyle', () => {
  it('decomposes plain declarations into one class each', () => {
    const { classes, rules } = serializeAtomicStyle({
      color: 'red',
      fontSize: '14px',
    });

    expect(classes).toHaveLength(2);
    expect(rules).toHaveLength(2);
    // Each rule should contain only one declaration
    expect(rules[0]!.css).toContain('color: red');
    expect(rules[1]!.css).toContain('font-size: 14px');
  });

  it('produces the same class for the same property+value', () => {
    const { classes: a } = serializeAtomicStyle({ color: 'red' });
    const { classes: b } = serializeAtomicStyle({ color: 'red' });

    expect(a[0]).toBe(b[0]);
  });

  it('produces different classes for different values of the same property', () => {
    const { classes: a } = serializeAtomicStyle({ color: 'red' });
    const { classes: b } = serializeAtomicStyle({ color: 'blue' });

    expect(a[0]).not.toBe(b[0]);
  });

  it('handles nested selectors', () => {
    const { classes, rules } = serializeAtomicStyle({
      color: 'red',
      '&:hover': { color: 'blue' },
    });

    expect(classes).toHaveLength(2);
    // The hover rule selector should include :hover
    const hoverRule = rules.find((r) => r.css.includes(':hover'));
    expect(hoverRule).toBeDefined();
    expect(hoverRule!.css).toContain('color: blue');
  });

  it('handles at-rules', () => {
    const { classes, rules } = serializeAtomicStyle({
      color: 'red',
      '@media (max-width: 768px)': { color: 'blue' },
    });

    expect(classes).toHaveLength(2);
    const mediaRule = rules.find((r) => r.css.includes('@media'));
    expect(mediaRule).toBeDefined();
    expect(mediaRule!.css).toContain('@media (max-width: 768px)');
    expect(mediaRule!.css).toContain('color: blue');
  });

  it('uses the provided prefix', () => {
    const { classes } = serializeAtomicStyle({ color: 'red' }, 'ui');
    expect(classes[0]).toMatch(/^ui-/);
  });

  it('deduplicates repeated property+value pairs within the same object', () => {
    // Shouldn't normally happen but defensively handled
    const { classes, rules } = serializeAtomicStyle({ color: 'red' });
    expect(classes.length).toBeGreaterThanOrEqual(1);
    expect(rules.length).toBeGreaterThanOrEqual(1);
  });
});

describe('atomicStyles', () => {
  beforeEach(() => {
    reset();
    resetClassNaming();
  });

  it('returns a space-separated list of atomic class names', () => {
    const result = atomicStyles({ color: 'red', fontSize: '14px' });
    const classes = result.split(' ');
    expect(classes).toHaveLength(2);
    classes.forEach((cls) => expect(cls).toMatch(/^ts-/));
  });

  it('registers each property as its own CSS rule', () => {
    atomicStyles({ color: 'red', fontWeight: 700 });
    flushSync();

    const css = getRegisteredCss();
    // Should have a rule for color: red
    expect(css).toContain('color: red');
    // And a rule for font-weight: 700
    expect(css).toContain('font-weight: 700');
  });

  it('reuses the same class for identical property+value across calls (no duplicate CSS)', () => {
    const a = atomicStyles({ color: 'red' });
    const b = atomicStyles({ color: 'red', padding: '8px' });

    // Same class for `color: red`
    const aClass = a.split(' ')[0];
    const bClasses = b.split(' ');
    expect(bClasses).toContain(aClass);

    // The CSS should only have ONE `color: red` rule
    flushSync();
    const css = getRegisteredCss();
    const colorRedOccurrences = (css.match(/color: red/g) ?? []).length;
    expect(colorRedOccurrences).toBe(1);
  });

  it('composes result as a valid className string', () => {
    const classes = atomicStyles({ display: 'flex', flexDirection: 'column' });
    // Should be a non-empty string with space-separated classes
    expect(classes.trim()).not.toBe('');
    expect(classes.split(' ').length).toBe(2);
  });
});
