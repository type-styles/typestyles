/**
 * Playground-only reimplementation of `typestyles/testing` that imports `reset`
 * from the vendor `typestyles` module (via import map) so stylesheet state is shared.
 */
import { reset } from 'typestyles';

const afterResetListeners = new Set<() => void>();

export function onAfterReset(fn: () => void): () => void {
  afterResetListeners.add(fn);
  return () => {
    afterResetListeners.delete(fn);
  };
}

export function resetAll(): void {
  reset();
  for (const listener of afterResetListeners) {
    listener();
  }
}

export function createTestHarness(options?: { globals?: Array<() => void> }): {
  reset: () => void;
} {
  for (const fn of options?.globals ?? []) {
    onAfterReset(fn);
  }
  return { reset: resetAll };
}
