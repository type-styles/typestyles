import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');
const cssPath = join(dist, 'typestyles.css');
const jsPath = join(dist, 'index.js');

for (const path of [cssPath, jsPath]) {
  if (!existsSync(path)) throw new Error(`Expected ${path} after esbuild build`);
}

const css = readFileSync(cssPath, 'utf8');
if (!css.includes('esbuild-hero')) {
  throw new Error('Expected esbuild-hero styles in extracted CSS');
}

console.log('esbuild-app build verification passed');
