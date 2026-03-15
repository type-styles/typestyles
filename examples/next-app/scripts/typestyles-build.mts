import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectStylesFromModules } from 'typestyles/build';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');

async function main() {
  const css = await collectStylesFromModules([
    () => import(resolve(root, '../react-design-system/src/index.ts')),
  ]);

  const outFile = resolve(root, 'app/typestyles.css');
  await writeFile(outFile, css, 'utf8');
  console.log(`[typestyles] Wrote extracted CSS to ${outFile}`);
}

main().catch((error) => {
  console.error('[typestyles] Failed to extract CSS', error);
  process.exitCode = 1;
});

