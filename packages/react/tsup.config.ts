import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'jsx-runtime': 'src/jsx-runtime.ts',
      'jsx-dev-runtime': 'src/jsx-dev-runtime.ts',
      'babel-plugin': 'src/babel-plugin.ts',
      'css-prop-runtime': 'src/css-prop-runtime.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: [
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'typestyles',
      '@babel/core',
      '@babel/helper-plugin-utils',
      '@babel/types',
    ],
    loader: {
      '.tsx': 'tsx',
    },
  },
]);
