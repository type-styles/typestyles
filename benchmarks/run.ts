import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAllBenchmarks } from './harness/runner';
import { printResults, checkRegressions, type BaselineData } from './harness/report';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = path.join(__dirname, 'baseline.json');

const args = process.argv.slice(2);
const isCI = args.includes('--ci');
const updateBaseline = args.includes('--update-baseline');

if (!globalThis.gc) {
  console.warn(
    'Warning: --expose-gc not enabled. GC forcing disabled — timing results may be noisier.\n' +
      'Run with: node --expose-gc --import tsx benchmarks/run.ts\n',
  );
}

const results = runAllBenchmarks();
printResults(results);

if (updateBaseline) {
  const baseline: BaselineData = {
    version: 1,
    timestamp: new Date().toISOString(),
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    results,
  };
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`Baseline updated: ${BASELINE_PATH}`);
}

if (isCI) {
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error('No baseline.json found. Run with --update-baseline first.');
    process.exit(1);
  }

  const baseline: BaselineData = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  const report = checkRegressions(results, baseline.results);

  if (report.passed) {
    console.log('All benchmarks within regression thresholds.');
  } else {
    console.error('\nBenchmark regressions detected:');
    for (const failure of report.failures) {
      console.error(`  - ${failure}`);
    }
    console.error(
      `\nBaseline from: ${baseline.timestamp} (${baseline.node}, ${baseline.platform})`,
    );
    console.error('If this is intentional, run: pnpm --filter @typestyles/benchmarks bench:update');
    process.exit(1);
  }
}
