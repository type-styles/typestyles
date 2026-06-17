import tseslint from 'typescript-eslint';
import { exampleNodeScriptsConfig, typestylesAppConfig } from '../../eslint.base.js';

export default tseslint.config(...typestylesAppConfig, exampleNodeScriptsConfig, {
  ignores: ['dist/**'],
});
