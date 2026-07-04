import { noDefaultScopeInPackage } from './rules/no-default-scope-in-package';
import { noDuplicateNamespace } from './rules/no-duplicate-namespace';
import { noInvalidUnitlessValue } from './rules/no-invalid-unitless-value';
import { noRemovedPublicClassname } from './rules/no-removed-public-classname';
import { noShorthandLonghandConflict } from './rules/no-shorthand-longhand-conflict';

export const rules = {
  'no-default-scope-in-package': noDefaultScopeInPackage,
  'no-shorthand-longhand-conflict': noShorthandLonghandConflict,
  'no-invalid-unitless-value': noInvalidUnitlessValue,
  'no-duplicate-namespace': noDuplicateNamespace,
  'no-removed-public-classname': noRemovedPublicClassname,
};

export {
  noDefaultScopeInPackage,
  noShorthandLonghandConflict,
  noInvalidUnitlessValue,
  noDuplicateNamespace,
  noRemovedPublicClassname,
};

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
  /** Preset for publishable packages — adds `no-default-scope-in-package`. */
  package: {
    plugins: {
      '@typestyles': plugin,
    },
    rules: {
      '@typestyles/no-shorthand-longhand-conflict': 'error',
      '@typestyles/no-invalid-unitless-value': 'error',
      '@typestyles/no-duplicate-namespace': 'error',
      '@typestyles/no-default-scope-in-package': 'error',
    },
  },
};

Object.assign(plugin, { configs });

export default plugin;
