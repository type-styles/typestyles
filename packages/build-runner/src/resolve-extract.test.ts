import { describe, it, expect } from 'vitest';
import { resolveExtractModules, resolveRegisteredComponentsFrom } from './resolve-extract';

describe('resolveExtractModules', () => {
  it('does not duplicate modules when include is allRegisteredComponents', () => {
    const modules = resolveExtractModules('/tmp', {
      modules: ['src/styles.ts', 'src/recipes/index.ts'],
      include: 'allRegisteredComponents',
    });
    expect(modules).toEqual(['src/styles.ts', 'src/recipes/index.ts']);
  });

  it('adds registeredComponentsModule when not already in modules list', () => {
    const modules = resolveExtractModules('/tmp', {
      modules: ['src/entry.ts'],
      registeredComponentsModule: 'src/themeable-refs.ts',
    });
    expect(modules).toEqual(['src/entry.ts', 'src/themeable-refs.ts']);
  });
});

describe('resolveRegisteredComponentsFrom', () => {
  it('returns the first extract module for allRegisteredComponents', () => {
    expect(
      resolveRegisteredComponentsFrom({ include: 'allRegisteredComponents' }, [
        'src/typestyles-entry.ts',
        'src/recipes/index.ts',
      ]),
    ).toBe('src/typestyles-entry.ts');
  });

  it('returns undefined when include is not set', () => {
    expect(resolveRegisteredComponentsFrom(undefined, ['src/entry.ts'])).toBeUndefined();
  });
});
