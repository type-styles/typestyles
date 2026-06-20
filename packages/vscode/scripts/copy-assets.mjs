import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(root, '..', '..');
mkdirSync(join(root, 'dist'), { recursive: true });
copyFileSync(join(root, 'icon.png'), join(root, 'dist/icon.png'));
copyFileSync(join(repoRoot, 'LICENSE'), join(root, 'LICENSE'));
