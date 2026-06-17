export interface TypestylesExtractManifestV1 {
  version: 1;
  css: string;
}

export interface TypestylesRouteCssEntry {
  css: string;
}

export interface TypestylesExtractManifestV2 {
  version: 2;
  /** Full-app CSS (union of all registered styles). */
  css: string;
  /** Per-route critical CSS paths relative to project root. */
  routes: Record<string, TypestylesRouteCssEntry>;
}

export type TypestylesExtractManifest = TypestylesExtractManifestV1 | TypestylesExtractManifestV2;

export function isManifestV2(
  manifest: TypestylesExtractManifest,
): manifest is TypestylesExtractManifestV2 {
  return manifest.version === 2;
}

/** Normalize App Router paths for manifest lookup (`/about`, no trailing slash). */
export function normalizeRoutePath(routePath: string): string {
  if (!routePath || routePath === '/') return '/';
  const trimmed = routePath.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
