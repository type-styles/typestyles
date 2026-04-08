import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const cssPath = resolve(root, 'app/typestyles.css');
const manifestPath = resolve(root, 'app/typestyles.manifest.json');

function fail(message: string): never {
  console.error(`[typestyles:verify] ${message}`);
  process.exit(1);
}

if (!existsSync(cssPath)) fail(`Missing ${cssPath} — run pnpm typestyles:build first.`);

const css = readFileSync(cssPath, 'utf8');
if (css.length < 500) fail(`CSS file unexpectedly small (${css.length} bytes).`);

const requiredSubstrings = [
  ':root { --example-ds-color-background-app:',
  '.button-base {',
  '.theme-example-ds-default {',
  '.ds-layout-base {',
  '.app-site-page {',
];
for (const s of requiredSubstrings) {
  if (!css.includes(s)) fail(`Expected CSS to contain ${JSON.stringify(s)}.`);
}

if (!existsSync(manifestPath)) fail(`Missing ${manifestPath}.`);

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  version?: number;
  css?: string;
};
if (manifest.version !== 1) fail(`Expected manifest version 1, got ${manifest.version}.`);
if (manifest.css !== 'app/typestyles.css') {
  fail(`Expected manifest.css "app/typestyles.css", got ${JSON.stringify(manifest.css)}.`);
}

console.log(
  `[typestyles:verify] OK — ${cssPath} (${css.length} bytes), manifest v${manifest.version}`,
);
