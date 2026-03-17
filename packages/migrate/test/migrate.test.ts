import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runMigration } from '../src/migrate.js';
import { migrateSource } from '../src/transform.js';

const fixture = (name: string) => join(process.cwd(), 'test', 'fixtures', name);

describe('migrateSource', () => {
  it('migrates styled-components templates to typestyles class usage', async () => {
    const input = await readFile(fixture('styled-input.tsx'), 'utf8');
    const result = migrateSource('styled-input.tsx', input);

    expect(result.changed).toBe(true);
    expect(result.code).toContain(`from "typestyles"`);
    expect(result.code).toContain(`styles.class("button"`);
    expect(result.code).toContain('<button');
    expect(result.code).toContain('className');
  });

  it('migrates emotion css tagged templates to styles.class', async () => {
    const input = await readFile(fixture('emotion-input.ts'), 'utf8');
    const result = migrateSource('emotion-input.ts', input);

    expect(result.changed).toBe(true);
    expect(result.code).toContain(`styles.class("button"`);
    expect(result.code).not.toContain(`css\``);
  });

  it('skips unsupported interpolated templates with warning', async () => {
    const input = await readFile(fixture('unsupported-input.tsx'), 'utf8');
    const result = migrateSource('unsupported-input.tsx', input);

    expect(result.changed).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]?.message).toContain('interpolations');
  });
});

describe('runMigration', () => {
  it('supports dry-run and write modes', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'typestyles-migrate-'));
    const filePath = join(tempDir, 'button.ts');
    const source = `import { css } from '@emotion/react';\nconst button = css\`color: red;\`;\n`;
    await writeFile(filePath, source, 'utf8');

    const dryRunReport = await runMigration(tempDir, {
      targets: ['.'],
      write: false,
      include: [],
      exclude: [],
      extensions: ['.ts'],
    });
    const afterDryRun = await readFile(filePath, 'utf8');

    expect(dryRunReport.summary.filesChanged).toBe(1);
    expect(afterDryRun).toBe(source);

    const writeReport = await runMigration(tempDir, {
      targets: ['.'],
      write: true,
      include: [],
      exclude: [],
      extensions: ['.ts'],
    });
    const afterWrite = await readFile(filePath, 'utf8');

    expect(writeReport.summary.filesChanged).toBe(1);
    expect(afterWrite).toContain('styles.class');
  });
});
