import { gzipSync } from 'node:zlib';
import { reset, getRegisteredCss, flushSync } from 'typestyles';
import type { ClassNamingMode } from 'typestyles';
import { createReferenceApp, exerciseComponents } from '../../reference-app/index';

export type CssSizeEntry = {
  raw: number;
  gzip: number;
  ruleCount: number;
};

export type CssFileSizeResult = {
  semantic: CssSizeEntry;
  hashed: CssSizeEntry;
  compact: CssSizeEntry;
  atomic: CssSizeEntry;
};

function gzipSize(input: string): number {
  return gzipSync(Buffer.from(input)).length;
}

function measureMode(mode: ClassNamingMode): CssSizeEntry {
  reset();
  const app = createReferenceApp({ mode });
  app.createGlobals();
  exerciseComponents(app);
  flushSync();

  const css = getRegisteredCss();
  const ruleCount = css.split('\n').filter((line: string) => line.trim().length > 0).length;

  return {
    raw: Buffer.byteLength(css, 'utf8'),
    gzip: gzipSize(css),
    ruleCount,
  };
}

export function runCssFileSizeBenchmark(): CssFileSizeResult {
  return {
    semantic: measureMode('semantic'),
    hashed: measureMode('hashed'),
    compact: measureMode('compact'),
    atomic: measureMode('atomic'),
  };
}
