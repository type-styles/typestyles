import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import { configs as typestylesEslintConfigs } from '@typestyles/eslint-plugin';

export const typestylesConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true },
      ],
      'no-constant-binary-expression': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-prototype-builtins': 'error',
    },
  },
);

/** Examples, docs, and other TypeStyles app surfaces — includes `@typestyles/eslint-plugin`. */
export const typestylesAppConfig = tseslint.config(
  ...typestylesConfig,
  typestylesEslintConfigs.recommended,
);

/** Plain browser JS in examples (e.g. `src/main.js`). */
export const exampleBrowserJsConfig = {
  files: ['src/**/*.js'],
  languageOptions: {
    globals: {
      ...globals.browser,
    },
  },
};

/** Node build/verify scripts in examples. */
export const exampleNodeScriptsConfig = {
  files: ['scripts/**/*.{js,mjs,cjs}', 'build.mjs'],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
};
