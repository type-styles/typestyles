import type {
  TokenValues,
  TokenRef,
  CreatedTokenRef,
  TokenRegistry,
  ThemeConfig,
  ThemeSurface,
  ThemeOverrides,
} from './types';
import { flattenTokenEntries } from './types';
import { scopedTokenNamespace } from './class-naming';
import { insertRule, insertRules } from './sheet';
import { createTheme, createDarkMode, when, colorMode } from './theme';
import type { CascadeLayersInput } from './layers';
import { applyLayerToRules, assertOwnLayer, resolveCascadeLayers } from './layers';

const tokenMetaByRef = new WeakMap<object, { namespace: string }>();

function attachTokenMeta(ref: object, namespace: string): void {
  tokenMetaByRef.set(ref, { namespace });
}

function getTokenNamespace(ref: object): string | undefined {
  return tokenMetaByRef.get(ref)?.namespace;
}

export type CreateTokensOptions = {
  /**
   * Prefix for CSS custom property namespaces and theme class segments so multiple
   * packages on one page do not share `--color-*` or `.theme-*` collisions.
   */
  scopeId?: string;
  /**
   * When set with **`tokenLayer`**, `:root` custom properties and theme surfaces are wrapped in
   * `@layer tokenLayer { … }`, and a matching `@layer …;` order preamble is registered.
   */
  layers?: CascadeLayersInput;
  /**
   * Default `@layer` from **`layers`** for token and theme CSS (`:root`, themes). Required when **`layers`** is set.
   * Override per call: `tokens.create('color', { … }, { layer: '…' })`.
   */
  tokenLayer?: string;
};

/**
 * Design token and theme API bound to an optional `scopeId`.
 */
export type TokensApi<R extends TokenRegistry = Record<string, never>> = {
  /** Same `scopeId` passed to `createTokens`, if any. */
  readonly scopeId: string | undefined;
  create: <T extends TokenValues, N extends string>(
    namespace: N,
    values: T,
    options?: { layer?: string },
  ) => CreatedTokenRef<T, N>;
  use: {
    <T extends TokenValues, N extends string>(ref: CreatedTokenRef<T, N>): TokenRef<T>;
    <N extends keyof R & string>(namespace: N): TokenRef<R[N]>;
    <T extends TokenValues = TokenValues>(namespace: string): TokenRef<T>;
  };
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
export function createTokens<R extends TokenRegistry = Record<string, never>>(
  options: CreateTokensOptions = {},
): TokensApi<R> {
  const scopeId = options.scopeId?.trim() || undefined;

  if (process.env.NODE_ENV !== 'production') {
    if (options.layers && options.tokenLayer == null) {
      throw new Error(
        '[typestyles] `createTokens({ layers })` requires `tokenLayer` — pass the layer name for `:root` and theme CSS.',
      );
    }
    if (!options.layers && options.tokenLayer != null) {
      throw new Error(
        '[typestyles] `tokenLayer` is only valid on `createTokens` when `layers` is also set.',
      );
    }
  } else if (options.layers && options.tokenLayer == null) {
    throw new Error(
      '[typestyles] `createTokens({ layers })` requires `tokenLayer` — pass the layer name for `:root` and theme CSS.',
    );
  }

  const cascadeStack = options.layers ? resolveCascadeLayers(options.layers, scopeId) : undefined;
  const tokenLayer = options.tokenLayer;

  if (cascadeStack && tokenLayer) {
    assertOwnLayer(cascadeStack, tokenLayer, 'tokens.create / createTheme');
  }

  const themeLayerContext =
    cascadeStack && tokenLayer ? { stack: cascadeStack, layer: tokenLayer } : undefined;

  const registeredNamespaces = new Set<string>();
  const createdTokenKeys = new Map<string, Set<string>>();

  function create<T extends TokenValues, N extends string>(
    namespace: N,
    values: T,
    options?: { layer?: string },
  ): CreatedTokenRef<T, N> {
    if (options?.layer != null && !themeLayerContext) {
      throw new Error(
        '[typestyles] `tokens.create(..., { layer })` requires `createTokens({ layers, tokenLayer })`.',
      );
    }

    registeredNamespaces.add(namespace);

    const cssNs = scopedTokenNamespace(scopeId, namespace);
    const flatEntries = flattenTokenEntries(values);
    const declarations = flatEntries
      .map(([key, value]) => `--${cssNs}-${key}: ${value}`)
      .join('; ');

    const css = `:root { ${declarations}; }`;
    if (themeLayerContext) {
      const layer = options?.layer ?? themeLayerContext.layer;
      assertOwnLayer(themeLayerContext.stack, layer, 'tokens.create');
      const key = `tokens:${cssNs}@${layer}`;
      insertRules(applyLayerToRules([{ key, css }], layer, themeLayerContext.stack));
    } else {
      insertRule(`tokens:${cssNs}`, css);
    }

    const allKeys = getAllKeys(values);
    createdTokenKeys.set(namespace, allKeys);

    const ref = createTokenProxy(cssNs, '', allKeys) as CreatedTokenRef<T, N>;
    attachTokenMeta(ref, namespace);
    return ref;
  }

  function use<T extends TokenValues, N extends string>(
    namespaceOrRef: string | CreatedTokenRef<T, N>,
  ): TokenRef<T> {
    const namespace =
      typeof namespaceOrRef === 'string'
        ? namespaceOrRef
        : (getTokenNamespace(namespaceOrRef) ?? '');

    if (
      process.env.NODE_ENV !== 'production' &&
      registeredNamespaces.size > 0 &&
      namespace &&
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
    use: use as TokensApi<R>['use'],
    createTheme: (name, config) => createTheme(name, config, scopeId, themeLayerContext),
    createDarkMode: (name, darkOverrides) =>
      createDarkMode(name, darkOverrides, scopeId, themeLayerContext),
    when,
    colorMode,
  };
}
