const COMPOSE_META = '__tsCm';

export type ComposeAwareFn = ((selections?: Record<string, unknown>) => string) & {
  [COMPOSE_META]?: readonly string[];
};

export function attachComposeMeta(fn: object, keys: readonly string[]): void {
  Object.defineProperty(fn, COMPOSE_META, {
    value: keys,
    enumerable: false,
    writable: false,
    configurable: true,
  });
}

export function collectComposeAllowedKeys(selectors: Array<ComposeAwareFn | string>): Set<string> {
  const keys = new Set<string>();
  for (const selector of selectors) {
    if (typeof selector !== 'function') continue;
    const allowed = (selector as ComposeAwareFn)[COMPOSE_META];
    if (!allowed) continue;
    for (const key of allowed) keys.add(key);
  }
  return keys;
}

export function devWarnComposeUnknownKeys(
  selections: Record<string, unknown> | undefined,
  allowedKeys: Set<string>,
): void {
  if (process.env.NODE_ENV === 'production') return;
  if (!selections || allowedKeys.size === 0) return;
  for (const key of Object.keys(selections)) {
    if (!allowedKeys.has(key)) {
      console.error(`[typestyles] Unknown variant "${key}" in compose().`);
    }
  }
}
