import { build as esbuildBuild } from 'esbuild';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export interface RunTypestylesBuildOptions {
  /**
   * Project root used to resolve extraction entry modules.
   */
  root: string;
  /**
   * Module paths (relative to root) that register typestyles styles.
   */
  modules: string[];
}

function toImportPath(modulePath: string): string {
  const normalized = modulePath.replace(/\\/g, '/');
  if (normalized.startsWith('.') || normalized.startsWith('/')) {
    return normalized;
  }
  return `./${normalized}`;
}

/**
 * Bundle + execute style registration modules and return collected CSS.
 *
 * This is shared by integrations (Vite, Rollup, Rolldown, etc.) so app code
 * does not need an external TS runtime loader like tsx.
 */
export async function runTypestylesBuild({
  root,
  modules,
}: RunTypestylesBuildOptions): Promise<string> {
  if (!modules.length) return '';

  const importLines = modules
    .map((mod) => `import ${JSON.stringify(toImportPath(mod))};`)
    .join('\n');
  const bundleResult = await esbuildBuild({
    write: false,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    external: ['typestyles'],
    stdin: {
      contents: importLines,
      resolveDir: root,
      sourcefile: 'typestyles-extract-entry.ts',
      loader: 'ts',
    },
  });

  const bundledCode = bundleResult.outputFiles?.[0]?.text;
  if (!bundledCode) {
    throw new Error('[typestyles] Failed to produce extraction bundle.');
  }

  const scriptPath = resolve(root, `.typestyles-extract-${process.pid}.cjs`);
  const script = `${bundledCode}\nprocess.stdout.write(require('typestyles').getRegisteredCss());\n`;

  try {
    writeFileSync(scriptPath, script, 'utf8');
    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.error) {
      throw new Error(`[typestyles] Extraction failed: ${result.error.message}.`);
    }
    if (result.status !== 0) {
      throw new Error(
        `[typestyles] Extraction script failed:\n${result.stderr || result.stdout || 'unknown error'}`,
      );
    }

    return result.stdout ?? '';
  } finally {
    if (existsSync(scriptPath)) {
      try {
        unlinkSync(scriptPath);
      } catch {
        // Best effort cleanup for temp script.
      }
    }
  }
}
