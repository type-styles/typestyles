import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import webpack from 'webpack';
import TypestylesWebpackPlugin from './index';

describe('TypestylesWebpackPlugin', () => {
  it('discovers a convention entry and emits typestyles.css', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'typestyles-webpack-disco-'));
    const outdir = join(dir, 'dist');
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
      join(dir, 'src/typestyles-entry.js'),
      `import { styles } from 'typestyles';
styles.component('webpack-convention', { base: { color: 'purple' } });`,
    );
    writeFileSync(
      join(dir, 'src/index.js'),
      `import { styles } from 'typestyles';
export const badge = styles.component('webpack-badge', { base: { padding: '4px' } });`,
    );

    const errors: Error[] = [];
    const compiler = webpack({
      mode: 'production',
      context: dir,
      entry: './src/index.js',
      output: {
        path: outdir,
        filename: 'index.js',
      },
      externals: {
        typestyles: 'typestyles',
      },
      plugins: [new TypestylesWebpackPlugin({ root: dir })],
    });

    await new Promise<void>((resolve, reject) => {
      compiler?.run((error, stats) => {
        if (error) {
          reject(error);
          return;
        }
        if (stats?.hasErrors()) {
          for (const detail of stats.compilation.errors) {
            errors.push(detail as Error);
          }
        }
        resolve();
      });
    });

    expect(errors).toEqual([]);

    const cssPath = join(outdir, 'typestyles.css');
    expect(existsSync(cssPath)).toBe(true);
    const css = await import('node:fs/promises').then((fs) => fs.readFile(cssPath, 'utf8'));
    expect(css).toContain('webpack-convention');
  });
});
