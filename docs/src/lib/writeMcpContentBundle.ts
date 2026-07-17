import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { buildMcpContentBundle } from './mcpContent';

/** Writes the MCP function content bundle next to `mcpServer.ts`. */
export async function writeMcpContentBundle(docsRoot = process.cwd()): Promise<string> {
  const bundle = await buildMcpContentBundle();
  const outDir = join(docsRoot, 'netlify/functions');
  const outPath = join(outDir, 'mcp-content.json');
  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, JSON.stringify(bundle), 'utf8');
  return outPath;
}
