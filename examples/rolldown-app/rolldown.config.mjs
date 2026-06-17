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
    // Same convention discovery as Rollup; explicit modules still supported.
    typestylesRollupPlugin(),
  ],
};
