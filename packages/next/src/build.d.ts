import type { NextConfig } from 'next';

export interface TypestylesExtractManifestV1 {
  version: 1;
  css: string;
}

export interface BuildTypestylesForNextOptions {
  root: string;
  modules: string[];
  cssOutFile: string;
  manifestOutFile?: string;
  manifestCssPath?: string;
}

export declare function buildTypestylesForNext(
  options: BuildTypestylesForNextOptions,
): Promise<void>;

export interface WithTypestylesExtractOptions {
  disableClientRuntime?: boolean;
}

export declare function withTypestylesExtract(
  nextConfig?: NextConfig,
  options?: WithTypestylesExtractOptions,
): NextConfig;
