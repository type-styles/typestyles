import { describe, it, expect } from 'vitest';
import { atRuleBlock } from './at-rule-block.js';
import { container } from './container.js';
import type { CSSProperties } from './types.js';

describe('atRuleBlock', () => {
  it('returns a one-key object for runtime merge', () => {
    expect(atRuleBlock('@media (max-width: 1px)', { display: 'none' })).toEqual({
      '@media (max-width: 1px)': { display: 'none' },
    });
  });

  it('spreads into CSSProperties without assertion', () => {
    const key = container({ minWidth: 400 });
    const merged: CSSProperties = {
      color: 'blue',
      ...atRuleBlock(key, { display: 'grid' }),
    };
    expect(merged[key]).toEqual({ display: 'grid' });
  });
});
