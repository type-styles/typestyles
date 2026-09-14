import * as esbuild from 'esbuild-wasm';

let initPromise: Promise<void> | null = null;

export function ensureEsbuild(): Promise<void> {
  if (!initPromise) {
    initPromise = esbuild
      .initialize({
        wasmURL: new URL('esbuild-wasm/esbuild.wasm', import.meta.url).href,
      })
      .catch((error) => {
        // Allow a retry on hard failure (e.g. network blip loading wasm).
        initPromise = null;
        throw error;
      });
  }
  return initPromise;
}

export async function transpilePlaygroundSource(source: string): Promise<string> {
  await ensureEsbuild();
  const result = await esbuild.transform(source, {
    loader: 'tsx',
    jsx: 'automatic',
    jsxImportSource: '@typestyles/react',
    target: 'es2022',
    format: 'esm',
  });
  return result.code;
}

export function formatTranspileError(error: unknown): string {
  if (error && typeof error === 'object' && 'errors' in error) {
    const esbuildError = error as {
      errors?: Array<{ text: string; location?: { line: number; column: number } }>;
    };
    return (esbuildError.errors ?? [])
      .map((item) => {
        const loc = item.location ? ` (${item.location.line}:${item.location.column})` : '';
        return `${item.text}${loc}`;
      })
      .join('\n');
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
