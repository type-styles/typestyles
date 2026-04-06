import { describe, it, expect, beforeEach, expectTypeOf } from 'vitest';
import { createVar, assignVars, __resetVarCounter } from './vars';
import type { CSSVarRef, ComponentVariants, ComponentFunction } from './types';

describe('createVar', () => {
  beforeEach(() => {
    __resetVarCounter();
  });

  it('returns a var() string matching var(--ts-N)', () => {
    const v = createVar();
    expect(v).toMatch(/^var\(--ts-\d+\)$/);
  });

  it('returns different strings on consecutive calls', () => {
    const a = createVar();
    const b = createVar();
    expect(a).not.toBe(b);
  });

  it('increments the counter sequentially', () => {
    const a = createVar();
    const b = createVar();
    expect(a).toBe('var(--ts-1)');
    expect(b).toBe('var(--ts-2)');
  });

  it('returns a CSSVarRef type', () => {
    const v = createVar();
    expectTypeOf(v).toMatchTypeOf<CSSVarRef>();
  });
});

describe('assignVars', () => {
  beforeEach(() => {
    __resetVarCounter();
  });

  it('maps a single var ref to its value', () => {
    const myVar = createVar(); // 'var(--ts-1)'
    expect(assignVars({ [myVar]: 'red' })).toEqual({ '--ts-1': 'red' });
  });

  it('maps multiple var refs in one call', () => {
    const a = createVar(); // 'var(--ts-1)'
    const b = createVar(); // 'var(--ts-2)'
    expect(assignVars({ [a]: 'red', [b]: 'blue' })).toEqual({
      '--ts-1': 'red',
      '--ts-2': 'blue',
    });
  });

  it('skips null and undefined values', () => {
    const a = createVar();
    const b = createVar();
    const result = assignVars({
      [a]: 'red',
      [b]: undefined,
    } as Partial<Record<CSSVarRef, string>>);
    expect(result).toEqual({ '--ts-1': 'red' });
    expect('--ts-2' in result).toBe(false);
  });

  it('returns an empty object for empty input', () => {
    expect(assignVars({})).toEqual({});
  });

  it('return type is Record<string, string>', () => {
    const v = createVar();
    const result = assignVars({ [v]: 'red' });
    expectTypeOf(result).toMatchTypeOf<Record<string, string>>();
  });
});

describe('ComponentVariants', () => {
  it('extracts variant prop types from a ComponentFunction', () => {
    type MockFn = ComponentFunction<{
      intent: { primary: object; ghost: object };
      size: { sm: object; lg: object };
    }>;

    type Props = ComponentVariants<MockFn>;

    expectTypeOf<Props>().toMatchTypeOf<{
      intent?: 'primary' | 'ghost';
      size?: 'sm' | 'lg';
    }>();
  });

  it('resolves to never for non-ComponentFunction types', () => {
    type Props = ComponentVariants<string>;
    expectTypeOf<Props>().toBeNever();
  });
});
