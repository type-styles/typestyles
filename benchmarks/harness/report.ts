import { formatMs, formatBytes, type BenchResult } from './measure';
import type { VeBenchmarkResults } from './suites/ve-benchmarks';

export type BenchmarkResults = {
  cssGeneration: {
    registration: BenchResult;
    selectorCalls: BenchResult;
  };
  cssFileSize: {
    semantic: { raw: number; gzip: number; ruleCount: number };
    hashed: { raw: number; gzip: number; ruleCount: number };
    compact: { raw: number; gzip: number; ruleCount: number };
    atomic: { raw: number; gzip: number; ruleCount: number };
  };
  runtimeInjection: {
    fullCycle: BenchResult;
  };
  ssrCollection: {
    perRequest: BenchResult;
    collectedCssBytes: number;
  };
  vanillaExtract: VeBenchmarkResults;
};

export type BaselineData = {
  version: number;
  timestamp: string;
  node: string;
  platform: string;
  results: BenchmarkResults;
};

function padRight(s: string, len: number): string {
  return s + ' '.repeat(Math.max(0, len - s.length));
}

function padLeft(s: string, len: number): string {
  return ' '.repeat(Math.max(0, len - s.length)) + s;
}

function timingRow(label: string, result: BenchResult): string {
  return `  ${padRight(label, 36)} ${padLeft(formatMs(result.median), 10)} ${padLeft(formatMs(result.p95), 10)} ${padLeft(formatMs(result.min), 10)} ${padLeft(formatMs(result.max), 10)}`;
}

function timingHeader(): string {
  return `  ${padRight('', 36)} ${padLeft('median', 10)} ${padLeft('p95', 10)} ${padLeft('min', 10)} ${padLeft('max', 10)}`;
}

export function printResults(results: BenchmarkResults): void {
  console.log('\n=== TypeStyles Benchmark Results ===\n');

  // CSS Generation
  console.log('CSS Generation (50 components, 8 token namespaces, 3 themes)');
  console.log(timingHeader());
  console.log(timingRow('Style registration', results.cssGeneration.registration));
  console.log(timingRow('Selector calls (~90 calls)', results.cssGeneration.selectorCalls));

  // CSS File Size
  console.log('\nExtracted CSS File Size');
  console.log(
    `  ${padRight('Mode', 12)} ${padLeft('Raw', 10)} ${padLeft('Gzip', 10)} ${padLeft('Rules', 8)}`,
  );
  for (const mode of ['semantic', 'hashed', 'compact', 'atomic'] as const) {
    const entry = results.cssFileSize[mode];
    console.log(
      `  ${padRight(mode, 12)} ${padLeft(formatBytes(entry.raw), 10)} ${padLeft(formatBytes(entry.gzip), 10)} ${padLeft(String(entry.ruleCount), 8)}`,
    );
  }

  // Runtime Injection
  console.log('\nRuntime Injection (Node — no real DOM)');
  console.log(timingHeader());
  console.log(timingRow('Full cycle (reg + flush)', results.runtimeInjection.fullCycle));

  // SSR Collection
  console.log('\nSSR Collection (per request)');
  console.log(timingHeader());
  console.log(timingRow('collectStyles()', results.ssrCollection.perRequest));
  console.log(`  Collected CSS: ${formatBytes(results.ssrCollection.collectedCssBytes)}`);

  // Vanilla Extract comparison
  const ve = results.vanillaExtract;
  console.log('\n=== Vanilla Extract Comparison ===\n');

  console.log('Style Registration (same 50-component design system)');
  console.log(timingHeader());
  console.log(timingRow('TypeStyles', results.cssGeneration.registration));
  console.log(timingRow('Vanilla Extract', ve.registration));

  console.log('\nSelector Calls (~60+ recipe/style fn calls)');
  console.log(timingHeader());
  console.log(timingRow('TypeStyles', results.cssGeneration.selectorCalls));
  console.log(timingRow('Vanilla Extract', ve.selectorCalls));

  console.log('\nExtracted CSS File Size');
  console.log(
    `  ${padRight('Framework', 20)} ${padLeft('Raw', 10)} ${padLeft('Gzip', 10)} ${padLeft('Rules', 8)}`,
  );
  console.log(
    `  ${padRight('TypeStyles (semantic)', 20)} ${padLeft(formatBytes(results.cssFileSize.semantic.raw), 10)} ${padLeft(formatBytes(results.cssFileSize.semantic.gzip), 10)} ${padLeft(String(results.cssFileSize.semantic.ruleCount), 8)}`,
  );
  console.log(
    `  ${padRight('TypeStyles (atomic)', 20)} ${padLeft(formatBytes(results.cssFileSize.atomic.raw), 10)} ${padLeft(formatBytes(results.cssFileSize.atomic.gzip), 10)} ${padLeft(String(results.cssFileSize.atomic.ruleCount), 8)}`,
  );
  console.log(
    `  ${padRight('Vanilla Extract', 20)} ${padLeft(formatBytes(ve.cssFileSize.raw), 10)} ${padLeft(formatBytes(ve.cssFileSize.gzip), 10)} ${padLeft(String(ve.cssFileSize.ruleCount), 8)}`,
  );

  console.log('');
}

export type RegressionReport = {
  passed: boolean;
  failures: string[];
};

/**
 * Only file sizes are gated in CI — they're deterministic and platform-independent.
 * Timing varies wildly across hardware (Apple Silicon vs CI VMs can differ 3x+),
 * so timing results are printed for visibility but don't block the build.
 */
export function checkRegressions(
  current: BenchmarkResults,
  baseline: BenchmarkResults,
): RegressionReport {
  const failures: string[] = [];
  const SIZE_THRESHOLD = 0.05;

  function checkSize(label: string, current: number, baseline: number) {
    const ratio = current / baseline;
    if (ratio > 1 + SIZE_THRESHOLD) {
      failures.push(
        `${label}: ${formatBytes(current)} (was ${formatBytes(baseline)}, +${((ratio - 1) * 100).toFixed(1)}%, threshold ${(SIZE_THRESHOLD * 100).toFixed(0)}%)`,
      );
    }
  }

  for (const mode of ['semantic', 'hashed', 'compact', 'atomic'] as const) {
    checkSize(
      `CSS size ${mode} (raw)`,
      current.cssFileSize[mode].raw,
      baseline.cssFileSize[mode].raw,
    );
    checkSize(
      `CSS size ${mode} (gzip)`,
      current.cssFileSize[mode].gzip,
      baseline.cssFileSize[mode].gzip,
    );
  }

  return { passed: failures.length === 0, failures };
}
