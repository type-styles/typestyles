import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import typestyles from '@typestyles/vite';

/**
 * With `extract` set, the plugin defaults to mode `"build"`: runtime injection + HMR during
 * `vite dev`, the same extracted CSS served at `typestyles.css` for the index.html link, static
 * asset + zero client injection on `vite build`.
 */
export default defineConfig({
  plugins: [
    react(),
    typestyles({
      extract: {
        /** Design system + app shell (see `src/typestyles-entry.ts`). */
        modules: ['src/typestyles-entry.ts'],
        fileName: 'typestyles.css',
      },
    }),
  ],
});
