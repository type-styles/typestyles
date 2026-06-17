import { describe } from 'vitest';
import { noShorthandLonghandConflict } from './no-shorthand-longhand-conflict';
import { ruleTester } from '../test/rule-tester';

describe('no-shorthand-longhand-conflict', () => {
  ruleTester.run('no-shorthand-longhand-conflict', noShorthandLonghandConflict, {
    valid: [
      `styles.class('card', { paddingTop: 8, paddingBottom: 8 })`,
      `styles.class('card', { padding: 8 })`,
      `styles.class('card', {
          padding: 8,
          '&:hover': { paddingTop: 12 },
        })`,
      `styles.component('button', {
          base: { color: 'red' },
          variants: {
            size: {
              sm: { padding: 4 },
              lg: { paddingTop: 12 },
            },
          },
        })`,
    ],
    invalid: [
      {
        code: `styles.class('card', { padding: 8, paddingTop: 4 })`,
        errors: [{ messageId: 'conflict' }],
      },
      {
        code: `styles.class('card', { margin: 0, marginLeft: 4 })`,
        errors: [{ messageId: 'conflict' }],
      },
      {
        code: `styles.class('box', { border: '1px solid', borderColor: 'red' })`,
        errors: [{ messageId: 'conflict' }],
      },
    ],
  });
});
