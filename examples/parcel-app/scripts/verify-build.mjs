import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');
const htmlFiles = readdirSync(dist).filter((name) => name.endsWith('.html'));
if (htmlFiles.length === 0) throw new Error('Expected HTML output from parcel build');

const jsFiles = readdirSync(dist).filter((name) => name.endsWith('.js'));
if (jsFiles.length === 0) throw new Error('Expected JS output from parcel build');

const js = readFileSync(join(dist, jsFiles[0]), 'utf8');
if (!js.includes('parcel-heading')) {
  throw new Error('Expected parcel-heading class helper in parcel bundle');
}

console.log('parcel-app build verification passed');
