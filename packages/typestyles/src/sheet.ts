import {
  namespacesFromTypestylesHmrPrefixes,
  registeredNamespaces,
  releaseReservedNamespacesForComponentOrClassNames,
  resetEmittedClassNameTracking,
} from './registry';
import { getSheetState, getGlobalSheetState, resetSheetState } from './sheet-context';

/** Stable id for the managed `<style>` element (SSR, hydration, and client runtime). */
export const TYPESTYLES_STYLE_ID = 'typestyles';

const STYLE_ELEMENT_ID = TYPESTYLES_STYLE_ID;

function duplicateRuleKeyConflictWarningsEnabled(): boolean {
  if (typeof process === 'undefined') return true;
  return process.env.NODE_ENV !== 'production';
}

/**
 * When the same key is registered again with different CSS, the second rule is skipped
 * (idempotency / HMR). In non-production builds, surface that so overlapping globals
 * (e.g. reset `body` + app `body` in the same scope) are not silent failures.
 */
function warnIfDuplicateRuleKeyConflict(
  key: string,
  previousCss: string,
  ignoredCss: string,
): void {
  if (!duplicateRuleKeyConflictWarningsEnabled()) return;
  const prevShort = previousCss.length > 220 ? `${previousCss.slice(0, 220)}…` : previousCss;
  const nextShort = ignoredCss.length > 220 ? `${ignoredCss.slice(0, 220)}…` : ignoredCss;
  console.warn(
    `[typestyles] Skipped a rule: dedupe key "${key}" already exists with different CSS. ` +
      `Only the first registration is kept. For globals, merge into one \`global.style\`, ` +
      `or use a distinct selector (e.g. \`html body\` after reset’s \`body\`).\n` +
      `  Existing: ${prevShort}\n` +
      `  Skipped:  ${nextShort}`,
  );
}

/**
 * Whether runtime DOM insertion is disabled (for build-time/zero-runtime mode).
 * The Vite plugin (mode: 'build') defines __TYPESTYLES_RUNTIME_DISABLED__ as the
 * string "true" at build time, so this is true in production and no <style> is created.
 *
 * `@typestyles/next/build` `withTypestylesExtract` sets `NEXT_PUBLIC_TYPESTYLES_RUNTIME_DISABLED`
 * via `next.config` `env` so Turbopack and webpack both inline the flag (DefinePlugin
 * alone does not run under Turbopack).
 */
declare const __TYPESTYLES_RUNTIME_DISABLED__: string | undefined;
function readNextPublicRuntimeDisabled(): boolean {
  if (typeof process === 'undefined' || !process.env) return false;
  return process.env.NEXT_PUBLIC_TYPESTYLES_RUNTIME_DISABLED === 'true';
}
const RUNTIME_DISABLED =
  (typeof __TYPESTYLES_RUNTIME_DISABLED__ !== 'undefined' &&
    __TYPESTYLES_RUNTIME_DISABLED__ === 'true') ||
  readNextPublicRuntimeDisabled();

/**
 * The managed <style> element, lazily created.
 */
let styleElement: HTMLStyleElement | null = null;

/**
 * Whether we're running in a browser environment.
 */
const isBrowser = typeof document !== 'undefined' && typeof window !== 'undefined';

/**
 * Re-insert every registered rule into a (usually fresh) <style> element.
 * Used when the live element was detached (e.g. Astro view transitions replacing <head>).
 */
function writeAllRulesToStyleElement(el: HTMLStyleElement): void {
  const { allRules } = getSheetState();
  if (RUNTIME_DISABLED || allRules.length === 0) return;
  const sheet = el.sheet;
  if (sheet) {
    for (const css of allRules) {
      try {
        sheet.insertRule(css, sheet.cssRules.length);
      } catch {
        el.appendChild(document.createTextNode(css));
      }
    }
  } else {
    el.appendChild(document.createTextNode(allRules.join('\n')));
  }
}

function getStyleElement(): HTMLStyleElement {
  let reconnectAfterDetach = false;
  if (styleElement && !styleElement.isConnected) {
    reconnectAfterDetach = true;
    styleElement = null;
  }
  if (styleElement) return styleElement;

  // Prefer an element actually in the document (SSR or another copy on the page).
  const existing = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (existing?.isConnected) {
    styleElement = existing;
    return styleElement;
  }

  styleElement = document.createElement('style');
  styleElement.id = STYLE_ELEMENT_ID;
  document.head.appendChild(styleElement);

  // After a doc swap, we have a new empty sheet but insertRule() won't re-queue (deduped keys).
  if (reconnectAfterDetach && getSheetState().allRules.length > 0) {
    writeAllRulesToStyleElement(styleElement);
  }

  return styleElement;
}

/**
 * Ensure the managed <style id="typestyles"> is attached to the current document and populated.
 * Call after SPA-style navigation (e.g. Astro `astro:after-swap`) when runtime injection is enabled.
 */
export function ensureDocumentStylesAttached(): void {
  if (!isBrowser || RUNTIME_DISABLED) return;
  getStyleElement();
}

function flush(): void {
  const state = getSheetState();
  state.flushScheduled = false;
  if (state.pendingRules.length === 0) return;

  const rules = state.pendingRules;
  state.pendingRules = [];

  if (state.ssrBuffer) {
    state.ssrBuffer.push(...rules);
    return;
  }

  if (!isBrowser || RUNTIME_DISABLED) return;

  const el = getStyleElement();
  const sheet = el.sheet;

  if (sheet) {
    for (const rule of rules) {
      try {
        sheet.insertRule(rule, sheet.cssRules.length);
      } catch {
        // Fallback: append as text (handles edge cases with certain selectors)
        el.appendChild(document.createTextNode(rule));
      }
    }
  } else {
    // Sheet not available yet, append as text
    el.appendChild(document.createTextNode(rules.join('\n')));
  }
}

function scheduleFlush(): void {
  const state = getSheetState();
  if (state.flushScheduled) return;
  state.flushScheduled = true;

  if (state.ssrBuffer) {
    // In SSR mode, flush synchronously
    flush();
    return;
  }

  if (isBrowser && !RUNTIME_DISABLED) {
    // Use microtask for fast, batched insertion
    queueMicrotask(flush);
  }
}

/**
 * Register a single `@layer a, b, c;` preamble so layer **order** is defined before any
 * `@layer name { … }` blocks. Inserts at the front of the virtual sheet and at CSSOM index 0
 * when injecting into the document.
 */
export function registerCascadeLayerOrder(preambleKey: string, css: string): void {
  const state = getSheetState();
  const key = `typestyles:@layer-order:${preambleKey}`;
  if (state.insertedRules.has(key)) return;
  state.insertedRules.add(key);

  state.allRules.unshift(css);
  notifyRegisteredCssChanged();

  if (state.ssrBuffer) {
    state.ssrBuffer.unshift(css);
    return;
  }

  if (RUNTIME_DISABLED) return;

  if (!isBrowser) return;

  const el = getStyleElement();
  const sheet = el.sheet;
  if (sheet) {
    try {
      sheet.insertRule(css, 0);
    } catch {
      el.insertBefore(document.createTextNode(`${css}\n`), el.firstChild);
    }
  } else {
    el.insertBefore(document.createTextNode(`${css}\n`), el.firstChild);
  }
}

/**
 * Insert a CSS rule. Deduplicates by rule key.
 */
export function insertRule(key: string, css: string): void {
  const state = getSheetState();
  if (state.insertedRules.has(key)) {
    const prev = state.ruleCssByKey.get(key);
    if (prev != null && prev !== css) {
      warnIfDuplicateRuleKeyConflict(key, prev, css);
    }
    return;
  }
  state.insertedRules.add(key);
  state.ruleCssByKey.set(key, css);
  state.allRules.push(css);
  notifyRegisteredCssChanged();
  if (RUNTIME_DISABLED && !state.ssrBuffer) return;
  state.pendingRules.push(css);
  scheduleFlush();
}

/**
 * Insert multiple CSS rules at once.
 */
export function insertRules(rules: Array<{ key: string; css: string }>): void {
  const state = getSheetState();
  let added = false;
  let registered = false;
  for (const { key, css } of rules) {
    if (state.insertedRules.has(key)) {
      const prev = state.ruleCssByKey.get(key);
      if (prev != null && prev !== css) {
        warnIfDuplicateRuleKeyConflict(key, prev, css);
      }
      continue;
    }
    state.insertedRules.add(key);
    state.ruleCssByKey.set(key, css);
    state.allRules.push(css);
    registered = true;
    if (!RUNTIME_DISABLED || state.ssrBuffer) {
      state.pendingRules.push(css);
      added = true;
    }
  }
  if (registered) notifyRegisteredCssChanged();
  if (added) scheduleFlush();
}

/**
 * Replace a CSS rule (used for HMR). Removes the old rule and inserts the new one.
 */
export function replaceRule(key: string, css: string): void {
  if (!isBrowser || RUNTIME_DISABLED) return;

  const state = getSheetState();
  state.insertedRules.delete(key);
  state.ruleCssByKey.delete(key);

  // Remove existing rule from the sheet if possible
  const el = getStyleElement();
  const sheet = el.sheet;
  if (sheet) {
    for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
      // We can't reliably match by key in CSSOM, so for HMR we fall back to
      // clearing and re-inserting. This is fine since HMR is dev-only.
    }
  }

  insertRule(key, css);
}

/**
 * Start collecting CSS for SSR. Returns a function to stop collection and get the CSS.
 */
export function startCollection(): () => string {
  const state = getSheetState();
  state.ssrBuffer = [];
  return () => {
    const css = state.ssrBuffer ? state.ssrBuffer.join('\n') : '';
    state.ssrBuffer = null;
    return css;
  };
}

/**
 * Return all registered CSS as a string.
 *
 * Unlike `collectStyles`, this doesn't require wrapping a render function.
 * It simply returns every CSS rule that has been registered via
 * `styles.component`, `styles.class`, `tokens.create`, `keyframes.create`, etc.
 *
 * Ideal for SSR frameworks that need the CSS separately from the render
 * pass (e.g. TanStack Start's `head()`, Next.js metadata, Remix links).
 *
 * @example
 * ```ts
 * import { getRegisteredCss } from 'typestyles/server';
 *
 * // In a route's head/meta function:
 * export const head = () => ({
 *   styles: [{ id: 'typestyles', children: getRegisteredCss() }],
 * });
 * ```
 */
export function getRegisteredCss(): string {
  return getSheetState().allRules.join('\n');
}

const registeredCssListeners = new Set<() => void>();

function notifyRegisteredCssChanged(): void {
  for (const listener of registeredCssListeners) {
    listener();
  }
}

/**
 * Subscribe to changes in the registered CSS (`getRegisteredCss()`).
 * Returns an unsubscribe function. Compatible with `useSyncExternalStore`.
 *
 * @example
 * ```ts
 * import { subscribeRegisteredCss, getRegisteredCss } from 'typestyles/server';
 *
 * const css = useSyncExternalStore(subscribeRegisteredCss, getRegisteredCss, getRegisteredCss);
 * ```
 */
export function subscribeRegisteredCss(listener: () => void): () => void {
  registeredCssListeners.add(listener);
  return () => {
    registeredCssListeners.delete(listener);
  };
}

/**
 * Reset all state (useful for testing).
 */
export function reset(): void {
  resetSheetState(getGlobalSheetState());
  const active = getSheetState();
  if (active !== getGlobalSheetState()) {
    resetSheetState(active);
  }
  registeredNamespaces.clear();
  resetEmittedClassNameTracking();
  notifyRegisteredCssChanged();
  if (isBrowser && styleElement) {
    styleElement.remove();
    styleElement = null;
  }
}

/**
 * Flush all pending rules synchronously. Used for SSR and testing.
 */
export function flushSync(): void {
  flush();
}

/**
 * Invalidate all dedup keys that start with the given prefix.
 * Also removes matching rules from the live stylesheet.
 * Used for HMR — allows modules to re-register their styles after editing.
 */
export function invalidatePrefix(prefix: string): void {
  const state = getSheetState();
  for (const key of state.insertedRules) {
    if (key.startsWith(prefix)) {
      state.insertedRules.delete(key);
      state.ruleCssByKey.delete(key);
    }
  }

  releaseReservedNamespacesForComponentOrClassNames(namespacesFromTypestylesHmrPrefixes([prefix]));

  if (!isBrowser) return;

  const el = styleElement;
  if (!el) return;
  const sheet = el.sheet;
  if (!sheet) return;

  for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
    const rule = sheet.cssRules[i];
    if (ruleMatchesPrefix(rule, prefix)) {
      sheet.deleteRule(i);
    }
  }
}

/**
 * Invalidate a list of exact keys or prefixes.
 * Each entry in `keys` is treated as an exact key match.
 * Each entry in `prefixes` is treated as a prefix match.
 * Used for HMR to invalidate all styles from a module at once.
 */
export function invalidateKeys(keys: string[], prefixes: string[]): void {
  const state = getSheetState();
  for (const key of keys) {
    state.insertedRules.delete(key);
    state.ruleCssByKey.delete(key);
  }
  for (const prefix of prefixes) {
    for (const key of state.insertedRules) {
      if (key.startsWith(prefix)) {
        state.insertedRules.delete(key);
        state.ruleCssByKey.delete(key);
      }
    }
  }

  releaseReservedNamespacesForComponentOrClassNames(namespacesFromTypestylesHmrPrefixes(prefixes));

  if (!isBrowser) return;

  const el = styleElement;
  if (!el) return;
  const sheet = el.sheet;
  if (!sheet) return;

  const keySet = new Set(keys);
  for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
    const rule = sheet.cssRules[i];
    let shouldRemove = false;

    for (const prefix of prefixes) {
      if (ruleMatchesPrefix(rule, prefix)) {
        shouldRemove = true;
        break;
      }
    }

    if (!shouldRemove) {
      // Check exact key matches — for tokens/themes/keyframes,
      // we match based on rule content patterns
      const ruleText = rule.cssText;
      for (const key of keySet) {
        if (ruleMatchesKey(ruleText, key)) {
          shouldRemove = true;
          break;
        }
      }
    }

    if (shouldRemove) {
      sheet.deleteRule(i);
    }
  }
}

/**
 * Drop every rule key tied to a `styles.component('namespace', …)` registration, including
 * `@layer`-wrapped keys (`layer:….:.namespace-…`), and release reserved namespace entries.
 * Used for Vite HMR and for dev recovery when a module re-runs before `hot.dispose`.
 */
export function invalidateComponentNamespaceForDev(
  namespace: string,
  emittedClassPrefix?: string,
): void {
  const selectorInfix = `.${emittedClassPrefix ?? `${namespace}-`}`;
  const state = getSheetState();
  const keysToDrop: string[] = [];
  for (const k of state.insertedRules) {
    if (k.includes(selectorInfix)) {
      keysToDrop.push(k);
    }
  }
  invalidateKeys(keysToDrop, [selectorInfix]);
}

function ruleMatchesPrefix(rule: CSSRule, prefix: string): boolean {
  if (prefix.startsWith('font-face:')) {
    const family = prefix.slice('font-face:'.length).split(':')[0];
    // CSSFontFaceRule has type 5 and cssText contains @font-face
    if (rule.cssText.includes('@font-face')) {
      return rule.cssText.includes(`"${family}"`) || rule.cssText.includes(`'${family}'`);
    }
    return false;
  }
  if ('selectorText' in rule) {
    return (rule as CSSStyleRule).selectorText.startsWith(prefix);
  }
  if ('name' in rule && prefix.startsWith('keyframes:')) {
    return (rule as CSSKeyframesRule).name === prefix.slice('keyframes:'.length);
  }
  // For at-rules wrapping style rules, check inner rules
  if ('cssRules' in rule) {
    const innerRules = (rule as CSSGroupingRule).cssRules;
    for (let i = 0; i < innerRules.length; i++) {
      if (ruleMatchesPrefix(innerRules[i], prefix)) return true;
    }
  }
  return false;
}

function ruleMatchesKey(cssText: string, key: string): boolean {
  if (key.startsWith('tokens:')) {
    // tokens:color or tokens:color@layerName -> :root rule with --color- custom properties
    const rest = key.slice('tokens:'.length);
    const at = rest.lastIndexOf('@');
    const namespace = at === -1 ? rest : rest.slice(0, at);
    return cssText.includes(`:root`) && cssText.includes(`--${namespace}-`);
  }
  if (key.startsWith('theme:')) {
    // theme:dark -> .theme-dark selector
    const name = key.slice('theme:'.length);
    return cssText.includes(`.theme-${name}`);
  }
  if (key.startsWith('keyframes:')) {
    const name = key.slice('keyframes:'.length);
    return cssText.includes(`@keyframes ${name}`);
  }
  return false;
}
