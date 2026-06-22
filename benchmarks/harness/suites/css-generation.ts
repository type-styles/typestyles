import { reset } from 'typestyles';
import { bench, type BenchResult } from '../measure';
import { createReferenceApp, exerciseComponents } from '../../reference-app/index';

export type CssGenerationResult = {
  /** Time to create all styles, tokens, themes, keyframes, and globals. */
  registration: BenchResult;
  /** Time to call all component functions (class name composition). */
  selectorCalls: BenchResult;
};

export function runCssGenerationBenchmark(): CssGenerationResult {
  const registration = bench(
    () => {
      const app = createReferenceApp({ mode: 'semantic' });
      app.createGlobals();
    },
    { setup: () => reset(), iterations: 30 },
  );

  // For selector calls, we time only the component function invocations.
  // Setup creates a fresh app each iteration so exerciseComponents has
  // valid component functions to call.
  let currentApp: ReturnType<typeof createReferenceApp>;

  const selectorCalls = bench(
    () => {
      exerciseComponents(currentApp);
    },
    {
      iterations: 100,
      setup: () => {
        reset();
        currentApp = createReferenceApp({ mode: 'semantic' });
        currentApp.createGlobals();
      },
    },
  );

  return { registration, selectorCalls };
}
