import { describe, it, expect } from 'vitest';
import { cx } from './cx.js';

describe('cx', () => {
  it('joins multiple class strings', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out false', () => {
    // eslint-disable-next-line no-constant-binary-expression
    expect(cx('a', false && 'b', 'c')).toBe('a c');
  });

  it('filters out undefined', () => {
    expect(cx('a', undefined, 'c')).toBe('a c');
  });

  it('filters out null', () => {
    expect(cx('a', null, 'c')).toBe('a c');
  });

  it('filters out empty string', () => {
    expect(cx('a', '', 'c')).toBe('a c');
  });

  it('filters out 0', () => {
    expect(cx('a', 0, 'c')).toBe('a c');
  });

  it('returns empty string when all parts are falsy', () => {
    expect(cx(false, undefined, null, '')).toBe('');
  });

  it('returns empty string when called with no arguments', () => {
    expect(cx()).toBe('');
  });

  it('handles a single class', () => {
    expect(cx('only')).toBe('only');
  });

  it('works with conditional expressions', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cx('btn', isActive && 'active', isDisabled && 'disabled')).toBe('btn active');
  });

  it('preserves spaces within individual class strings', () => {
    // If someone passes a pre-joined string, it passes through unchanged
    expect(cx('btn-base btn-primary', 'extra')).toBe('btn-base btn-primary extra');
  });
});
