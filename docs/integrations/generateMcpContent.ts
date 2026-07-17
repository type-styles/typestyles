import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

/** Copies prerendered `mcp-content.json` beside the Netlify MCP function at build time.
 * The destination is gitignored — Netlify packages functions after `astro build`. */
export function generateMcpContentIntegration(): AstroIntegration {
  return {
    name: 'generate-mcp-content',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const distPath = fileURLToPath(new URL('mcp-content.json', dir));
        const json = await readFile(distPath, 'utf8');
        const outDir = join(process.cwd(), 'netlify/functions');
        await mkdir(outDir, { recursive: true });
        await writeFile(join(outDir, 'mcp-content.json'), json, 'utf8');
      },
    },
  };
}
