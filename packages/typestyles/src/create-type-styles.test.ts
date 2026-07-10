import { describe, it, expect, beforeEach } from 'vitest';
import { reset } from './sheet';
import { createTypeStyles } from './create-type-styles';

describe('createTypeStyles', () => {
  beforeEach(() => {
    reset();
  });

  it('createTypeStyles({ mode: "attribute" }) returns an attrs-returning styles API', () => {
    const { styles } = createTypeStyles({ mode: 'attribute', scopeId: 'cts-attr' });
    const btn = styles.component('tbtn', {
      base: { padding: '8px' },
      variants: { variant: { primary: { color: 'blue' } } },
    });
    expect(btn({ variant: 'primary' }).attrs).toEqual({ 'data-variant': 'primary' });
  });
});
