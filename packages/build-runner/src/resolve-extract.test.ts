import { describe, it, expect } from 'vitest';
import { resolveExtractModules } from './resolve-extract';

describe('resolveExtractModules', () => {
  it('appends registeredComponentsModule when include allRegisteredComponents', () => {
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
