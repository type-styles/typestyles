import { describe, it, expect, beforeEach } from 'vitest';
import { styles, reset, getRegisteredCss } from 'typestyles';
import { defineProperties, createProps } from './index';

describe('integration with typestyles', () => {
  beforeEach(() => {
    reset();
  });

  it('works with styles.compose()', () => {
    const base = styles.component('base', {
      base: { padding: '8px' },
    });

    const atoms = createProps(
      'atoms',
      defineProperties({
        properties: {
          display: ['flex', 'block'],
        },
      }),
    );

    // Compose with string result from props function
    const atomClasses = atoms({ display: 'flex' });
    const composed = styles.compose(base, atomClasses);
    const result = composed();

    expect(result).toBe('base-base atoms-display-flex');
  });

  it('generates CSS that appears in getRegisteredCss()', () => {
    const atoms = createProps(
      'atoms',
      defineProperties({
        properties: {
          display: ['flex', 'block'],
          padding: { 0: '0', 1: '4px', 2: '8px' },
        },
      }),
    );

    atoms({ display: 'flex', padding: 1 });

    const css = getRegisteredCss();
    expect(css).toContain('.atoms-display-flex');
    expect(css).toContain('display: flex');
    expect(css).toContain('.atoms-padding-1');
    expect(css).toContain('padding: 4px');
  });

  it('handles responsive props with styles.compose()', () => {
    const layout = styles.component('layout', {
      base: { maxWidth: '1200px' },
    });

    const responsive = createProps(
      'responsive',
      defineProperties({
        conditions: {
          mobile: { '@media': '(min-width: 768px)' },
        },
        properties: {
          display: ['flex', 'block', 'grid'],
        },
      }),
    );

    // Compose with string result from props function
    const responsiveClasses = responsive({ display: { mobile: 'grid' } });
    const composed = styles.compose(layout, responsiveClasses);
    const result = composed();

    expect(result).toBe('layout-base responsive-display-mobile-grid');
  });
});
