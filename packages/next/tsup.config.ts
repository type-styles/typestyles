import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry point
  {
    format: ['esm', 'cjs'],
    dts: false,
    clean: true,
    splitting: false,
    entry: ['src/index.tsx'],
    loader: {
      '.tsx': 'tsx',
    },
    external: ['typestyles', 'typestyles/server', 'react', 'react-dom', 'next'],
  },
  // Server entry point
  {
    format: ['esm', 'cjs'],
    dts: false,
    clean: false,
    splitting: false,
    entry: ['src/server.ts'],
    outDir: 'dist',
    loader: {
      '.ts': 'ts',
    },
    external: ['typestyles', 'typestyles/server', 'react', 'react-dom'],
  },
  // Client entry point
  {
    format: ['esm', 'cjs'],
    dts: false,
    clean: false,
    splitting: false,
    entry: ['src/client.tsx'],
    outDir: 'dist',
    loader: {
      '.tsx': 'tsx',
    },
    external: ['typestyles', 'typestyles/server', 'react', 'react-dom', 'next'],
  },
  // Build-time extraction + webpack helper
  {
    format: ['esm', 'cjs'],
    dts: false,
    clean: false,
    splitting: false,
    entry: ['src/build.ts'],
    outDir: 'dist',
    loader: {
      '.ts': 'ts',
    },
    external: ['@typestyles/build', 'next', 'webpack', 'node:module', 'node:path'],
  },
]);
