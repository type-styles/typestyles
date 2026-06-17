import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { findShorthandLonghandConflicts } from '../utils/css-properties';
import { collectCssPropertyNames, visitStyleObjectLiterals } from '../utils/style-ast';
import { getStyleObjectArguments } from '../utils/style-calls';

export const noShorthandLonghandConflict = createRule({
  name: 'no-shorthand-longhand-conflict',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow mixing CSS shorthand and longhand properties in the same TypeStyles style object',
    },
    messages: {
      conflict:
        '`{{shorthand}}` and `{{longhand}}` must not appear in the same style object — the longhand is ignored or overridden unpredictably.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkStyleObject(obj: TSESTree.ObjectExpression) {
      const propertyNames = collectCssPropertyNames(obj);
      const conflicts = findShorthandLonghandConflicts(propertyNames);
      for (const { shorthand, longhand } of conflicts) {
        context.report({
          node: obj,
          messageId: 'conflict',
          data: { shorthand, longhand },
        });
      }
    }

    return {
      CallExpression(node) {
        for (const styleObj of getStyleObjectArguments(node)) {
          visitStyleObjectLiterals(styleObj, checkStyleObject);
        }
      },
      ObjectExpression(node) {
        // Keyframe stops: `{ from: { opacity: 0 }, to: { opacity: 1 } }`
        const parent = node.parent;
        if (
          parent?.type === 'Property' &&
          (parent.key.type === 'Identifier' || parent.key.type === 'Literal')
        ) {
          const parentKey =
            parent.key.type === 'Identifier'
              ? parent.key.name
              : typeof parent.key.value === 'string'
                ? parent.key.value
                : null;
          if (parentKey === 'from' || parentKey === 'to' || /^\d+%$/.test(parentKey ?? '')) {
            visitStyleObjectLiterals(node, checkStyleObject);
          }
        }
      },
    };
  },
});
