import tseslint from 'typescript-eslint';
import {
  exampleBrowserJsConfig,
  exampleNodeScriptsConfig,
  typestylesAppConfig,
} from '../../eslint.base.js';

export default tseslint.config(
  ...typestylesAppConfig,
  exampleBrowserJsConfig,
  exampleNodeScriptsConfig,
  {
    ignores: ['dist/**'],
  },
);
