import tseslint from 'typescript-eslint';
import { typestylesAppConfig } from '../../eslint.base.js';

export default tseslint.config(...typestylesAppConfig, {
  ignores: ['.next/**'],
});
