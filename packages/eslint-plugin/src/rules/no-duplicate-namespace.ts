import type { Rule } from 'eslint';

/**
 * Detects duplicate namespace strings passed to `styles.create()`,
 * `styles.class()`, `styles.hashClass()`, and `styles.component()` within
 * the **same file**. Duplicate namespaces produce colliding class names and
 * are almost always a copy-paste error.
 *
 * @example
 * ```ts
 * // ❌ Both generate `.button-base` — second definition silently wins
 * const a = styles.create('button', { base: { color: 'red' } });
 * const b = styles.create('button', { base: { color: 'blue' } });
 *
 * // ✅ Unique names
 * const a = styles.create('button-primary', { base: { color: 'red' } });
 * const b = styles.create('button-ghost',   { base: { color: 'blue' } });
 * ```
 */
const noDuplicateNamespace: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow duplicate namespace strings in typestyles style creation calls within the same file.',
      recommended: true,
      url: 'https://typestyles.dev/docs/eslint-plugin/no-duplicate-namespace',
    },
    schema: [],
    messages: {
      duplicate:
        'Duplicate typestyles namespace "{{namespace}}". ' +
        'Each styles.create / styles.class / styles.component call in a file must use a unique namespace. ' +
        'Duplicates cause class-name collisions.',
    },
  },
  create(context) {
    /** Namespaces seen so far in this file, mapped to the node where first used. */
    const seen = new Map<string, Rule.Node>();

    /**
     * The set of method names that take a namespace as their first string argument.
     * `styles.hashClass` is intentionally excluded — it takes a style object, not a name.
     */
    const NAMESPACE_METHODS = new Set(['create', 'class', 'component']);

    return {
      CallExpression(node) {
        const { callee, arguments: args } = node;

        // Match `styles.create(...)`, `styles.class(...)`, `styles.component(...)`
        if (
          callee.type !== 'MemberExpression' ||
          callee.object.type !== 'Identifier' ||
          callee.object.name !== 'styles' ||
          callee.property.type !== 'Identifier' ||
          !NAMESPACE_METHODS.has(callee.property.name)
        ) {
          return;
        }

        const firstArg = args[0];
        if (!firstArg || firstArg.type !== 'Literal' || typeof firstArg.value !== 'string') {
          return;
        }

        const namespace = firstArg.value;

        if (seen.has(namespace)) {
          context.report({
            node: firstArg,
            messageId: 'duplicate',
            data: { namespace },
          });
        } else {
          seen.set(namespace, firstArg as unknown as Rule.Node);
        }
      },
    };
  },
};

export default noDuplicateNamespace;
