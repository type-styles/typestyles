import { defineConfig } from 'astro/config';
import typestylesPlugin from '@typestyles/vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  vite: {
    plugins: [tsConfigPaths({ projects: ['./tsconfig.json'] }), typestylesPlugin()],
  },
});
