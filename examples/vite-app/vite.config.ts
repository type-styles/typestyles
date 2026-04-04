import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import typestyles from '@typestyles/vite';

/**
 * With `extract` set, the plugin defaults to mode `"build"`: runtime injection + HMR during
 * `vite dev`, static `typestyles.css` + zero client injection on `vite build`.
 */
export default defineConfig({
  plugins: [
    react(),
    typestyles({
      extract: {
        modules: ['src/typestyles-entry.ts'],
        fileName: 'typestyles.css',
      },
    }),
  ],
});
