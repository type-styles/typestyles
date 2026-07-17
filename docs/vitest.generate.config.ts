import { defineConfig } from 'vitest/config';
import tsConfigPaths from 'vite-tsconfig-paths';

/** One-shot generator: `pnpm --filter docs generate:mcp-content` */
export default defineConfig({
  plugins: [tsConfigPaths({ projects: ['./tsconfig.json'] })],
  test: {
    environment: 'node',
    include: ['scripts/generate-mcp-content.test.ts'],
  },
});
