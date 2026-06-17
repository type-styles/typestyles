import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');
const cssPath = join(dist, 'typestyles.css');
const jsDir = join(dist, 'assets');

if (!existsSync(cssPath)) {
  throw new Error('Expected dist/typestyles.css after vite build');
}

const css = readFileSync(cssPath, 'utf8');
if (!css.includes('svelte-button')) {
  throw new Error('Expected svelte-button styles in extracted CSS');
}

const jsFiles = readdirSync(jsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
  .map((entry) => readFileSync(join(jsDir, entry.name), 'utf8'));

if (!jsFiles.some((source) => source.includes('svelte-button'))) {
  throw new Error('Expected svelte-button class helper in JS bundle');
}

console.log('svelte-app build verification passed');
