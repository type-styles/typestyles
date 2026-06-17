import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterEach, describe, it } from 'vitest';

RuleTester.afterAll = afterEach;
RuleTester.describe = describe;
RuleTester.it = it;

export const ruleTester = new RuleTester({
  languageOptions: {
    parser: await import('@typescript-eslint/parser').then((m) => m.default),
  },
});
