import AstroTypestyles from '@typestyles/astro';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import tsConfigPaths from 'vite-tsconfig-paths';
import { generateMcpContentIntegration } from './integrations/generateMcpContent.ts';

export default defineConfig({
  site: 'https://typestyles.dev',
  integrations: [
    sitemap(),
    generateMcpContentIntegration(),
    AstroTypestyles({
      mode: 'build',
      extract: {
        modules: ['src/typestyles-entry.ts'],
        fileName: 'typestyles.css',
      },
    }),
  ],
  vite: {
    plugins: [tsConfigPaths({ projects: ['./tsconfig.json'] })],
    ssr: {
      // LiveDemo CSS extraction runs esbuild in Node; must not be bundled into Astro SSR.
      external: ['@typestyles/build-runner', 'esbuild'],
    },
  },
});
