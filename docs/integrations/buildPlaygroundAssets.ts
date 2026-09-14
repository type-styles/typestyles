import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { AstroIntegration } from 'astro';

function runBuild(): Promise<void> {
  const docsRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['exec', 'tsx', 'scripts/build-playground-assets.mts'], {
      cwd: docsRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`build-playground-assets exited with code ${code}`));
    });
  });
}

/** Builds iframe vendor bundles and preview HTML for the interactive playground. */
export function buildPlaygroundAssetsIntegration(): AstroIntegration {
  return {
    name: 'build-playground-assets',
    hooks: {
      'astro:config:setup': async ({ command }) => {
        if (command === 'dev' || command === 'build') {
          await runBuild();
        }
      },
    },
  };
}
