#!/usr/bin/env node
import { runSnapshot, SNAPSHOT_HELP } from './commands/snapshot.js';

const ROOT_HELP = `typestyles <command> [options]

TypeStyles command-line tools.

Commands:
  snapshot    Snapshot semantic class names for semver guarding

Run \`typestyles <command> --help\` for command-specific options.
`;

const COMMANDS = {
  snapshot: runSnapshot,
} as const;

type CommandName = keyof typeof COMMANDS;

function isCommandName(value: string): value is CommandName {
  return value in COMMANDS;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    process.stdout.write(ROOT_HELP);
    return;
  }

  const [command, ...rest] = argv;
  if (!isCommandName(command)) {
    process.stderr.write(`[typestyles] Unknown command \`${command}\`.\n\n${ROOT_HELP}`);
    process.exit(1);
  }

  if (rest[0] === '--help' || rest[0] === '-h') {
    if (command === 'snapshot') {
      process.stdout.write(SNAPSHOT_HELP);
      return;
    }
  }

  await COMMANDS[command](rest);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[typestyles] ${message}\n`);
  process.exit(1);
});
