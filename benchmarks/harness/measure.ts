import { performance } from 'node:perf_hooks';

export type BenchResult = {
  median: number;
  p95: number;
  min: number;
  max: number;
  mean: number;
  iterations: number;
};

export type BenchOptions = {
  warmup?: number;
  iterations?: number;
  /** Called before each iteration (outside timing). */
  setup?: () => void;
  /** Called after each iteration (outside timing). */
  teardown?: () => void;
};

function forceGC() {
  if (typeof globalThis.gc === 'function') {
    globalThis.gc();
  }
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function bench(fn: () => void, opts: BenchOptions = {}): BenchResult {
  const { warmup = 5, iterations = 50, setup, teardown } = opts;

  // Warmup
  for (let i = 0; i < warmup; i++) {
    setup?.();
    fn();
    teardown?.();
  }

  forceGC();

  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    setup?.();
    forceGC();

    const start = performance.now();
    fn();
    const end = performance.now();

    samples.push(end - start);
    teardown?.();
  }

  samples.sort((a, b) => a - b);

  return {
    median: percentile(samples, 50),
    p95: percentile(samples, 95),
    min: samples[0],
    max: samples[samples.length - 1],
    mean: samples.reduce((a, b) => a + b, 0) / samples.length,
    iterations,
  };
}

export async function benchAsync(
  fn: () => Promise<void>,
  opts: BenchOptions = {},
): Promise<BenchResult> {
  const { warmup = 5, iterations = 50, setup, teardown } = opts;

  for (let i = 0; i < warmup; i++) {
    setup?.();
    await fn();
    teardown?.();
  }

  forceGC();

  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    setup?.();
    forceGC();

    const start = performance.now();
    await fn();
    const end = performance.now();

    samples.push(end - start);
    teardown?.();
  }

  samples.sort((a, b) => a - b);

  return {
    median: percentile(samples, 50),
    p95: percentile(samples, 95),
    min: samples[0],
    max: samples[samples.length - 1],
    mean: samples.reduce((a, b) => a + b, 0) / samples.length,
    iterations,
  };
}

export function formatMs(ms: number): string {
  if (ms < 0.01) return `${(ms * 1000).toFixed(1)}µs`;
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  return `${ms.toFixed(1)}ms`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
