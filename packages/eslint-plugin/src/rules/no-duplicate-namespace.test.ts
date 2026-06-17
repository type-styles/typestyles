import { beforeEach, describe } from 'vitest';
import { noDuplicateNamespace, resetNamespaceRegistry } from './no-duplicate-namespace';
import { ruleTester } from '../test/rule-tester';

describe('no-duplicate-namespace', () => {
  beforeEach(() => {
    resetNamespaceRegistry();
  });

  ruleTester.run('no-duplicate-namespace', noDuplicateNamespace, {
    valid: [
      {
        code: `styles.class('card', { padding: 8 })`,
        filename: 'a.ts',
      },
      {
        code: `styles.class('hero', { display: 'flex' })`,
        filename: 'b.ts',
      },
      {
        code: `tokens.create('color', { primary: '#00f' })`,
        filename: 'tokens.ts',
      },
    ],
    invalid: [
      {
        code: `
            styles.class('card', { padding: 8 });
            styles.class('card', { margin: 0 });
          `,
        filename: 'dup.ts',
        errors: [{ messageId: 'duplicateInFile' }],
      },
    ],
  });
});

describe('no-duplicate-namespace / cross file', () => {
  resetNamespaceRegistry();

  ruleTester.run('no-duplicate-namespace-seed', noDuplicateNamespace, {
    valid: [
      {
        code: `styles.component('button', { base: { color: 'red' } })`,
        filename: 'first.ts',
      },
    ],
    invalid: [],
  });

  ruleTester.run('no-duplicate-namespace-collision', noDuplicateNamespace, {
    valid: [],
    invalid: [
      {
        code: `styles.class('button', { padding: 4 })`,
        filename: 'second.ts',
        errors: [{ messageId: 'duplicateAcrossFiles' }],
      },
    ],
  });
});
