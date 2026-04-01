import type { Rule } from 'eslint';

/**
 * Warns when `tokens.use()` is called with a namespace that is not registered
 * in the same **file** via `tokens.create()` or `tokens.createContract()`.
 *
 * This is a static, file-scope check. For cross-file usage, typestyles
 * already issues a runtime console.warn in development. This rule catches
 * the common case where a `use()` call exists without any corresponding
 * `create()` in the same module (e.g. forgetting the import).
 *
 * @example
 * ```ts
 * // ❌ No tokens.create('color', ...) in this file
 * const c = tokens.use('color');
 *
 * // ✅ Create or import before use
 * const color = tokens.create('color', { primary: '#0066ff' });
 * const c = tokens.use('color'); // fine — same file
 * ```
 */
const noUnregisteredTokenUse: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when tokens.use() references a namespace not created in the same file.',
      recommended: false,
      url: 'https://typestyles.dev/docs/eslint-plugin/no-unregistered-token-use',
    },
    schema: [],
    messages: {
      unregistered:
        'tokens.use("{{namespace}}") references a namespace that is not created in this file. ' +
        'Import the token reference from the file where tokens.create("{{namespace}}", ...) is called, ' +
        'or add a tokens.create call here.',
    },
  },
  create(context) {
    /** Namespaces created in this file via tokens.create / tokens.createContract. */
    const createdNamespaces = new Set<string>();
    /** Use calls: namespace → node, collected during the traversal. */
    const useCalls: Array<{ namespace: string; node: Rule.Node }> = [];

    return {
      CallExpression(node) {
        const { callee, arguments: args } = node;
        if (
          callee.type !== 'MemberExpression' ||
          callee.object.type !== 'Identifier' ||
          callee.object.name !== 'tokens' ||
          callee.property.type !== 'Identifier'
        ) {
          return;
        }

        const method = callee.property.name;
        const firstArg = args[0];
        if (!firstArg || firstArg.type !== 'Literal' || typeof firstArg.value !== 'string') {
          return;
        }

        const namespace = firstArg.value;

        if (method === 'create' || method === 'createContract') {
          createdNamespaces.add(namespace);
        } else if (method === 'use') {
          useCalls.push({ namespace, node: firstArg as unknown as Rule.Node });
        }
      },

      // After traversal, check all use() calls against created namespaces
      'Program:exit'() {
        for (const { namespace, node } of useCalls) {
          if (!createdNamespaces.has(namespace)) {
            context.report({
              node,
              messageId: 'unregistered',
              data: { namespace },
            });
          }
        }
      },
    };
  },
};

export default noUnregisteredTokenUse;
