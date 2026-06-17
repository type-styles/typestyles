import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { BARE_NUMBER_STRING_RE, isUnitlessProperty } from '../utils/css-properties';
import {
  getNumericLiteralValue,
  getStaticPropertyKey,
  getStringLiteralValue,
  isCssPropertyKey,
  visitStyleObjectLiterals,
} from '../utils/style-ast';
import { getStyleObjectArguments } from '../utils/style-calls';

export const noInvalidUnitlessValue = createRule({
  name: 'no-invalid-unitless-value',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow bare numeric strings on properties that require CSS units (TypeStyles only auto-appends `px` to numbers, not strings)',
    },
    messages: {
      bareNumberString:
        '`{{property}}` is set to bare number string `{{value}}`, which emits invalid CSS. Use a number (`{{numeric}}`) or a value with units (`{{value}}px`).',
      suspiciousUnitlessNumber:
        '`{{property}}` is unitless in CSS — numeric `{{value}}` is emitted without a unit. Use a ratio (e.g. `1.5`) or an explicit length (`"24px"`).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          checkSuspiciousUnitlessNumbers: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ checkSuspiciousUnitlessNumbers: true }],
  create(context, [options]) {
    /** Properties where a large integer usually means the author meant a length, not a unitless ratio. */
    const SUSPICIOUS_UNITLESS_PROPERTIES = new Set(['lineHeight']);

    function checkStyleObject(obj: TSESTree.ObjectExpression) {
      for (const prop of obj.properties) {
        if (prop.type !== 'Property') continue;
        const key = getStaticPropertyKey(prop);
        if (!key || !isCssPropertyKey(key)) continue;

        const stringValue = getStringLiteralValue(prop.value);
        if (stringValue && BARE_NUMBER_STRING_RE.test(stringValue) && !isUnitlessProperty(key)) {
          context.report({
            node: prop.value,
            messageId: 'bareNumberString',
            data: {
              property: key,
              value: stringValue,
              numeric: stringValue,
            },
          });
          continue;
        }

        if (options.checkSuspiciousUnitlessNumbers && SUSPICIOUS_UNITLESS_PROPERTIES.has(key)) {
          const num = getNumericLiteralValue(prop.value);
          if (num != null && num >= 8 && Number.isInteger(num)) {
            context.report({
              node: prop.value,
              messageId: 'suspiciousUnitlessNumber',
              data: { property: key, value: String(num) },
            });
          }
        }
      }
    }

    return {
      CallExpression(node) {
        for (const styleObj of getStyleObjectArguments(node)) {
          visitStyleObjectLiterals(styleObj, checkStyleObject);
        }
      },
      ObjectExpression(node) {
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
