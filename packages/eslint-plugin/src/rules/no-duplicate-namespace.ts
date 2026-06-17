import { createRule } from '../utils/create-rule';
import { getNamespaceCall } from '../utils/style-calls';

interface NamespaceLocation {
  filename: string;
  line: number;
  column: number;
}

/** Cross-file registry for a single ESLint CLI run (best-effort; not shared across workers). */
const namespaceRegistry = new Map<string, NamespaceLocation>();

/** @internal Test hook */
export function resetNamespaceRegistry(): void {
  namespaceRegistry.clear();
}

export const noDuplicateNamespace = createRule({
  name: 'no-duplicate-namespace',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow reusing the same TypeStyles namespace (`styles.class`, `styles.component`, `tokens.create`, …) across the project',
    },
    messages: {
      duplicateInFile:
        'Namespace `{{name}}` ({{kind}}) is already registered in this file at line {{line}}.',
      duplicateAcrossFiles:
        'Namespace `{{name}}` ({{kind}}) is already registered in `{{otherFile}}` at line {{line}}.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const fileSeen = new Map<string, { line: number; column: number }>();
    const filename = context.filename;

    return {
      CallExpression(node) {
        const call = getNamespaceCall(node);
        if (!call) return;

        const displayName =
          call.kind === 'styles.class' || call.kind === 'styles.component'
            ? call.nameNode.value
            : call.nameNode.value;

        const line = call.nameNode.loc?.start.line ?? node.loc?.start.line ?? 0;
        const column = call.nameNode.loc?.start.column ?? node.loc?.start.column ?? 0;

        const priorInFile = fileSeen.get(call.key);
        if (priorInFile) {
          context.report({
            node: call.nameNode,
            messageId: 'duplicateInFile',
            data: {
              name: displayName,
              kind: call.kind,
              line: String(priorInFile.line),
            },
          });
          return;
        }
        fileSeen.set(call.key, { line, column });

        const priorGlobal = namespaceRegistry.get(call.key);
        if (priorGlobal && priorGlobal.filename !== filename) {
          context.report({
            node: call.nameNode,
            messageId: 'duplicateAcrossFiles',
            data: {
              name: displayName,
              kind: call.kind,
              otherFile: priorGlobal.filename,
              line: String(priorGlobal.line),
            },
          });
          return;
        }

        if (!priorGlobal) {
          namespaceRegistry.set(call.key, { filename, line, column });
        }
      },
    };
  },
});
