import { stat } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import fg from 'fast-glob';
import picomatch from 'picomatch';

const DEFAULT_EXCLUDES = ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.turbo/**'];

function normalizeExtension(extension: string): string {
  return extension.startsWith('.') ? extension : `.${extension}`;
}

export async function collectTargetFiles(
  cwd: string,
  targets: string[],
  extensions: string[],
  include: string[],
  exclude: string[],
): Promise<string[]> {
  const normalizedTargets = targets.length > 0 ? targets : ['.'];
  const literalFiles: string[] = [];
  const dynamicPatterns: string[] = [];

  for (const target of normalizedTargets) {
    const absolute = resolve(cwd, target);
    try {
      const targetStat = await stat(absolute);
      if (targetStat.isFile()) {
        literalFiles.push(absolute);
      } else if (targetStat.isDirectory()) {
        dynamicPatterns.push(`${absolute.split('\\').join('/')}/**/*`);
      }
    } catch {
      dynamicPatterns.push(target);
    }
  }

  const globbed = await fg(dynamicPatterns, {
    cwd,
    absolute: true,
    onlyFiles: true,
    ignore: [...DEFAULT_EXCLUDES, ...exclude],
  });

  const extensionSet = new Set(extensions.map(normalizeExtension));
  const includeMatchers = include.length > 0 ? include.map((pattern) => picomatch(pattern)) : null;
  const unique = new Set([...literalFiles, ...globbed]);

  return Array.from(unique)
    .filter((filePath) => extensionSet.has(extname(filePath)))
    .filter((filePath) => {
      if (!includeMatchers) return true;
      const rel = relative(cwd, filePath).split('\\').join('/');
      return includeMatchers.some((matcher) => matcher(rel));
    })
    .sort();
}
