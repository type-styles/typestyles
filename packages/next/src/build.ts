import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  DEFAULT_EXTRACT_MODULE_CANDIDATES,
  discoverDefaultExtractModules,
  verifyTypestylesBuild,
  VerifyTypestylesBuildError,
  type TypestylesExtractManifestV1,
  type VerifyTypestylesBuildOptions,
  type VerifyTypestylesBuildResult,
} from '@typestyles/build-runner';
import { collectStylesFromModules } from 'typestyles/build';
import type { NextConfig } from 'next';

/** Re-export shared convention paths (aligned with `@typestyles/vite`). */
export {
  DEFAULT_EXTRACT_MODULE_CANDIDATES,
  discoverDefaultExtractModules,
  verifyTypestylesBuild,
  VerifyTypestylesBuildError,
  type TypestylesExtractManifestV1,
  type VerifyTypestylesBuildOptions,
  type VerifyTypestylesBuildResult,
};

/** Shape of `require('webpack')` for `DefinePlugin` only (webpack is an optional peer). */
type WebpackWithDefinePlugin = {
  DefinePlugin: new (definitions: Record<string, string>) => unknown;
};

export interface BuildTypestylesForNextOptions {
  root: string;
  /**
   * Style entry modules relative to `root`. When omitted, uses the same convention discovery as
   * `@typestyles/vite` (see {@link discoverDefaultExtractModules}).
   */
  modules?: string[];
  /** Output CSS path relative to `root`. Defaults to `app/typestyles.css`. */
  cssOutFile?: string;
  /**
   * Manifest path relative to `root`. Defaults to `app/typestyles.manifest.json`.
   * Pass `false` to skip writing a manifest.
   */
  manifestOutFile?: string | false;
  /** Value stored in the manifest `css` field. Defaults to `cssOutFile`. */
  manifestCssPath?: string;
}

function resolveExtractModulesForNext(root: string, modules?: string[]): string[] {
  if (modules !== undefined) {
    return modules;
  }
  const found = discoverDefaultExtractModules(root);
  if (found.length === 0) {
    throw new Error(
      `[typestyles] No extraction entry found under ${root}. Add a convention file (see DEFAULT_EXTRACT_MODULE_CANDIDATES from @typestyles/build-runner) or pass modules to buildTypestylesForNext.`,
    );
  }
  return found;
}

/**
 * Extract TypeStyles CSS for a Next.js app (run from a script before `next build`, or in CI).
 * Loads each module path (relative to `root`) so side-effect registrations run, then writes CSS.
 *
 * Defaults mirror `@typestyles/vite`: discovers a convention entry when `modules` is omitted,
 * writes `app/typestyles.css` and `app/typestyles.manifest.json` unless overridden.
 */
export async function buildTypestylesForNext(
  options: BuildTypestylesForNextOptions,
): Promise<void> {
  const {
    root,
    modules,
    cssOutFile = 'app/typestyles.css',
    manifestOutFile,
    manifestCssPath,
  } = options;

  const resolvedModules = resolveExtractModulesForNext(root, modules);

  const loaders = resolvedModules.map((mod) => {
    const abs = resolve(root, mod);
    const href = pathToFileURL(abs).href;
    return () => import(href);
  });
  const css = await collectStylesFromModules(loaders);
  const outAbs = resolve(root, cssOutFile);
  await mkdir(dirname(outAbs), { recursive: true });
  await writeFile(outAbs, css, 'utf8');

  const manifestRel =
    manifestOutFile === false ? undefined : (manifestOutFile ?? 'app/typestyles.manifest.json');

  if (manifestRel) {
    const manifest: TypestylesExtractManifestV1 = {
      version: 1,
      css: manifestCssPath ?? cssOutFile,
    };
    const manAbs = resolve(root, manifestRel);
    await mkdir(dirname(manAbs), { recursive: true });
    await writeFile(manAbs, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }
}

export interface WithTypestylesExtractOptions {
  /**
   * When true (default), client bundles skip DOM style injection (`__TYPESTYLES_RUNTIME_DISABLED__`).
   * Pair with a global stylesheet from {@link buildTypestylesForNext}.
   */
  disableClientRuntime?: boolean;
  /**
   * Project root used for module resolution (e.g. loading `webpack`). Defaults to `process.cwd()`.
   */
  root?: string;
}

export interface WithTypestylesOptions extends WithTypestylesExtractOptions {
  /**
   * Project root for convention discovery. Defaults to `process.cwd()` (the directory Next runs from).
   */
  root?: string;
}

/**
 * Production Next.js config helper aligned with `@typestyles/vite`: when `NODE_ENV === 'production'`
 * and a convention entry file exists under `root`, applies {@link withTypestylesExtract}; otherwise
 * returns `nextConfig` unchanged (development keeps runtime injection).
 */
export function withTypestyles(
  nextConfig: NextConfig = {},
  options: WithTypestylesOptions = {},
): NextConfig {
  const projectRoot = options.root ?? process.cwd();
  const hasConventionEntry = discoverDefaultExtractModules(projectRoot).length > 0;
  const prod = process.env.NODE_ENV === 'production';

  if (!prod || !hasConventionEntry) {
    return nextConfig;
  }

  return withTypestylesExtract(nextConfig, options);
}

/**
 * Merge Next.js config so client bundles use pre-extracted CSS only (no runtime `<style>` injection).
 *
 * - **Webpack**: adds `DefinePlugin` for `__TYPESTYLES_RUNTIME_DISABLED__` on client bundles.
 * - **Turbopack** (`next dev --turbo` / Turbopack production): webpack hooks do not run; the same
 *   `next.config` `env` entry `NEXT_PUBLIC_TYPESTYLES_RUNTIME_DISABLED` is merged so the client
 *   bundle still disables runtime insertion (see `typestyles` `sheet` implementation).
 */
export function withTypestylesExtract(
  nextConfig: NextConfig = {},
  options: WithTypestylesExtractOptions = {},
): NextConfig {
  const disableClientRuntime = options.disableClientRuntime !== false;
  const projectRoot = options.root ?? process.cwd();

  return {
    ...nextConfig,
    ...(disableClientRuntime
      ? {
          env: {
            ...(typeof nextConfig.env === 'object' &&
            nextConfig.env !== null &&
            !Array.isArray(nextConfig.env)
              ? (nextConfig.env as Record<string, string>)
              : {}),
            NEXT_PUBLIC_TYPESTYLES_RUNTIME_DISABLED: 'true',
          },
        }
      : {}),
    webpack(config, context) {
      const nextWebpack =
        typeof nextConfig.webpack === 'function' ? nextConfig.webpack(config, context) : config;

      if (disableClientRuntime && !context.isServer) {
        try {
          const require = createRequire(join(projectRoot, 'package.json'));
          const webpackLib = require('webpack') as WebpackWithDefinePlugin;
          nextWebpack.plugins.push(
            new webpackLib.DefinePlugin({
              __TYPESTYLES_RUNTIME_DISABLED__: JSON.stringify('true'),
            }),
          );
        } catch {
          console.warn(
            '[@typestyles/next/build] Could not load webpack; client bundles may still inject <style>.',
          );
        }
      }

      return nextWebpack;
    },
  };
}
