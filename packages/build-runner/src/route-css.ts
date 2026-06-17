import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { discoverNextAppRoutes } from './next-routes';
import { createModuleLoader, traceTypestylesModules } from './trace-imports';
import type { TypestylesExtractManifestV2, TypestylesRouteCssEntry } from './manifest';

export interface CollectRouteCssOptions {
  root: string;
  /** Convention entry modules (relative to root) included in every route bundle. */
  sharedModules: string[];
  /** App Router directory relative to root. Default `app`. */
  appDir?: string;
  /** Output directory for per-route CSS relative to root. */
  routeCssOutDir?: string;
  /**
   * Collect CSS from traced modules.
   * Injected by `@typestyles/next/build` so this package stays bundler-agnostic.
   */
  collectCss: (loaders: Array<() => unknown | Promise<unknown>>) => Promise<string>;
}

export interface CollectRouteCssResult {
  routes: Record<string, TypestylesRouteCssEntry>;
}

function routePathToCssFile(routePath: string): string {
  if (routePath === '/') return 'index.css';
  const slug = routePath
    .slice(1)
    .replace(/^\[|\]$/g, '')
    .replace(/[^\w.-]+/g, '-');
  return `${slug || 'route'}.css`;
}

function uniqueModules(...groups: string[][]): string[] {
  return [...new Set(groups.flat())].sort();
}

/**
 * Emit per-route CSS files and return manifest route entries.
 */
export async function collectAndWriteRouteCss(
  options: CollectRouteCssOptions,
): Promise<CollectRouteCssResult> {
  const {
    root,
    sharedModules,
    appDir = 'app',
    routeCssOutDir = 'app/_typestyles/routes',
    collectCss,
  } = options;

  const routes = discoverNextAppRoutes(root, appDir);
  if (routes.length === 0) {
    return { routes: {} };
  }

  const manifestRoutes: Record<string, TypestylesRouteCssEntry> = {};

  for (const route of routes) {
    const entryFiles = uniqueModules(route.layoutFiles, [route.pageFile]);
    const routeModules = await traceTypestylesModules(root, entryFiles);
    const modules = uniqueModules(sharedModules, routeModules);
    const loaders = modules.map((mod) => createModuleLoader(root, mod));
    const css = await collectCss(loaders);

    const cssFileName = routePathToCssFile(route.routePath);
    const cssRel = `${routeCssOutDir.replace(/\\/g, '/')}/${cssFileName}`;
    const cssAbs = resolve(root, cssRel);
    await mkdir(dirname(cssAbs), { recursive: true });
    await writeFile(cssAbs, css, 'utf8');

    manifestRoutes[route.routePath] = { css: cssRel };
  }

  return { routes: manifestRoutes };
}

export function buildManifestV2(
  cssOutFile: string,
  routeEntries: Record<string, TypestylesRouteCssEntry>,
): TypestylesExtractManifestV2 {
  return {
    version: 2,
    css: cssOutFile,
    routes: routeEntries,
  };
}
