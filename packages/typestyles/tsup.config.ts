import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    color: 'src/color-entry.ts',
    'color-scale': 'src/color-scale-entry.ts',
    'token-scale': 'src/token-scale-entry.ts',
    globals: 'src/globals.ts',
    server: 'src/server.ts',
    hmr: 'src/hmr.ts',
    build: 'src/build.ts',
    'snapshot-classnames': 'src/snapshot-classnames.ts',
    'cli/snapshot-classnames': 'src/cli/snapshot-classnames.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['node:async_hooks'],
});
