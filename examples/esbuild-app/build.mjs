import { cpSync, mkdirSync } from 'node:fs';
import { build } from 'esbuild';
import typestylesEsbuildPlugin from '@typestyles/esbuild';

mkdirSync('dist', { recursive: true });
cpSync('index.html', 'dist/index.html');

await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'dist/index.js',
  plugins: [typestylesEsbuildPlugin()],
});
