import AstroTypestyles from '@typestyles/astro';
import { defineConfig } from 'astro/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  integrations: [
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
  },
});
