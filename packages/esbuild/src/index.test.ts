import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';
import typestylesEsbuildPlugin from './index';

describe('typestylesEsbuildPlugin', () => {
  it('discovers a convention entry and writes typestyles.css on build', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'typestyles-esbuild-disco-'));
    const outdir = join(dir, 'dist');
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
      join(dir, 'src/typestyles-entry.ts'),
      `import { styles } from 'typestyles';
styles.component('esbuild-convention', { base: { color: 'green' } });`,
    );
    writeFileSync(
      join(dir, 'src/main.ts'),
      `import { styles } from 'typestyles';
export const label = styles.component('esbuild-label', { base: { fontSize: '14px' } });`,
    );

    await build({
      entryPoints: [join(dir, 'src/main.ts')],
      bundle: true,
      outfile: join(outdir, 'index.js'),
      platform: 'browser',
      external: ['typestyles'],
      plugins: [typestylesEsbuildPlugin({ root: dir })],
    });

    const cssPath = join(outdir, 'typestyles.css');
    expect(existsSync(cssPath)).toBe(true);
    const css = await import('node:fs/promises').then((fs) => fs.readFile(cssPath, 'utf8'));
    expect(css).toContain('esbuild-convention');
  });
});
