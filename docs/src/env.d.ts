/// <reference types="astro/client" />

/**
 * Allows `import … from './mcp-content.json'` in the Netlify MCP function when
 * the gitignored bundle has not been generated yet. Do not put a `.d.ts` next
 * to the function — Netlify treats `*.ts` under `netlify/functions` as entries.
 */
declare module '*.json' {
  const value: unknown;
  export default value;
}
