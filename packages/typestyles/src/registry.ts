/**
 * Shared registry for detecting duplicate namespace registrations.
 */
export const registeredNamespaces = new Set<string>();

const COLON = ':';

/**
 * Drop reserved `scopeId:namespace` keys so a module can re-register after HMR.
 * `namespace` is the first argument to `styles.component()` / `styles.class()` (not the scope).
 */
export function releaseReservedNamespacesForComponentOrClassNames(
  namespaces: readonly string[],
): void {
  if (namespaces.length === 0) return;
  const wanted = new Set(namespaces);
  const toRemove: string[] = [];
  for (const key of registeredNamespaces) {
    const i = key.indexOf(COLON);
    if (i === -1) continue;
    if (wanted.has(key.slice(i + 1))) {
      toRemove.push(key);
    }
  }
  for (const key of toRemove) {
    registeredNamespaces.delete(key);
  }
}

/** Vite plugin passes `.${namespace}-` prefixes for `styles.component()` invalidation. */
export function namespacesFromTypestylesHmrPrefixes(prefixes: readonly string[]): string[] {
  const out: string[] = [];
  for (const p of prefixes) {
    if (p.length >= 2 && p.startsWith('.') && p.endsWith('-')) {
      out.push(p.slice(1, -1));
    }
  }
  return out;
}
