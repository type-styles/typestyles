import { build as esbuildBuild } from 'esbuild';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TYPESTYLES_IMPORT_RE } from './namespaces';

const EXTERNAL_PREFIXES = [
  'react',
  'react-dom',
  'react/',
  'react-dom/',
  'next',
  'next/',
  'server-only',
  'client-only',
  'typestyles',
  'typestyles/',
];

function isExternalBareImport(specifier: string): boolean {
  if (specifier.startsWith('node:')) return true;
  return EXTERNAL_PREFIXES.some(
    (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`),
  );
}

function fileImportsTypestyles(absPath: string): boolean {
  if (!existsSync(absPath)) return false;
  try {
    return TYPESTYLES_IMPORT_RE.test(readFileSync(absPath, 'utf8'));
  } catch {
    return false;
  }
}

/**
 * Trace local modules reachable from entry files and return those that import `typestyles`.
 * Paths are relative to `root` with `/` separators.
 */
export async function traceTypestylesModules(
  root: string,
  entryFiles: string[],
): Promise<string[]> {
  const absEntries = entryFiles.map((file) => resolve(root, file));
  const missing = absEntries.filter((file) => !existsSync(file));
  if (missing.length > 0) {
    throw new Error(
      `[typestyles] Cannot trace imports; missing entry file(s): ${missing.join(', ')}`,
    );
  }

  const tsconfigPath = join(root, 'tsconfig.json');
  const result = await esbuildBuild({
    entryPoints: absEntries,
    bundle: true,
    write: false,
    outdir: root,
    metafile: true,
    platform: 'neutral',
    format: 'esm',
    logLevel: 'silent',
    absWorkingDir: root,
    ...(existsSync(tsconfigPath) ? { tsconfig: tsconfigPath } : {}),
    plugins: [
      {
        name: 'typestyles-trace-imports',
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (args.path.startsWith('.') || args.path.startsWith('/')) {
              return null;
            }
            if (isExternalBareImport(args.path)) {
              return { path: args.path, external: true };
            }
            return null;
          });
        },
      },
    ],
  });

  const inputs = result.metafile?.inputs ?? {};
  const traced = new Set<string>();

  for (const inputPath of Object.keys(inputs)) {
    const absPath = resolve(root, inputPath);
    if (!fileImportsTypestyles(absPath)) continue;
    traced.add(inputPath.replace(/\\/g, '/'));
  }

  return [...traced].sort();
}

/** Load a traced module for style extraction. */
export function createModuleLoader(root: string, modulePath: string): () => Promise<unknown> {
  const abs = resolve(root, modulePath);
  const href = pathToFileURL(abs).href;
  return () => import(href);
}
