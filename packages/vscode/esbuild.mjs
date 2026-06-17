import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode', 'typescript'],
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
  target: 'node18',
  logLevel: 'info',
});
