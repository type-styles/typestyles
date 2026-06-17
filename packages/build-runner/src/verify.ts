import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Manifest shape written by {@link buildTypestylesForNext} and verified here. */
export interface TypestylesExtractManifestV1 {
  version: 1;
  css: string;
}

export interface VerifyTypestylesBuildOptions {
  /** Project root used to resolve `cssFile` and `manifestFile`. */
  root: string;
  /** Extracted CSS path relative to `root`. */
  cssFile: string;
  /**
   * Manifest path relative to `root`. When omitted, manifest checks are skipped.
   * Pass `false` explicitly to skip (same as omitting).
   */
  manifestFile?: string | false;
  /** Expected manifest `css` field. Defaults to `cssFile`. */
  manifestCssPath?: string;
  /** Expected manifest version. Defaults to `1`. */
  manifestVersion?: number;
  /** Minimum CSS byte length. When omitted, only checks that the file is non-empty. */
  minBytes?: number;
  /** Substrings that must appear in the emitted CSS (app-specific sanity checks). */
  requiredCssSubstrings?: readonly string[];
}

export interface VerifyTypestylesBuildResult {
  cssPath: string;
  cssBytes: number;
  manifestPath?: string;
  manifestVersion?: number;
}

export class VerifyTypestylesBuildError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(`[typestyles:verify] ${message}`);
    this.name = 'VerifyTypestylesBuildError';
    this.code = code;
  }
}

function fail(message: string, code: string): never {
  throw new VerifyTypestylesBuildError(message, code);
}

function readManifest(path: string): TypestylesExtractManifestV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    fail(`Invalid JSON in ${path}.`, 'manifest-invalid-json');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    !('css' in parsed)
  ) {
    fail(`Manifest at ${path} is missing required fields.`, 'manifest-invalid-shape');
  }

  return parsed as TypestylesExtractManifestV1;
}

/**
 * Verify that a zero-runtime TypeStyles build produced expected CSS (and optional manifest).
 *
 * Use after `runTypestylesBuild`, `buildTypestylesForNext`, or a bundler plugin build step in CI
 * to catch silent extraction gaps — styles unreachable from the convention entry are dropped
 * without a compile error.
 */
export function verifyTypestylesBuild(
  options: VerifyTypestylesBuildOptions,
): VerifyTypestylesBuildResult {
  const {
    root,
    cssFile,
    manifestFile,
    manifestCssPath,
    manifestVersion = 1,
    minBytes,
    requiredCssSubstrings = [],
  } = options;

  const cssPath = resolve(root, cssFile);
  if (!existsSync(cssPath)) {
    fail(`Missing ${cssPath} — run your TypeStyles build step first.`, 'css-missing');
  }

  const css = readFileSync(cssPath, 'utf8');
  const cssBytes = Buffer.byteLength(css, 'utf8');
  const min = minBytes ?? 1;
  if (cssBytes < min) {
    fail(
      `CSS file unexpectedly small (${cssBytes} bytes, expected at least ${min}).`,
      'css-too-small',
    );
  }

  for (const substring of requiredCssSubstrings) {
    if (!css.includes(substring)) {
      fail(`Expected CSS to contain ${JSON.stringify(substring)}.`, 'css-missing-substring');
    }
  }

  const manifestRel = manifestFile === false ? undefined : manifestFile;
  if (!manifestRel) {
    return { cssPath, cssBytes };
  }

  const manifestPath = resolve(root, manifestRel);
  if (!existsSync(manifestPath)) {
    fail(`Missing ${manifestPath}.`, 'manifest-missing');
  }

  const manifest = readManifest(manifestPath);
  if (manifest.version !== manifestVersion) {
    fail(
      `Expected manifest version ${manifestVersion}, got ${manifest.version}.`,
      'manifest-version-mismatch',
    );
  }

  const expectedCssPath = manifestCssPath ?? cssFile;
  if (manifest.css !== expectedCssPath) {
    fail(
      `Expected manifest.css ${JSON.stringify(expectedCssPath)}, got ${JSON.stringify(manifest.css)}.`,
      'manifest-css-mismatch',
    );
  }

  return {
    cssPath,
    cssBytes,
    manifestPath,
    manifestVersion: manifest.version,
  };
}
