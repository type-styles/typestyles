import tseslint from 'typescript-eslint';
import { typestylesConfig } from '../../eslint.base.js';

export default tseslint.config(...typestylesConfig, {
  ignores: ['**/dist/**'],
});
