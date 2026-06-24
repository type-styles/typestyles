import { describe } from 'vitest';
import { noDefaultScopeInPackage } from './no-default-scope-in-package';
import { ruleTester } from '../test/rule-tester';

describe('no-default-scope-in-package', () => {
  ruleTester.run('no-default-scope-in-package', noDefaultScopeInPackage, {
    valid: [
      {
        code: `myStyles.class('card', { padding: 8 })`,
        filename: 'src/card.ts',
      },
      {
        code: `myStyles.component('button', { base: { color: 'red' } })`,
        filename: 'src/button.ts',
      },
      {
        code: `styles.hashClass({ color: 'red' })`,
        filename: 'src/a.ts',
      },
      {
        code: `other.class('card', { padding: 8 })`,
        filename: 'src/a.ts',
      },
      {
        code: `styles.compose(a, b)`,
        filename: 'src/a.ts',
      },
    ],
    invalid: [
      {
        code: `styles.class('card', { padding: 8 })`,
        filename: 'src/card.ts',
        errors: [{ messageId: 'unscopedInPackage' }],
      },
      {
        code: `styles.component('button', { base: { color: 'red' } })`,
        filename: 'src/button.ts',
        errors: [{ messageId: 'unscopedInPackage' }],
      },
      {
        code: `
          styles.class('card', { padding: 8 });
          styles.component('button', { base: { color: 'red' } });
        `,
        filename: 'src/mixed.ts',
        errors: [{ messageId: 'unscopedInPackage' }, { messageId: 'unscopedInPackage' }],
      },
    ],
  });
});
