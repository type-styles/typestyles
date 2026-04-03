import type { TokenValues, TokenRef, ThemeOverrides } from './types.js';
import { flattenTokenEntries } from './types.js';
import { insertRule } from './sheet.js';

/**
 * Registry tracking which token namespaces have been created,
 * so tokens.use() can provide warnings in development.
 */
const registeredNamespaces = new Set<string>();
const createdTokenKeys = new Map<string, Set<string>>();

function getAllKeys(obj: TokenValues, prefix = ''): Set<string> {
  const keys = new Set<string>();

  if (obj === null || obj === undefined) return keys;

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}-${key}` : key;

    if (typeof value !== 'object' || value === null) {
      keys.add(fullKey);
    } else {
      keys.add(fullKey);
      const nestedKeys = getAllKeys(value as TokenValues, fullKey);
      nestedKeys.forEach((k) => keys.add(k));
    }
  }

  return keys;
}

function createTokenProxy(namespace: string, prefix: string, allKeys: Set<string>): object {
  const makeToken = (p: string) => `var(--${namespace}-${p})`;

  const handler: ProxyHandler<object> = {
    get(_target, prop: string | symbol): unknown {
      if (typeof prop === 'symbol') {
        return undefined;
      }

      if (prop === 'toString') {
        return () => makeToken(prefix);
      }
      if (prop === 'valueOf') {
        return () => makeToken(prefix);
      }
      if (prop === 'constructor') {
        return Object;
      }
      if (prop === '__esModule') {
        return false;
      }
      if (prop === 'length') {
        return 0;
      }

      const newPrefix = prefix ? `${prefix}-${prop}` : prop;

      if (allKeys.size === 0) {
        return makeToken(newPrefix);
      }

      if (allKeys.has(newPrefix)) {
        const hasChildren = [...allKeys].some(
          (k) => k !== newPrefix && k.startsWith(newPrefix + '-'),
        );
        if (hasChildren) {
          return createTokenProxy(namespace, newPrefix, allKeys);
        }
        return makeToken(newPrefix);
      }

      if (prefix !== '') {
        return makeToken(newPrefix);
      }

      return createTokenProxy(namespace, newPrefix, allKeys);
    },
    has(_target, _prop) {
      return true;
    },
    set(_target, _prop, _value) {
      return false;
    },
  };

  return new Proxy({}, handler);
}

/**
 * Create design tokens as CSS custom properties.
 *
 * Generates a :root rule with the custom properties and returns
 * a typed object where property access yields var() references.
 * Supports nested structures for hierarchical token organization.
 *
 * @example
 * ```ts
 * const color = tokens.create('color', {
 *   text: { primary: '#111827', secondary: '#6b7280' },
 *   background: { surface: '#ffffff', subtle: '#f9fafb' },
 * });
 *
 * color.text.primary  // "var(--color-text-primary)"
 * color.background.surface  // "var(--color-background-surface)"
 * ```
 */
export function createTokens<T extends TokenValues>(namespace: string, values: T): TokenRef<T> {
  registeredNamespaces.add(namespace);

  const flatEntries = flattenTokenEntries(values);
  const declarations = flatEntries
    .map(([key, value]) => `--${namespace}-${key}: ${value}`)
    .join('; ');

  const css = `:root { ${declarations}; }`;
  insertRule(`tokens:${namespace}`, css);

  const allKeys = getAllKeys(values);
  createdTokenKeys.set(namespace, allKeys);

  return createTokenProxy(namespace, '', allKeys) as TokenRef<T>;
}

/**
 * Reference tokens defined elsewhere without injecting CSS.
 *
 * Returns a typed proxy that produces var() references.
 * Useful for consuming shared tokens from a different module.
 *
 * @example
 * ```ts
 * const color = useTokens('color');
 * color.primary  // "var(--color-primary)"
 * ```
 */
export function useTokens<T extends TokenValues = TokenValues>(namespace: string): TokenRef<T> {
  if (
    process.env.NODE_ENV !== 'production' &&
    registeredNamespaces.size > 0 &&
    !registeredNamespaces.has(namespace)
  ) {
    console.warn(
      `[typestyles] tokens.use('${namespace}') references a namespace that hasn't been created yet. ` +
        `Make sure tokens.create('${namespace}', ...) is called before using these tokens.`,
    );
  }

  const allKeys = createdTokenKeys.get(namespace) ?? new Set<string>();
  return createTokenProxy(namespace, '', allKeys) as TokenRef<T>;
}

/**
 * Create a theme class that overrides token values.
 *
 * Returns a class name string. Apply it to any element to override
 * token values for that subtree via CSS custom property cascading.
 * Supports nested structures that mirror the token organization.
 *
 * @example
 * ```ts
 * const dark = createTheme('dark', {
 *   color: {
 *     text: { primary: '#e0e0e0', secondary: '#a1a1aa' },
 *     background: { surface: '#1a1a2e', subtle: '#262640' },
 *   },
 * });
 *
 * <div className={dark}>  // class="theme-dark"
 * ```
 */
export function createTheme(name: string, overrides: ThemeOverrides): string {
  const className = `theme-${name}`;

  const declarations: string[] = [];

  for (const [namespace, values] of Object.entries(overrides)) {
    if (values === null || values === undefined) continue;

    const flatEntries = flattenTokenEntries(values);
    for (const [key, value] of flatEntries) {
      declarations.push(`--${namespace}-${key}: ${value}`);
    }
  }

  const css = `.${className} { ${declarations.join('; ')}; }`;
  insertRule(`theme:${name}`, css);

  return className;
}
