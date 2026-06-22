import { reset, createStyles, createTokens } from 'typestyles';
import { collectStyles } from 'typestyles/server';
import { bench, type BenchResult } from '../measure';
import { createReferenceTokens } from '../../reference-app/tokens';
import { createReferenceComponents } from '../../reference-app/components';
import { createReferenceThemes } from '../../reference-app/themes';
import { createReferenceGlobals } from '../../reference-app/globals';
import { createReferenceKeyframes } from '../../reference-app/keyframes';
import { exerciseComponents } from '../../reference-app/index';

export type SsrCollectionResult = {
  /** Time for a single collectStyles() pass — simulates one SSR request. */
  perRequest: BenchResult;
  /** CSS string length from a single collection. */
  collectedCssBytes: number;
};

export function runSsrCollectionBenchmark(): SsrCollectionResult {
  let collectedCssBytes = 0;

  const perRequest = bench(
    () => {
      const { css } = collectStyles(() => {
        const styles = createStyles({ mode: 'semantic', scopeId: 'bench' });
        const tokensApi = createTokens({ scopeId: 'bench' });
        const tokens = createReferenceTokens(tokensApi);
        const components = createReferenceComponents(styles, tokens);
        createReferenceThemes(tokensApi);
        createReferenceKeyframes();
        createReferenceGlobals(tokens);
        exerciseComponents({
          styles,
          tokens: tokensApi,
          components,
          themes: {} as any,
          keyframes: {} as any,
          createGlobals: () => {},
        });
        return '<div>rendered</div>';
      });
      collectedCssBytes = Buffer.byteLength(css, 'utf8');
    },
    {
      setup: () => reset(),
      iterations: 30,
    },
  );

  return { perRequest, collectedCssBytes };
}
