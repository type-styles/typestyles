import { describe } from 'vitest';
import { noInvalidUnitlessValue } from './no-invalid-unitless-value';
import { ruleTester } from '../test/rule-tester';

describe('no-invalid-unitless-value', () => {
  ruleTester.run('no-invalid-unitless-value', noInvalidUnitlessValue, {
    valid: [
      `styles.class('card', { width: 100 })`,
      `styles.class('card', { width: '100px' })`,
      `styles.class('text', { lineHeight: 1.5 })`,
      `styles.class('text', { lineHeight: '24px' })`,
      `styles.class('text', { fontWeight: 700 })`,
      `styles.class('media', { aspectRatio: 1.5 })`,
    ],
    invalid: [
      {
        code: `styles.class('card', { width: '100' })`,
        errors: [{ messageId: 'bareNumberString' }],
      },
      {
        code: `styles.class('card', { padding: '16' })`,
        errors: [{ messageId: 'bareNumberString' }],
      },
      {
        code: `styles.class('text', { lineHeight: 24 })`,
        errors: [{ messageId: 'suspiciousUnitlessNumber' }],
      },
    ],
  });
});
