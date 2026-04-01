import tseslint from 'typescript-eslint';
import { typestylesConfig } from './eslint.base.js';

export default tseslint.config(...typestylesConfig, {
  ignores: [
    '**/dist/**',
    '**/node_modules/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/.next/**',
    'docs/.content-collections/**',
    'scripts/**',
  ],
});
