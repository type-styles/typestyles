import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { writeExtractedCss } from './index.js';

function printHelp(): void {
  console.log(`typestyles-build — extract CSS from TypeStyles registration modules

Usage:
  typestyles-build --root <dir> --out <file> --modules <glob-list>

Options:
  --root      Project root (default: cwd)
  --out       Output CSS file path, relative to root unless absolute
  --modules   Comma-separated list of module paths relative to root
  --help      Show this message

Example:
  typestyles-build --root . --out dist/typestyles.css --modules src/styles.ts,src/tokens.ts
`);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      root: { type: 'string', default: process.cwd() },
      out: { type: 'string' },
      modules: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (!values.out || !values.modules) {
    console.error('Error: --out and --modules are required.\n');
    printHelp();
    process.exit(1);
  }

  const root = resolve(values.root ?? process.cwd());
  const moduleList = values.modules
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

  if (!moduleList.length) {
    console.error('Error: --modules must list at least one path.');
    process.exit(1);
  }

  await writeExtractedCss({
    root,
    modules: moduleList,
    outFile: values.out,
  });

  console.log(`Wrote ${values.out} (${moduleList.length} module(s)).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
