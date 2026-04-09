import { describe, expect, it } from 'vitest';
import { calc, clamp } from './css-math';

describe('calc', () => {
  it('wraps a static expression', () => {
    expect(calc`100% - 1px`).toBe('calc(100% - 1px)');
  });

  it('interpolates values', () => {
    expect(calc`100vh - 2 * ${'8px'}`).toBe('calc(100vh - 2 * 8px)');
  });

  it('interpolates numbers', () => {
    expect(calc`${16}px + 1rem`).toBe('calc(16px + 1rem)');
  });

  it('handles multiple holes', () => {
    expect(calc`${100}% - ${2} * ${'4px'}`).toBe('calc(100% - 2 * 4px)');
  });
});

describe('clamp', () => {
  it('emits clamp with three arguments', () => {
    expect(clamp('1rem', '5vw', '3rem')).toBe('clamp(1rem, 5vw, 3rem)');
  });

  it('accepts numbers where units are implied elsewhere', () => {
    expect(clamp(0, 10, 100)).toBe('clamp(0, 10, 100)');
  });
});
