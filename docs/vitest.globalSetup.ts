import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { buildMcpContentBundle } from './src/lib/mcpContent';

export default async function globalSetup() {
  const bundle = await buildMcpContentBundle();
  const json = JSON.stringify(bundle);
  const fnDir = join(process.cwd(), 'netlify/functions');
  await mkdir(fnDir, { recursive: true });
  await writeFile(join(fnDir, 'mcp-content.json'), json, 'utf8');
}
