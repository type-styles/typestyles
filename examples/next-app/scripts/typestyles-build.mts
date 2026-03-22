import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTypestylesForNext } from '@typestyles/next/build';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

await buildTypestylesForNext({
  root,
  modules: ['../react-design-system/src/index.ts'],
  cssOutFile: 'app/typestyles.css',
  manifestOutFile: 'app/typestyles.manifest.json',
  manifestCssPath: 'app/typestyles.css',
});

console.log('[typestyles] Wrote app/typestyles.css and app/typestyles.manifest.json');
