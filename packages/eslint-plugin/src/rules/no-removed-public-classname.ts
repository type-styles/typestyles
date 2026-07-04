import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { createRule } from '../utils/create-rule';
import { getNamespaceCall } from '../utils/style-calls';
import { classNamesForClassCall, classNamesForComponentCall } from '../utils/public-classnames';
import type { TSESTree } from '@typescript-eslint/utils';

/**
 * `styles.component()` / `styles.class()` semantic class names are a public,
 * semver-guarded surface — consumers may target them with plain CSS or
 * `styles.scope()`. Renaming the string literal that produces them is invisible
 * to TypeScript (no call site breaks), so this rule diffs the class names a file
 * currently emits against a checked-in snapshot and errors on anything the
 * snapshot promises but the file no longer produces.
 *
 * **Opt-in**: enable it per package by committing a snapshot file
 * (default `.typestyles-public-classnames.json`) — without one the rule is a
 * no-op. Adding new class names never fails; only removals/renames do, and
 * acknowledging one is a deliberate step: update the snapshot *and* ship a
 * changeset marking the break.
 *
 * Snapshot format (paths relative to the lint root, falling back to the
 * snapshot file's own directory):
 *
 * ```json
 * {
 *   "version": 1,
 *   "files": {
 *     "src/button.ts": ["button-base", "button-intent-primary"]
 *   }
 * }
 * ```
 */

export const DEFAULT_SNAPSHOT_FILENAME = '.typestyles-public-classnames.json';

interface Snapshot {
  version?: number;
  files: Record<string, string[]>;
}

interface SnapshotCacheEntry {
  mtimeMs: number;
  snapshot: Snapshot | 'invalid';
}

const snapshotCache = new Map<string, SnapshotCacheEntry>();

/** @internal Test hook */
export function resetSnapshotCache(): void {
  snapshotCache.clear();
}

function loadSnapshot(path: string): Snapshot | 'invalid' | null {
  if (!existsSync(path)) return null;
  let mtimeMs = 0;
  try {
    mtimeMs = statSync(path).mtimeMs;
  } catch {
    return null;
  }
  const cached = snapshotCache.get(path);
  if (cached && cached.mtimeMs === mtimeMs) return cached.snapshot;

  let snapshot: Snapshot | 'invalid';
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    snapshot = isValidSnapshot(parsed) ? parsed : 'invalid';
  } catch {
    snapshot = 'invalid';
  }
  snapshotCache.set(path, { mtimeMs, snapshot });
  return snapshot;
}

function isValidSnapshot(value: unknown): value is Snapshot {
  if (typeof value !== 'object' || value === null) return false;
  const files = (value as { files?: unknown }).files;
  if (typeof files !== 'object' || files === null || Array.isArray(files)) return false;
  return Object.values(files).every(
    (names) => Array.isArray(names) && names.every((n) => typeof n === 'string'),
  );
}

function normalizeRelative(from: string, to: string): string {
  return relative(from, to).split('\\').join('/');
}

export const noRemovedPublicClassname = createRule({
  name: 'no-removed-public-classname',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow removing or renaming a shipped semantic class name (`styles.component` / `styles.class` output listed in the public class-name snapshot) without acknowledging the breaking change',
    },
    messages: {
      removedClassName:
        'Public class name `{{className}}` (listed in `{{snapshot}}`) is no longer emitted by this file. ' +
        'Semantic class names are a semver-guarded public surface — consumers may target them with plain CSS or `styles.scope()`. ' +
        'If this rename/removal is intentional, update the snapshot and add a changeset declaring a breaking change.',
      invalidSnapshot:
        'Could not parse the public class-name snapshot at `{{snapshot}}`. Expected `{ "files": { "<path>": ["class-name", …] } }`.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          snapshot: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ snapshot: DEFAULT_SNAPSHOT_FILENAME }],
  create(context, [options]) {
    const cwd = context.cwd ?? process.cwd();
    const snapshotOption = options.snapshot ?? DEFAULT_SNAPSHOT_FILENAME;
    const snapshotPath = isAbsolute(snapshotOption) ? snapshotOption : resolve(cwd, snapshotOption);

    const snapshot = loadSnapshot(snapshotPath);
    // Opt-in: no snapshot file → nothing to defend.
    if (snapshot === null) return {};

    const filename = isAbsolute(context.filename)
      ? context.filename
      : resolve(cwd, context.filename);
    const expected =
      snapshot === 'invalid'
        ? null
        : (snapshot.files[normalizeRelative(cwd, filename)] ??
          snapshot.files[normalizeRelative(dirname(snapshotPath), filename)]);

    if (snapshot !== 'invalid' && !expected) return {};

    const currentNames = new Set<string>();
    /** Namespaces whose configs could not be statically analyzed — skip their snapshot names. */
    const unanalyzableNamespaces = new Set<string>();
    /** nameNode per namespace, to point reports at the surviving call when only a variant was removed. */
    const nameNodeByNamespace = new Map<string, TSESTree.StringLiteral>();
    let bailFile = false;

    return {
      CallExpression(node) {
        const call = getNamespaceCall(node);
        if (call && (call.kind === 'styles.class' || call.kind === 'styles.component')) {
          const namespace = call.nameNode.value;
          nameNodeByNamespace.set(namespace, call.nameNode);
          const result =
            call.kind === 'styles.class'
              ? classNamesForClassCall(namespace)
              : classNamesForComponentCall(namespace, node.arguments[1]);
          if (result.unanalyzable) {
            unanalyzableNamespaces.add(namespace);
          }
          for (const name of result.classNames) currentNames.add(name);
          return;
        }

        // A `styles.class` / `styles.component` call with a dynamic (non-literal)
        // namespace is invisible to getNamespaceCall — be conservative and skip the file.
        if (
          node.callee.type === 'MemberExpression' &&
          !node.callee.computed &&
          node.callee.property.type === 'Identifier' &&
          (node.callee.property.name === 'class' || node.callee.property.name === 'component')
        ) {
          const first = node.arguments[0];
          const isLiteralName =
            first && first.type === 'Literal' && typeof first.value === 'string';
          if (!isLiteralName) bailFile = true;
        }
      },
      'Program:exit'(program) {
        if (snapshot === 'invalid') {
          context.report({
            node: program,
            messageId: 'invalidSnapshot',
            data: { snapshot: snapshotOption },
          });
          return;
        }
        if (bailFile || !expected) return;

        for (const className of expected) {
          if (currentNames.has(className)) continue;

          const owner = [...unanalyzableNamespaces].find(
            (ns) => className === ns || className.startsWith(`${ns}-`),
          );
          if (owner) continue;

          const anchor = [...nameNodeByNamespace.entries()].find(
            ([ns]) => className === ns || className.startsWith(`${ns}-`),
          )?.[1];

          context.report({
            node: anchor ?? program,
            messageId: 'removedClassName',
            data: { className, snapshot: snapshotOption },
          });
        }
      },
    };
  },
});
