import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';

function memberPropertyName(node: TSESTree.MemberExpression): string | null {
  if (node.property.type === 'Identifier' && !node.computed) return node.property.name;
  if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
    return node.property.value;
  }
  return null;
}

function objectHasScopeId(arg: TSESTree.CallExpressionArgument | undefined): boolean {
  if (!arg || arg.type !== 'ObjectExpression') return false;
  for (const prop of arg.properties) {
    if (
      prop.type === 'Property' &&
      !prop.computed &&
      prop.key.type === 'Identifier' &&
      prop.key.name === 'scopeId'
    ) {
      return true;
    }
  }
  return false;
}

function isUnscopedFactoryCall(node: TSESTree.CallExpression): boolean {
  const { callee, arguments: args } = node;
  if (callee.type !== 'Identifier') return false;
  if (callee.name !== 'createTypeStyles' && callee.name !== 'createStyles') return false;
  // createTypeStyles() / createStyles() or options object without scopeId
  if (args.length === 0) return true;
  const first = args[0];
  if (first.type === 'SpreadElement') return false; // can't statically prove
  if (first.type === 'ObjectExpression') return !objectHasScopeId(first);
  // Non-literal options (variable / call) — skip to avoid false positives
  return false;
}

function isLegacyDefaultStylesCall(node: TSESTree.CallExpression): boolean {
  const { callee } = node;
  if (callee.type !== 'MemberExpression') return false;
  const method = memberPropertyName(callee);
  if (method !== 'class' && method !== 'component' && method !== 'hashClass') return false;
  return callee.object.type === 'Identifier' && callee.object.name === 'styles';
}

export const noDefaultScopeInPackage = createRule({
  name: 'no-default-scope-in-package',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require a scoped styles factory (`createTypeStyles`/`createStyles` with `scopeId`) in publishable packages — flags unscoped factory calls and legacy `styles.*` usage',
    },
    messages: {
      unscopedFactory:
        '`{{factory}}()` without `scopeId` in a published package risks class-name collisions. Pass `scopeId` (e.g. `createTypeStyles({ scopeId: pkg.name })`).',
      unscopedInPackage:
        'Using the legacy unscoped `styles.{{method}}()` API in a published package risks class-name collisions. Use `createTypeStyles({ scopeId: pkg.name })` and call `style` / `hash` / `recipe` from that instance.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (isUnscopedFactoryCall(node)) {
          const factory = (node.callee as TSESTree.Identifier).name;
          context.report({
            node: node.callee,
            messageId: 'unscopedFactory',
            data: { factory },
          });
          return;
        }

        if (!isLegacyDefaultStylesCall(node)) return;

        const method = memberPropertyName(node.callee as TSESTree.MemberExpression) ?? 'class';

        context.report({
          node: node.callee,
          messageId: 'unscopedInPackage',
          data: { method },
        });
      },
    };
  },
});
