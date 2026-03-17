import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import { createPatch } from 'diff';
import type { CliOptions, MigrationReport, MigrationSummary } from './types.js';
import { collectTargetFiles } from './files.js';
import { migrateSource } from './transform.js';

function renderPatch(filePath: string, before: string, after: string): string {
  return createPatch(filePath, before, after, 'before', 'after')
    .split('\n')
    .slice(2)
    .join('\n');
}

export async function runMigration(cwd: string, options: CliOptions): Promise<MigrationReport> {
  const files = await collectTargetFiles(
    cwd,
    options.targets,
    options.extensions,
    options.include,
    options.exclude,
  );

  const reportEntries: MigrationReport['files'] = [];
  let changedCount = 0;
  let warningCount = 0;

  for (const filePath of files) {
    const before = await readFile(filePath, 'utf8');
    const result = migrateSource(filePath, before);
    const relativePath = relative(cwd, filePath);

    warningCount += result.warnings.length;
    if (result.changed) {
      changedCount += 1;
      if (options.write) {
        await writeFile(filePath, result.code, 'utf8');
        process.stdout.write(`updated ${relativePath}\n`);
      } else {
        process.stdout.write(`\n--- ${relativePath} (dry-run) ---\n`);
        process.stdout.write(`${renderPatch(relativePath, before, result.code)}\n`);
      }
    }

    for (const warning of result.warnings) {
      const nodeLabel = warning.nodeName ? ` (${warning.nodeName})` : '';
      process.stdout.write(`warning ${relativePath}${nodeLabel}: ${warning.message}\n`);
    }

    reportEntries.push({
      filePath: relativePath,
      changed: result.changed,
      warnings: result.warnings,
    });
  }

  const summary: MigrationSummary = {
    filesScanned: files.length,
    filesChanged: changedCount,
    warnings: warningCount,
  };

  process.stdout.write(
    `\nScanned ${summary.filesScanned} files, changed ${summary.filesChanged}, warnings ${summary.warnings}.\n`,
  );

  const report: MigrationReport = {
    summary,
    files: reportEntries,
  };

  if (options.reportPath) {
    await mkdir(dirname(options.reportPath), { recursive: true });
    await writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    process.stdout.write(`Report written to ${options.reportPath}\n`);
  }

  return report;
}
