import type { TokenValues, TokenRef, ThemeConfig, ThemeSurface, ThemeOverrides } from './types.js';
import { flattenTokenEntries } from './types.js';
import { scopedTokenNamespace } from './class-naming.js';
import { insertRule } from './sheet.js';
import { createTheme, createDarkMode, when, colorMode } from './theme.js';

export type CreateTokensOptions = {
  /**
   * Prefix for CSS custom property namespaces and theme class segments so multiple
   * packages on one page do not share `--color-*` or `.theme-*` collisions.
   */
  scopeId?: string;
};

/**
 * Design token and theme API bound to an optional `scopeId`.
 */
export type TokensApi = {
  /** Same `scopeId` passed to `createTokens`, if any. */
  readonly scopeId: string | undefined;
  create: <T extends TokenValues>(namespace: string, values: T) => TokenRef<T>;
  use: <T extends TokenValues = TokenValues>(namespace: string) => TokenRef<T>;
  createTheme: (name: string, config: ThemeConfig) => ThemeSurface;
  createDarkMode: (name: string, darkOverrides: ThemeOverrides) => ThemeSurface;
  when: typeof when;
  colorMode: typeof colorMode;
};

/**
 * Registry tracking which token namespaces have been created per instance,
 * so `use()` can provide warnings in development.
 */
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
 * Create a tokens + theme API for a package or app. Each instance keeps its own
 * namespace registry; with `scopeId`, emitted custom properties and theme classes
 * are prefixed so they do not collide with other bundles on the same page.
 *
 * @example
 * ```ts
 * const tokens = createTokens({ scopeId: 'design-system' });
 * const color = tokens.create('color', { primary: '#0066ff' });
 * color.primary // var(--design-system-color-primary)
 * ```
 */
export function createTokens(options: CreateTokensOptions = {}): TokensApi {
  const scopeId = options.scopeId?.trim() || undefined;

  const registeredNamespaces = new Set<string>();
  const createdTokenKeys = new Map<string, Set<string>>();

  function create<T extends TokenValues>(namespace: string, values: T): TokenRef<T> {
    registeredNamespaces.add(namespace);

    const cssNs = scopedTokenNamespace(scopeId, namespace);
    const flatEntries = flattenTokenEntries(values);
    const declarations = flatEntries
      .map(([key, value]) => `--${cssNs}-${key}: ${value}`)
      .join('; ');

    const css = `:root { ${declarations}; }`;
    insertRule(`tokens:${cssNs}`, css);

    const allKeys = getAllKeys(values);
    createdTokenKeys.set(namespace, allKeys);

    return createTokenProxy(cssNs, '', allKeys) as TokenRef<T>;
  }

  function use<T extends TokenValues = TokenValues>(namespace: string): TokenRef<T> {
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

    const cssNs = scopedTokenNamespace(scopeId, namespace);
    const allKeys = createdTokenKeys.get(namespace) ?? new Set<string>();
    return createTokenProxy(cssNs, '', allKeys) as TokenRef<T>;
  }

  return {
    scopeId,
    create,
    use,
    createTheme: (name, config) => createTheme(name, config, scopeId),
    createDarkMode: (name, darkOverrides) => createDarkMode(name, darkOverrides, scopeId),
    when,
    colorMode,
  };
}
