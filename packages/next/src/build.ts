import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { collectStylesFromModules } from 'typestyles/build';
import type { NextConfig } from 'next';

/** Manifest shape written next to extracted CSS (optional). */
export interface TypestylesExtractManifestV1 {
  version: 1;
  css: string;
}

/** Shape of `require('webpack')` for `DefinePlugin` only (webpack is an optional peer). */
type WebpackWithDefinePlugin = {
  DefinePlugin: new (definitions: Record<string, string>) => unknown;
};

export interface BuildTypestylesForNextOptions {
  root: string;
  modules: string[];
  cssOutFile: string;
  manifestOutFile?: string;
  manifestCssPath?: string;
}

/**
 * Extract TypeStyles CSS for a Next.js app (run from a script before `next build`, or in CI).
 * Loads each module path (relative to `root`) so side-effect registrations run, then writes CSS.
 */
export async function buildTypestylesForNext(
  options: BuildTypestylesForNextOptions,
): Promise<void> {
  const { root, modules, cssOutFile, manifestOutFile, manifestCssPath } = options;
  const loaders = modules.map((mod) => {
    const abs = resolve(root, mod);
    const href = pathToFileURL(abs).href;
    return () => import(href);
  });
  const css = await collectStylesFromModules(loaders);
  const outAbs = resolve(root, cssOutFile);
  await mkdir(dirname(outAbs), { recursive: true });
  await writeFile(outAbs, css, 'utf8');
  if (manifestOutFile) {
    const manifest: TypestylesExtractManifestV1 = {
      version: 1,
      css: manifestCssPath ?? cssOutFile,
    };
    const manAbs = resolve(root, manifestOutFile);
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
          const require = createRequire(join(process.cwd(), 'package.json'));
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
