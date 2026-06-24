import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';

function memberPropertyName(node: TSESTree.MemberExpression): string | null {
  if (node.property.type === 'Identifier' && !node.computed) return node.property.name;
  if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
    return node.property.value;
  }
  return null;
}

function isDefaultStylesCall(node: TSESTree.CallExpression): boolean {
  const { callee } = node;
  if (callee.type !== 'MemberExpression') return false;
  const method = memberPropertyName(callee);
  if (method !== 'class' && method !== 'component') return false;

  if (callee.object.type === 'Identifier') {
    return callee.object.name === 'styles';
  }
  return false;
}

export const noDefaultScopeInPackage = createRule({
  name: 'no-default-scope-in-package',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require a scoped styles factory (`createTypeStyles`/`createStyles` with `scopeId`) instead of the default `styles` export in publishable packages',
    },
    messages: {
      unscopedInPackage:
        'Using the default `styles.{{method}}()` in a published package risks class-name collisions. Use `createTypeStyles({ scopeId: pkg.name })` or `createStyles({ scopeId })` instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isDefaultStylesCall(node)) return;

        const method = memberPropertyName(node.callee as TSESTree.MemberExpression);

        context.report({
          node: node.callee,
          messageId: 'unscopedInPackage',
          data: { method: method ?? 'class' },
        });
      },
    };
  },
});
