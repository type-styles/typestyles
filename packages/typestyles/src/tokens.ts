import type {
  TokenValues,
  TokenRef,
  CreatedTokenRef,
  TokenRegistry,
  ThemeConfig,
  ThemeSurface,
  ThemeOverrides,
  TokenDescriptor,
} from './types';
import { flattenTokenEntries, flattenTokenPaths, isTokenDescriptor } from './types';
import { scopedTokenNamespace } from './class-naming';
import {
  buildTokenNameContext,
  createThemeTokenNaming,
  resolveTokenName,
  type TokenNameTemplate,
  type ThemeTokenNaming,
} from './token-naming';
import { insertRule, insertRules } from './sheet';
import { createRegisteredPropertyRef, registerAtPropertyRule } from './registered-property';
import { createTheme, createDarkMode, when, colorMode } from './theme';
import type { CascadeLayersInput } from './layers';
import { applyLayerToRules, assertOwnLayer, resolveCascadeLayers } from './layers';

const tokenMetaByRef = new WeakMap<object, { namespace: string }>();
const tokenLeafValuesByRef = new WeakMap<object, Record<string, string>>();

function attachTokenMeta(ref: object, namespace: string): void {
  tokenMetaByRef.set(ref, { namespace });
}

function attachTokenLeafValues(ref: object, leafValues: Record<string, string>): void {
  tokenLeafValuesByRef.set(ref, leafValues);
}

function getTokenNamespace(ref: object): string | undefined {
  return tokenMetaByRef.get(ref)?.namespace;
}

/**
 * Read scalar leaf values from a `tokens.create()` ref (e.g. media query conditions).
 * Returns literal strings stored at create time, not `var(--…)` references.
 */
export function getTokenLeafValues(
  ref: CreatedTokenRef<TokenValues, string>,
): Record<string, string> {
  return tokenLeafValuesByRef.get(ref) ?? {};
}

export type { TokenNameContext, TokenNameTemplate } from './token-naming';

export type CreateTokensOptions = {
  /**
   * Prefix for CSS custom property namespaces and theme class segments so multiple
   * packages on one page do not share `--color-*` or `.theme-*` collisions.
   */
  scopeId?: string;
  /**
   * Default template for emitted `--*` custom property names. Per-namespace override:
   * `tokens.create('color', values, { nameTemplate })`.
   */
  nameTemplate?: TokenNameTemplate;
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
    options?: { layer?: string; nameTemplate?: TokenNameTemplate },
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

  if (typeof obj === 'string' || typeof obj === 'number') {
    if (prefix) keys.add(prefix);
    return keys;
  }

  if (isTokenDescriptor(obj)) {
    if (prefix) keys.add(prefix);
    return keys;
  }

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}-${key}` : key;

    if (typeof value !== 'object' || value === null) {
      keys.add(fullKey);
    } else if (isTokenDescriptor(value)) {
      keys.add(fullKey);
    } else {
      keys.add(fullKey);
      const nestedKeys = getAllKeys(value as TokenValues, fullKey);
      nestedKeys.forEach((k) => keys.add(k));
    }
  }

  return keys;
}

function collectDescriptorMeta(
  obj: TokenValues,
  prefix = '',
): Map<string, Pick<TokenDescriptor, 'syntax' | 'inherits' | 'initial'> & { value: string }> {
  const meta = new Map<
    string,
    Pick<TokenDescriptor, 'syntax' | 'inherits' | 'initial'> & { value: string }
  >();

  if (obj === null || obj === undefined) return meta;

  if (isTokenDescriptor(obj)) {
    if (prefix) {
      meta.set(prefix, {
        value: String(obj.value),
        syntax: obj.syntax,
        inherits: obj.inherits,
        initial: obj.initial,
      });
    }
    return meta;
  }

  if (typeof obj !== 'object') return meta;

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}-${key}` : key;

    if (isTokenDescriptor(value)) {
      meta.set(fullKey, {
        value: String(value.value),
        syntax: value.syntax,
        inherits: value.inherits,
        initial: value.initial,
      });
    } else if (typeof value === 'object' && value !== null) {
      for (const [path, entry] of collectDescriptorMeta(value as TokenValues, fullKey)) {
        meta.set(path, entry);
      }
    }
  }

  return meta;
}

function createTokenProxy(
  resolvePathName: (path: string) => string,
  prefix: string,
  allKeys: Set<string>,
  descriptorLeaves: Set<string>,
): object {
  const makeToken = (p: string) => `var(${resolvePathName(p)})`;
  const makeLeaf = (p: string) => {
    if (descriptorLeaves.has(p)) {
      return createRegisteredPropertyRef(resolvePathName(p));
    }
    return makeToken(p);
  };

  const handler: ProxyHandler<object> = {
    get(_target, prop: string | symbol): unknown {
      if (typeof prop === 'symbol') {
        return undefined;
      }

      if (prop === 'toString') {
        return () => makeLeaf(prefix);
      }
      if (prop === 'valueOf') {
        return () => makeLeaf(prefix);
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
        return makeLeaf(newPrefix);
      }

      if (allKeys.has(newPrefix)) {
        const hasChildren = [...allKeys].some(
          (k) => k !== newPrefix && k.startsWith(newPrefix + '-'),
        );
        if (hasChildren) {
          return createTokenProxy(resolvePathName, newPrefix, allKeys, descriptorLeaves);
        }
        return makeLeaf(newPrefix);
      }

      if (prefix !== '') {
        return makeLeaf(newPrefix);
      }

      return createTokenProxy(resolvePathName, newPrefix, allKeys, descriptorLeaves);
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
  const createdDescriptorLeaves = new Map<string, Set<string>>();
  const createdTokenTemplates = new Map<string, TokenNameTemplate | undefined>();
  const createdTokenNameByPath = new Map<string, Map<string, string>>();
  const instanceDefaultTemplate = options.nameTemplate;
  let customNamingActive = Boolean(instanceDefaultTemplate);

  const themeTokenNaming: ThemeTokenNaming = createThemeTokenNaming(
    scopeId,
    instanceDefaultTemplate,
    createdTokenTemplates,
    createdTokenNameByPath,
  );

  function buildResolvePathName(
    namespace: string,
    template: TokenNameTemplate | undefined,
    nameByPath: Map<string, string>,
  ): (path: string) => string {
    return (path: string) => {
      const registered = nameByPath.get(path);
      if (registered) return registered;

      const segments = path.includes('-') ? path.split('-') : [path];
      const ctx = buildTokenNameContext(scopeId, namespace, path, segments);
      return resolveTokenName(template, ctx, namespace);
    };
  }

  function create<T extends TokenValues, N extends string>(
    namespace: N,
    values: T,
    options?: { layer?: string; nameTemplate?: TokenNameTemplate },
  ): CreatedTokenRef<T, N> {
    if (options?.layer != null && !themeLayerContext) {
      throw new Error(
        '[typestyles] `tokens.create(..., { layer })` requires `createTokens({ layers, tokenLayer })`.',
      );
    }

    registeredNamespaces.add(namespace);

    const cssNs = scopedTokenNamespace(scopeId, namespace);
    const effectiveTemplate = options?.nameTemplate ?? instanceDefaultTemplate;
    if (effectiveTemplate !== undefined) customNamingActive = true;

    let declarations: string;
    const nameByPath = new Map<string, string>();

    if (effectiveTemplate === undefined) {
      const flatEntries = flattenTokenEntries(values);
      for (const [path] of flatEntries) {
        nameByPath.set(path, `--${cssNs}-${path}`);
      }
      declarations = flatEntries.map(([key, value]) => `--${cssNs}-${key}: ${value}`).join('; ');
    } else {
      const flatEntries = flattenTokenPaths(values);
      const seenNames = new Map<string, string>();

      for (const { path, segments } of flatEntries) {
        const ctx = buildTokenNameContext(scopeId, namespace, path, segments);
        const name = resolveTokenName(effectiveTemplate, ctx, namespace);

        if (process.env.NODE_ENV !== 'production') {
          const priorPath = seenNames.get(name);
          if (priorPath != null && priorPath !== path) {
            throw new Error(
              `[typestyles] tokens.create('${namespace}'): nameTemplate produced duplicate custom property name ` +
                `"${name}" for paths "${priorPath}" and "${path}".`,
            );
          }
          seenNames.set(name, path);
        }

        nameByPath.set(path, name);
      }

      declarations = flatEntries
        .map(({ path, value }) => {
          const propName = nameByPath.get(path);
          if (propName === undefined) {
            throw new Error(
              `[typestyles] tokens.create('${namespace}'): internal error resolving name for "${path}".`,
            );
          }
          return `${propName}: ${value}`;
        })
        .join('; ');
    }

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
    const descriptorMeta = collectDescriptorMeta(values);
    const descriptorLeaves = new Set(descriptorMeta.keys());
    createdTokenKeys.set(namespace, allKeys);
    createdDescriptorLeaves.set(namespace, descriptorLeaves);
    createdTokenTemplates.set(namespace, effectiveTemplate);
    createdTokenNameByPath.set(namespace, nameByPath);

    for (const [path, entry] of descriptorMeta) {
      const propName = nameByPath.get(path);
      if (propName !== undefined && entry.syntax != null) {
        registerAtPropertyRule(propName, {
          value: entry.value,
          syntax: entry.syntax,
          inherits: entry.inherits,
          initial: entry.initial,
        });
      }
    }

    const resolvePathName = buildResolvePathName(namespace, effectiveTemplate, nameByPath);
    const leafValues = Object.fromEntries(
      flattenTokenEntries(values).map(([path, leafValue]) => [path, leafValue]),
    );

    const ref = createTokenProxy(resolvePathName, '', allKeys, descriptorLeaves) as CreatedTokenRef<
      T,
      N
    >;
    attachTokenMeta(ref, namespace);
    attachTokenLeafValues(ref, leafValues);
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

    const allKeys = createdTokenKeys.get(namespace) ?? new Set<string>();
    const descriptorLeaves = createdDescriptorLeaves.get(namespace) ?? new Set<string>();
    const template = createdTokenTemplates.get(namespace) ?? instanceDefaultTemplate;
    const nameByPath = createdTokenNameByPath.get(namespace) ?? new Map<string, string>();
    const resolvePathName = buildResolvePathName(namespace, template, nameByPath);
    return createTokenProxy(resolvePathName, '', allKeys, descriptorLeaves) as TokenRef<T>;
  }

  return {
    scopeId,
    create,
    use: use as TokensApi<R>['use'],
    createTheme: (name, config) =>
      createTheme(
        name,
        config,
        scopeId,
        themeLayerContext,
        customNamingActive ? themeTokenNaming : undefined,
      ),
    createDarkMode: (name, darkOverrides) =>
      createDarkMode(
        name,
        darkOverrides,
        scopeId,
        themeLayerContext,
        customNamingActive ? themeTokenNaming : undefined,
      ),
    when,
    colorMode,
  };
}
