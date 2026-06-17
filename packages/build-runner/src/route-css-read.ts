import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isManifestV2, normalizeRoutePath, type TypestylesExtractManifest } from './manifest';

export function readTypestylesManifest(
  root: string,
  manifestFile = 'app/typestyles.manifest.json',
): TypestylesExtractManifest {
  const manifestPath = resolve(root, manifestFile);
  if (!existsSync(manifestPath)) {
    throw new Error(`[typestyles] Missing manifest at ${manifestPath}.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    throw new Error(`[typestyles] Invalid JSON in ${manifestPath}.`);
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    !('css' in parsed)
  ) {
    throw new Error(`[typestyles] Manifest at ${manifestPath} is missing required fields.`);
  }

  return parsed as TypestylesExtractManifest;
}

export function readCssFile(root: string, cssRelPath: string): string {
  const cssPath = resolve(root, cssRelPath);
  if (!existsSync(cssPath)) {
    throw new Error(`[typestyles] Missing CSS file at ${cssPath}.`);
  }
  return readFileSync(cssPath, 'utf8');
}

export interface GetRouteCssOptions {
  /** Project root used to resolve manifest and CSS paths. */
  root: string;
  /** Manifest path relative to `root`. Defaults to `app/typestyles.manifest.json`. */
  manifestFile?: string;
}

/**
 * Read pre-extracted CSS for an App Router route from the build manifest.
 *
 * When the manifest is v2 and includes a route entry, returns that route's CSS.
 * Otherwise falls back to the full-app stylesheet path in the manifest.
 */
export function getRouteCss(routePath: string, options: GetRouteCssOptions): string {
  const manifest = readTypestylesManifest(options.root, options.manifestFile);
  const normalized = normalizeRoutePath(routePath);

  if (isManifestV2(manifest)) {
    const routeEntry = manifest.routes[normalized];
    if (routeEntry) {
      return readCssFile(options.root, routeEntry.css);
    }
  }

  return readCssFile(options.root, manifest.css);
}
