import { runCssGenerationBenchmark } from './suites/css-generation';
import { runCssFileSizeBenchmark } from './suites/css-file-size';
import { runRuntimeInjectionBenchmark } from './suites/runtime-injection';
import { runSsrCollectionBenchmark } from './suites/ssr-collection';
import { runVeBenchmarks } from './suites/ve-benchmarks';
import type { BenchmarkResults } from './report';

export function runAllBenchmarks(): BenchmarkResults {
  console.log('Running CSS generation benchmark...');
  const cssGeneration = runCssGenerationBenchmark();

  console.log('Running CSS file size benchmark...');
  const cssFileSize = runCssFileSizeBenchmark();

  console.log('Running runtime injection benchmark...');
  const runtimeInjection = runRuntimeInjectionBenchmark();

  console.log('Running SSR collection benchmark...');
  const ssrCollection = runSsrCollectionBenchmark();

  console.log('Running Vanilla Extract benchmarks...');
  const vanillaExtract = runVeBenchmarks();

  return { cssGeneration, cssFileSize, runtimeInjection, ssrCollection, vanillaExtract };
}
