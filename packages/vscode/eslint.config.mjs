import { typestylesConfig } from '../../eslint.base.js';

export default [
  ...typestylesConfig,
  {
    ignores: ['dist/**'],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
];
