import { gzipSync } from 'node:zlib';
import { bench, type BenchResult } from '../measure';
import {
  createVeReferenceApp,
  exerciseVeComponents,
  serializeCollectedCss,
  getCollectedCss,
  resetVe,
} from '../../reference-app-ve/index';

export type VeBenchmarkResults = {
  /** Time to create all styles, tokens, themes, keyframes, and globals (build-time equivalent). */
  registration: BenchResult;
  /** Time to call all recipe/selector functions (runtime class composition). */
  selectorCalls: BenchResult;
  /** Extracted CSS file size. */
  cssFileSize: {
    raw: number;
    gzip: number;
    ruleCount: number;
  };
};

export function runVeBenchmarks(): VeBenchmarkResults {
  // Registration benchmark
  const registration = bench(
    () => {
      createVeReferenceApp();
    },
    {
      setup: () => resetVe(),
      iterations: 30,
    },
  );

  // Selector calls benchmark
  let currentApp: ReturnType<typeof createVeReferenceApp>;

  const selectorCalls = bench(
    () => {
      exerciseVeComponents(currentApp);
    },
    {
      iterations: 100,
      setup: () => {
        resetVe();
        currentApp = createVeReferenceApp();
      },
    },
  );

  // CSS file size (deterministic — run once)
  resetVe();
  const app = createVeReferenceApp();
  exerciseVeComponents(app);
  const css = serializeCollectedCss();
  const entries = getCollectedCss();

  const cssFileSize = {
    raw: Buffer.byteLength(css, 'utf8'),
    gzip: gzipSync(Buffer.from(css)).length,
    ruleCount: entries.length,
  };

  return { registration, selectorCalls, cssFileSize };
}
