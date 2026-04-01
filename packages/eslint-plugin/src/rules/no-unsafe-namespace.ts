import type { Rule } from 'eslint';

/**
 * Warns when a `styles.create()` namespace contains characters that are unsafe
 * in CSS class selectors (anything other than `[a-zA-Z0-9_-]`). Unsafe names
 * are escaped by typestyles at runtime, which can produce surprising class
 * names in DevTools and breaks the "readable names" guarantee.
 *
 * @example
 * ```ts
 * // ❌ Space and special chars require escaping
 * const s = styles.create('my button!', { ... });
 *
 * // ✅ URL-safe characters only
 * const s = styles.create('my-button', { ... });
 * ```
 */
const noUnsafeNamespace: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when a typestyles namespace contains characters that are unsafe in CSS class names.',
      recommended: true,
      url: 'https://typestyles.dev/docs/eslint-plugin/no-unsafe-namespace',
    },
    schema: [],
    messages: {
      unsafe:
        'typestyles namespace "{{namespace}}" contains characters that are unsafe in CSS class names. ' +
        'Use only letters, digits, hyphens, and underscores.',
    },
  },
  create(context) {
    const SAFE_NAMESPACE_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
    const NAMESPACE_METHODS = new Set(['create', 'class', 'component', 'hashClass']);

    return {
      CallExpression(node) {
        const { callee, arguments: args } = node;

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
        if (!SAFE_NAMESPACE_RE.test(namespace)) {
          context.report({
            node: firstArg,
            messageId: 'unsafe',
            data: { namespace },
          });
        }
      },
    };
  },
};

export default noUnsafeNamespace;
