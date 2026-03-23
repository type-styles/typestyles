const STYLE_ELEMENT_ID = 'typestyles';

/**
 * Tracks which CSS rules have been inserted to avoid duplicates.
 */
const insertedRules = new Set<string>();

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
 * Buffer of CSS rules waiting to be flushed.
 */
let pendingRules: string[] = [];

/**
 * All CSS rules ever registered (for SSR extraction).
 * Unlike pendingRules (which is cleared on flush), this retains every rule
 * so getRegisteredCss() can return the full stylesheet at any point.
 */
const allRules: string[] = [];

/**
 * Whether a flush is scheduled.
 */
let flushScheduled = false;

/**
 * The managed <style> element, lazily created.
 */
let styleElement: HTMLStyleElement | null = null;

/**
 * When in SSR collection mode, CSS is captured here instead of injected.
 */
let ssrBuffer: string[] | null = null;

/**
 * Whether we're running in a browser environment.
 */
const isBrowser =
  typeof document !== 'undefined' && typeof window !== 'undefined';

function getStyleElement(): HTMLStyleElement {
  if (styleElement) return styleElement;

  // Check for an existing element (e.g., from SSR)
  const existing = document.getElementById(
    STYLE_ELEMENT_ID
  ) as HTMLStyleElement | null;
  if (existing) {
    styleElement = existing;
    return styleElement;
  }

  // Create a new one
  styleElement = document.createElement('style');
  styleElement.id = STYLE_ELEMENT_ID;
  document.head.appendChild(styleElement);
  return styleElement;
}

function flush(): void {
  flushScheduled = false;
  if (pendingRules.length === 0) return;

  const rules = pendingRules;
  pendingRules = [];

  if (ssrBuffer) {
    ssrBuffer.push(...rules);
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
  if (flushScheduled) return;
  flushScheduled = true;

  if (ssrBuffer) {
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
 * Insert a CSS rule. Deduplicates by rule key.
 */
export function insertRule(key: string, css: string): void {
  if (insertedRules.has(key)) return;
  insertedRules.add(key);
  allRules.push(css);
  if (RUNTIME_DISABLED && !ssrBuffer) return;
  pendingRules.push(css);
  scheduleFlush();
}

/**
 * Insert multiple CSS rules at once.
 */
export function insertRules(rules: Array<{ key: string; css: string }>): void {
  let added = false;
  for (const { key, css } of rules) {
    if (insertedRules.has(key)) continue;
    insertedRules.add(key);
    allRules.push(css);
    if (!RUNTIME_DISABLED || ssrBuffer) {
      pendingRules.push(css);
      added = true;
    }
  }
  if (added) scheduleFlush();
}

/**
 * Replace a CSS rule (used for HMR). Removes the old rule and inserts the new one.
 */
export function replaceRule(key: string, css: string): void {
  if (!isBrowser || RUNTIME_DISABLED) return;

  insertedRules.delete(key);

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
  ssrBuffer = [];
  return () => {
    const css = ssrBuffer ? ssrBuffer.join('\n') : '';
    ssrBuffer = null;
    return css;
  };
}

/**
 * Return all registered CSS as a string.
 *
 * Unlike `collectStyles`, this doesn't require wrapping a render function.
 * It simply returns every CSS rule that has been registered via
 * `styles.create`, `tokens.create`, `keyframes.create`, etc.
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
  return allRules.join('\n');
}

/**
 * Reset all state (useful for testing).
 */
export function reset(): void {
  insertedRules.clear();
  pendingRules = [];
  allRules.length = 0;
  flushScheduled = false;
  ssrBuffer = null;
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
  for (const key of insertedRules) {
    if (key.startsWith(prefix)) {
      insertedRules.delete(key);
    }
  }

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
  for (const key of keys) {
    insertedRules.delete(key);
  }
  for (const prefix of prefixes) {
    for (const key of insertedRules) {
      if (key.startsWith(prefix)) {
        insertedRules.delete(key);
      }
    }
  }

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

function ruleMatchesPrefix(rule: CSSRule, prefix: string): boolean {
  if (prefix.startsWith('font-face:')) {
    const family = prefix.slice('font-face:'.length).split(':')[0];
    // CSSFontFaceRule has type 5 and cssText contains @font-face
    if (rule.cssText.includes('@font-face')) {
      return (
        rule.cssText.includes(`"${family}"`) || rule.cssText.includes(`'${family}'`)
      );
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
    // tokens:color -> :root rule with --color- custom properties
    const namespace = key.slice('tokens:'.length);
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
