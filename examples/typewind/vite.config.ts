import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import typestylesPlugin from '@typestyles/vite';

export default defineConfig({
  plugins: [
    react(),
    typestylesPlugin({
      mode: 'build',
      extract: {
        modules: ['src/typestyles-entry.ts'],
        fileName: 'typestyles.css',
      },
    }),
  ],
});
