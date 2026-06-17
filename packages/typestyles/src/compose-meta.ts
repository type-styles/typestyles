export const TYPESTYLES_COMPOSE_META = Symbol.for('typestyles.composeMeta');

export type ComposeVariantMeta =
  | { kind: 'dimensioned'; dimensions: readonly string[] }
  | { kind: 'flat'; keys: readonly string[] };

export type ComposeAwareFn = ((selections?: Record<string, unknown>) => string) & {
  [TYPESTYLES_COMPOSE_META]?: ComposeVariantMeta;
};

export function attachComposeMeta(fn: Function, meta: ComposeVariantMeta): void {
  Object.defineProperty(fn, TYPESTYLES_COMPOSE_META, {
    value: meta,
    enumerable: false,
    writable: false,
    configurable: true,
  });
}

function getComposeAllowedKeys(fn: unknown): Set<string> | null {
  if (typeof fn !== 'function') return null;
  const meta = (fn as ComposeAwareFn)[TYPESTYLES_COMPOSE_META];
  if (!meta) return null;
  if (meta.kind === 'dimensioned') return new Set(meta.dimensions);
  return new Set(meta.keys);
}

export function collectComposeAllowedKeys(selectors: Array<ComposeAwareFn | string>): Set<string> {
  const keys = new Set<string>();
  for (const selector of selectors) {
    if (typeof selector !== 'function') continue;
    const allowed = getComposeAllowedKeys(selector);
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
      console.error(
        `[typestyles] Unknown variant "${key}" in styles.compose() — not accepted by any composed style function.`,
      );
    }
  }
}
