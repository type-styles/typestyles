import path from 'node:path';
import { createRule } from '../utils/create-rule';
import {
  PUBLIC_CLASSNAMES_SNAPSHOT,
  collectPublicClassNamesSync,
  diffRemovedPublicClassNames,
  loadPublicClassNamesSnapshot,
  type PublicClassNameEntry,
} from 'typestyles/snapshot-classnames';

type RuleOptions = [
  {
    snapshotFile?: string;
    rootDir?: string;
  }?,
];

let comparisonDone = false;
let cachedRemoved: PublicClassNameEntry[] = [];
let reportsEmitted = false;

/** @internal Test hook */
export function resetRemovedPublicClassnameState(): void {
  comparisonDone = false;
  cachedRemoved = [];
  reportsEmitted = false;
}

function resolveRemovedClassNames(
  context: Parameters<NonNullable<ReturnType<typeof createRule>['create']>>[0],
  options: RuleOptions[0],
): PublicClassNameEntry[] {
  if (comparisonDone) return cachedRemoved;

  const rootDir = path.resolve(options?.rootDir ?? context.cwd ?? process.cwd());
  const snapshotPath = path.resolve(rootDir, options?.snapshotFile ?? PUBLIC_CLASSNAMES_SNAPSHOT);
  const snapshot = loadPublicClassNamesSnapshot(snapshotPath);
  if (!snapshot) {
    comparisonDone = true;
    cachedRemoved = [];
    return cachedRemoved;
  }

  const current = collectPublicClassNamesSync({ rootDir });
  cachedRemoved = diffRemovedPublicClassNames(snapshot, current);
  comparisonDone = true;
  return cachedRemoved;
}

export const noRemovedPublicClassname = createRule<RuleOptions>({
  name: 'no-removed-public-classname',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow removing or renaming semantic class names listed in `.typestyles-public-classnames.json`',
    },
    messages: {
      removed:
        'Public class name `{{className}}` was removed or renamed. This is a breaking change — restore the name or regenerate the snapshot with `typestyles snapshot-classnames --write` after a deliberate semver bump.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          snapshotFile: { type: 'string' },
          rootDir: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const rootDir = path.resolve(options?.rootDir ?? context.cwd ?? process.cwd());
    const snapshotPath = path.resolve(rootDir, options?.snapshotFile ?? PUBLIC_CLASSNAMES_SNAPSHOT);
    if (!loadPublicClassNamesSnapshot(snapshotPath)) {
      return {};
    }

    return {
      'Program:exit'(node) {
        if (reportsEmitted) return;
        reportsEmitted = true;

        const removed = resolveRemovedClassNames(context, options);
        for (const entry of removed) {
          context.report({
            node,
            messageId: 'removed',
            data: { className: entry.className },
          });
        }
      },
    };
  },
});
