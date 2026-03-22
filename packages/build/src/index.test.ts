import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { extractCss, writeExtractedCss } from './index.js';
import { reset } from 'typestyles';

describe('@typestyles/build', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'typestyles-build-pkg-'));
  });

  afterEach(async () => {
    reset();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('writeExtractedCss writes CSS from registration modules', async () => {
    const entry = join(tempDir, 'entry.ts');
    await writeFile(
      entry,
      `
import { styles } from 'typestyles';
styles.create('cli-test-button', { base: { color: 'navy' } });
`,
      'utf8',
    );

    const outFile = join(tempDir, 'out', 'app.css');
    await writeExtractedCss({
      root: tempDir,
      modules: ['entry.ts'],
      outFile: 'out/app.css',
    });

    const css = await readFile(outFile, 'utf8');
    expect(css).toContain('.cli-test-button-');
    expect(css).toMatch(/color:\s*navy/);
  });

  it('writeExtractedCss writes manifest when manifestOutFile is set', async () => {
    const entry = join(tempDir, 'entry-manifest.ts');
    await writeFile(
      entry,
      `
import { styles } from 'typestyles';
styles.create('manifest-test', { base: { margin: 0 } });
`,
      'utf8',
    );

    await writeExtractedCss({
      root: tempDir,
      modules: ['entry-manifest.ts'],
      outFile: 'out/sheet.css',
      manifestOutFile: 'out/typestyles.manifest.json',
      manifestCssPath: 'out/sheet.css',
    });

    const raw = await readFile(join(tempDir, 'out/typestyles.manifest.json'), 'utf8');
    const manifest = JSON.parse(raw) as { version: number; css: string };
    expect(manifest.version).toBe(1);
    expect(manifest.css).toBe('out/sheet.css');
  });

  it('extractCss returns the same string as getRegisteredCss after a run', async () => {
    const entry = join(tempDir, 'entry2.ts');
    await writeFile(
      entry,
      `
import { styles } from 'typestyles';
styles.create('cli-test-card', { base: { display: 'flex' } });
`,
      'utf8',
    );

    const css = await extractCss({ root: tempDir, modules: ['entry2.ts'] });
    expect(css).toContain('.cli-test-card-');
    expect(css).toMatch(/display:\s*flex/);
  });
});
