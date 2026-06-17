import { nodeResolve } from '@rollup/plugin-node-resolve';
import typestylesRollupPlugin from '@typestyles/rollup';

export default {
  input: 'src/main.js',
  output: {
    dir: 'dist',
    format: 'es',
    entryFileNames: 'assets/index.js',
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    // Discovers src/typestyles-entry.js and defaults to build extraction.
    typestylesRollupPlugin(),
  ],
};
