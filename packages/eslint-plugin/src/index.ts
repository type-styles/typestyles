import { noDuplicateNamespace } from './rules/no-duplicate-namespace';
import { noInvalidUnitlessValue } from './rules/no-invalid-unitless-value';
import { noShorthandLonghandConflict } from './rules/no-shorthand-longhand-conflict';

export const rules = {
  'no-shorthand-longhand-conflict': noShorthandLonghandConflict,
  'no-invalid-unitless-value': noInvalidUnitlessValue,
  'no-duplicate-namespace': noDuplicateNamespace,
};

export { noShorthandLonghandConflict, noInvalidUnitlessValue, noDuplicateNamespace };

const plugin = {
  meta: {
    name: '@typestyles/eslint-plugin',
    version: '0.1.0',
  },
  rules,
};

/** Flat-config preset for TypeStyles projects. */
export const configs = {
  recommended: {
    plugins: {
      '@typestyles': plugin,
    },
    rules: {
      '@typestyles/no-shorthand-longhand-conflict': 'error',
      '@typestyles/no-invalid-unitless-value': 'error',
      '@typestyles/no-duplicate-namespace': 'error',
    },
  },
};

Object.assign(plugin, { configs });

export default plugin;
