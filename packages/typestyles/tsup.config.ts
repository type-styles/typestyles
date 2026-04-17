import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    globals: 'src/globals.ts',
    server: 'src/server.ts',
    hmr: 'src/hmr.ts',
    build: 'src/build.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
