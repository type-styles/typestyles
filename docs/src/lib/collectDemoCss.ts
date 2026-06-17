import { runTypestylesBuild } from '@typestyles/build-runner';

/** Fresh Node extraction per demo — avoids Vite module cache skipping registration in dev. */
export async function collectDemoCss(modulePath: string): Promise<string> {
  // `process.cwd()` is the docs package root for `astro dev` / `astro build`.
  return runTypestylesBuild({
    root: process.cwd(),
    modules: [modulePath],
  });
}
