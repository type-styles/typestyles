import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  runTypestylesBuild,
  type RunTypestylesBuildOptions,
} from '@typestyles/build-runner';

export { runTypestylesBuild, type RunTypestylesBuildOptions };

/** Minimal manifest for tooling; future versions may add namespace → class maps. */
export interface TypestylesExtractManifestV1 {
  version: 1;
  /** Project-relative path to the generated CSS file (forward slashes). */
  css: string;
}

export interface WriteExtractedCssOptions extends RunTypestylesBuildOptions {
  /**
   * Output path for the CSS file. Relative paths are resolved from `root`.
   */
  outFile: string;
  /** When set, writes `TypestylesExtractManifestV1` JSON next to other outputs. */
  manifestOutFile?: string;
  /** `css` field in the manifest (defaults to normalized `outFile`). */
  manifestCssPath?: string;
}

/**
 * Run extraction and write the resulting CSS to disk.
 */
export async function writeExtractedCss(options: WriteExtractedCssOptions): Promise<void> {
  const { outFile, manifestOutFile, manifestCssPath, ...rest } = options;
  const css = await runTypestylesBuild(rest);
  const abs = resolve(rest.root, outFile);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, css, 'utf8');
  if (manifestOutFile) {
    const manifest: TypestylesExtractManifestV1 = {
      version: 1,
      css: (manifestCssPath ?? outFile).replace(/\\/g, '/'),
    };
    const manAbs = resolve(rest.root, manifestOutFile);
    mkdirSync(dirname(manAbs), { recursive: true });
    writeFileSync(manAbs, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }
}

/**
 * Extract CSS without writing (convenience alias).
 */
export async function extractCss(options: RunTypestylesBuildOptions): Promise<string> {
  return runTypestylesBuild(options);
}
