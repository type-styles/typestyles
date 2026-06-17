import type { NextConfig } from 'next';

export interface TypestylesExtractManifestV1 {
  version: 1;
  css: string;
}

export interface TypestylesRouteCssEntry {
  css: string;
}

export interface TypestylesExtractManifestV2 {
  version: 2;
  css: string;
  routes: Record<string, TypestylesRouteCssEntry>;
}

export type TypestylesExtractManifest = TypestylesExtractManifestV1 | TypestylesExtractManifestV2;

export declare const DEFAULT_EXTRACT_MODULE_CANDIDATES: readonly string[];

export declare function discoverDefaultExtractModules(root: string): string[];

export interface BuildTypestylesForNextOptions {
  root: string;
  modules?: string[];
  cssOutFile?: string;
  manifestOutFile?: string | false;
  manifestCssPath?: string;
  routeCss?: boolean;
  routeCssOutDir?: string;
  appDir?: string;
}

export declare function buildTypestylesForNext(
  options: BuildTypestylesForNextOptions,
): Promise<void>;

export interface WithTypestylesExtractOptions {
  disableClientRuntime?: boolean;
  root?: string;
}

export interface WithTypestylesOptions extends WithTypestylesExtractOptions {
  root?: string;
}

export declare function withTypestyles(
  nextConfig?: NextConfig,
  options?: WithTypestylesOptions,
): NextConfig;

export declare function withTypestylesExtract(
  nextConfig?: NextConfig,
  options?: WithTypestylesExtractOptions,
): NextConfig;

export interface GetRouteCssOptions {
  root: string;
  manifestFile?: string;
}

export declare function getRouteCss(routePath: string, options: GetRouteCssOptions): string;

export {
  verifyTypestylesBuild,
  VerifyTypestylesBuildError,
  type VerifyTypestylesBuildOptions,
  type VerifyTypestylesBuildResult,
} from '@typestyles/build-runner';
