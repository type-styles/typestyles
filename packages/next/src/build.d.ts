import type { NextConfig } from 'next';
import type {
  WriteExtractedCssOptions,
  TypestylesExtractManifestV1,
} from '@typestyles/build';

export {
  writeExtractedCss,
  extractCss,
  type WriteExtractedCssOptions,
  type TypestylesExtractManifestV1,
} from '@typestyles/build';

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
