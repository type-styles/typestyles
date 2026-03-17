import { resolve } from 'node:path';
import type { CliOptions } from './types.js';
import { runMigration } from './migrate.js';

const HELP_TEXT = `typestyles-migrate <paths...> [options]

Options:
  --write                Apply changes in-place (default is dry-run)
  --include <glob>       Include glob (repeatable)
  --exclude <glob>       Exclude glob (repeatable)
  --extensions <list>    Comma-separated extensions (default: .ts,.tsx)
  --report <path>        Write JSON report to the provided path
  --help                 Show this help
`;

function parseCliArgs(argv: string[]): CliOptions {
  if (argv.includes('--help')) {
    process.stdout.write(HELP_TEXT);
    process.exit(0);
  }

  const targets: string[] = [];
  const include: string[] = [];
  const exclude: string[] = [];
  let extensions: string[] = ['.ts', '.tsx'];
  let reportPath: string | undefined;
  let write = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--write') {
      write = true;
      continue;
    }

    if (token === '--include' && argv[i + 1]) {
      include.push(argv[i + 1]);
      i += 1;
      continue;
    }

    if (token === '--exclude' && argv[i + 1]) {
      exclude.push(argv[i + 1]);
      i += 1;
      continue;
    }

    if (token === '--extensions' && argv[i + 1]) {
      extensions = argv[i + 1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }

    if (token === '--report' && argv[i + 1]) {
      reportPath = resolve(process.cwd(), argv[i + 1]);
      i += 1;
      continue;
    }

    if (!token.startsWith('--')) {
      targets.push(token);
    }
  }

  return {
    targets: targets.length > 0 ? targets : ['.'],
    write,
    include,
    exclude,
    extensions,
    reportPath,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseCliArgs(args);
  await runMigration(process.cwd(), options);
}

main().catch((error) => {
  process.stderr.write(`${(error as Error).message}\n`);
  process.exit(1);
});
