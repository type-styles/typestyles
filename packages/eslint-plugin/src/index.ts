import noDuplicateNamespace from './rules/no-duplicate-namespace.js';
import noUnsafeNamespace from './rules/no-unsafe-namespace.js';
import noUnregisteredTokenUse from './rules/no-unregistered-token-use.js';
import type { Rule, Linter } from 'eslint';

const rules: Record<string, Rule.RuleModule> = {
  'no-duplicate-namespace': noDuplicateNamespace,
  'no-unsafe-namespace': noUnsafeNamespace,
  'no-unregistered-token-use': noUnregisteredTokenUse,
};

const recommendedRules: Linter.RulesRecord = {
  '@typestyles/no-duplicate-namespace': 'error',
  '@typestyles/no-unsafe-namespace': 'warn',
  '@typestyles/no-unregistered-token-use': 'off', // opt-in (cross-file limitation)
};

/**
 * ESLint plugin for typestyles.
 *
 * @example Flat config (eslint.config.js):
 * ```js
 * import typestyles from '@typestyles/eslint-plugin';
 *
 * export default [
 *   typestyles.configs.recommended,
 *   // your other configs…
 * ];
 * ```
 *
 * @example Legacy config (.eslintrc):
 * ```json
 * {
 *   "plugins": ["@typestyles"],
 *   "extends": ["plugin:@typestyles/recommended"]
 * }
 * ```
 */
const plugin = {
  meta: {
    name: '@typestyles/eslint-plugin',
    version: '0.1.0',
  },
  rules,
  configs: {
    /** Flat-config recommended preset. */
    recommended: {
      plugins: {} as Record<string, typeof plugin>,
      rules: recommendedRules,
    },
  },
};

// Self-reference so `configs.recommended.plugins['@typestyles']` resolves correctly
plugin.configs.recommended.plugins['@typestyles'] = plugin;

export default plugin;
export { rules };
