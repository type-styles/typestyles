import { reset, flushSync } from 'typestyles';
import { bench, type BenchResult } from '../measure';
import { createReferenceApp, exerciseComponents } from '../../reference-app/index';

export type RuntimeInjectionResult = {
  /** Time from creating all styles through flushSync() — measures full registration + CSS serialization + sheet insertion. */
  fullCycle: BenchResult;
};

/**
 * Measures the full runtime injection cycle in a Node/jsdom-like environment.
 *
 * NOTE: This runs in Node without a real DOM. It measures CSS serialization
 * and sheet buffering, not actual CSSOM insertion. For real browser injection
 * latency, use a Playwright-based benchmark (future work).
 */
export function runRuntimeInjectionBenchmark(): RuntimeInjectionResult {
  const fullCycle = bench(
    () => {
      const app = createReferenceApp({ mode: 'semantic' });
      app.createGlobals();
      exerciseComponents(app);
      flushSync();
    },
    { setup: () => reset(), iterations: 30 },
  );

  return { fullCycle };
}
