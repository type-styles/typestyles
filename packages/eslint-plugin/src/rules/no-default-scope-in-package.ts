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
  // Flat API from an unscoped `createTypeStyles()` destructure (or legacy default export).
  if (callee.type === 'Identifier') {
    return callee.name === 'style' || callee.name === 'recipe';
  }
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
        'Require a scoped styles factory (`createTypeStyles`/`createStyles` with `scopeId`) instead of unscoped `style` / `recipe` (or the legacy `styles` API) in publishable packages',
    },
    messages: {
      unscopedInPackage:
        'Using unscoped `{{method}}()` in a published package risks class-name collisions. Use `createTypeStyles({ scopeId: pkg.name })` (or `createStyles({ scopeId })`) and call `style` / `recipe` from that instance.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isDefaultStylesCall(node)) return;

        const { callee } = node;
        const method =
          callee.type === 'Identifier'
            ? callee.name
            : (memberPropertyName(callee as TSESTree.MemberExpression) ?? 'style');

        context.report({
          node: node.callee,
          messageId: 'unscopedInPackage',
          data: { method },
        });
      },
    };
  },
});
