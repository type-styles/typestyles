import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const PAGE_BASENAMES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js']);
const LAYOUT_BASENAMES = new Set(['layout.tsx', 'layout.ts', 'layout.jsx', 'layout.js']);

export interface NextAppRoute {
  /** App Router path, e.g. `/`, `/about`, `/blog/[slug]`. */
  routePath: string;
  /** Page file relative to project root with `/` separators. */
  pageFile: string;
  /** Layout files from root to route segment, relative to project root. */
  layoutFiles: string[];
}

function normalizeRelPath(root: string, absPath: string): string {
  return relative(root, absPath).replace(/\\/g, '/');
}

function isRouteGroupSegment(segment: string): boolean {
  return segment.startsWith('(') && segment.endsWith(')');
}

/**
 * Convert `app/about/page.tsx` (relative to `appDir`) to `/about`.
 * Route groups `(marketing)` are omitted from the URL.
 */
export function pageRelPathToRoutePath(pageRelPath: string): string {
  const dir = dirname(pageRelPath).replace(/\\/g, '/');
  if (dir === '.' || dir === '') return '/';

  const segments = dir
    .split('/')
    .filter((segment) => segment.length > 0 && !isRouteGroupSegment(segment));

  return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}

function walkForPages(appAbs: string, currentRel: string, pages: string[]): void {
  const currentAbs = join(appAbs, currentRel);
  let entries: string[];
  try {
    entries = readdirSync(currentAbs);
  } catch {
    return;
  }

  for (const entry of entries) {
    const entryRel = currentRel ? join(currentRel, entry) : entry;
    const entryAbs = join(appAbs, entryRel);
    let stat;
    try {
      stat = statSync(entryAbs);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      walkForPages(appAbs, entryRel, pages);
      continue;
    }

    if (PAGE_BASENAMES.has(entry)) {
      pages.push(entryRel.replace(/\\/g, '/'));
    }
  }
}

function collectLayoutChain(appAbs: string, pageRelPath: string): string[] {
  const layouts: string[] = [];
  const segments = dirname(pageRelPath).replace(/\\/g, '/').split('/');
  const chainDirs: string[] = [''];

  for (const segment of segments) {
    if (!segment || segment === '.') continue;
    const parent = chainDirs[chainDirs.length - 1];
    chainDirs.push(parent ? `${parent}/${segment}` : segment);
  }

  for (const dir of chainDirs) {
    const dirAbs = dir ? join(appAbs, dir) : appAbs;
    for (const layoutName of LAYOUT_BASENAMES) {
      const layoutAbs = join(dirAbs, layoutName);
      if (existsSync(layoutAbs)) {
        layouts.push(join(dir, layoutName).replace(/\\/g, '/'));
        break;
      }
    }
  }

  return layouts;
}

/**
 * Discover App Router pages under `appDir` (default `app`).
 */
export function discoverNextAppRoutes(root: string, appDir = 'app'): NextAppRoute[] {
  const appAbs = resolve(root, appDir);
  if (!existsSync(appAbs)) return [];

  const pageRelPaths: string[] = [];
  walkForPages(appAbs, '', pageRelPaths);

  return pageRelPaths
    .map((pageRelPath) => {
      const pageFile = normalizeRelPath(root, join(appAbs, pageRelPath));
      const layoutFiles = collectLayoutChain(appAbs, pageRelPath).map((layoutRel) =>
        normalizeRelPath(root, join(appAbs, layoutRel)),
      );
      return {
        routePath: pageRelPathToRoutePath(pageRelPath),
        pageFile,
        layoutFiles,
      };
    })
    .sort((a, b) => a.routePath.localeCompare(b.routePath));
}
