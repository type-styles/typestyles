#!/usr/bin/env node
import path from 'node:path';
import {
  PUBLIC_CLASSNAMES_SNAPSHOT,
  collectPublicClassNames,
  writePublicClassNamesSnapshot,
} from '../snapshot-classnames.js';

const HELP = `typestyles snapshot-classnames [options]

Scan TypeScript sources for semantic \`styles.class\` / \`styles.component\` class names
and write or print the public API snapshot used by \`@typestyles/no-removed-public-classname\`.

Options:
  --write                 Write ${PUBLIC_CLASSNAMES_SNAPSHOT} in the project root
  --out <path>            Snapshot output path (default: ./${PUBLIC_CLASSNAMES_SNAPSHOT})
  --root <path>           Project root for scanning (default: cwd)
  --help                  Show this help
`;

function parseArgs(argv: string[]): {
  write: boolean;
  outPath: string;
  rootDir: string;
  help: boolean;
} {
  let write = false;
  let outPath = PUBLIC_CLASSNAMES_SNAPSHOT;
  let rootDir = process.cwd();
  let help = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') {
      help = true;
      continue;
    }
    if (token === '--write') {
      write = true;
      continue;
    }
    if (token === '--out' && argv[i + 1]) {
      outPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--root' && argv[i + 1]) {
      rootDir = path.resolve(argv[i + 1]);
      i += 1;
    }
  }

  return { write, outPath, rootDir, help };
}

async function main(): Promise<void> {
  const { write, outPath, rootDir, help } = parseArgs(process.argv.slice(2));
  if (help) {
    process.stdout.write(HELP);
    return;
  }

  const entries = await collectPublicClassNames({ rootDir });
  const resolvedOut = path.resolve(rootDir, outPath);

  if (write) {
    const snapshot = writePublicClassNamesSnapshot(resolvedOut, entries);
    process.stdout.write(
      `Wrote ${snapshot.classNames.length} public class name(s) to ${resolvedOut}\n`,
    );
    return;
  }

  process.stdout.write(`${JSON.stringify(buildPreview(entries), null, 2)}\n`);
}

function buildPreview(entries: Awaited<ReturnType<typeof collectPublicClassNames>>) {
  return {
    version: 1 as const,
    classNames: entries.map((entry) => entry.className),
    entries,
  };
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[typestyles] ${message}\n`);
  process.exit(1);
});
