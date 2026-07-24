import type {
  TokenValues,
  TokenRef,
  CreatedTokenRef,
  TokenRegistry,
  ThemeConfig,
  ThemeSurface,
  ThemeOverrides,
  TokenSchema,
  DeclaredTokenRef,
  CreateTokenValues,
  InferValuesFromSchema,
  TokenSchemaLeaf,
} from './types';
import { flattenTokenEntries, flattenTokenPaths, isTokenDescriptor } from './types';
import {
  flattenTokenSchema,
  getSchemaSyntaxLeaves,
  mergeTokenTrees,
  tokenSchemaLeavesEqual,
} from './token-schema';
import { scopedTokenNamespace } from './class-naming';
import {
  buildTokenNameContext,
  createThemeTokenNaming,
  resolveTokenName,
  type TokenNameTemplate,
  type ThemeTokenNaming,
} from './token-naming';
import { insertRule, insertRules, invalidateKeys } from './sheet';
import { createRegisteredPropertyRef, registerAtPropertySchema } from './registered-property';
import { createTheme, createDarkMode, when, colorMode } from './theme';
import type { CascadeLayersInput } from './layers';
import { applyLayerToRules, assertOwnLayer, resolveCascadeLayers } from './layers';

const tokenMetaByRef = new WeakMap<object, { namespace: string }>();
const tokenLeafValuesByRef = new WeakMap<object, Record<string, string>>();
const declaredMetaByRef = new WeakMap<object, { namespace: string; schema: TokenSchema }>();

function attachTokenMeta(ref: object, namespace: string): void {
  tokenMetaByRef.set(ref, { namespace });
}

function attachDeclaredMeta(ref: object, meta: { namespace: string; schema: TokenSchema }): void {
  declaredMetaByRef.set(ref, meta);
}

export function getDeclaredNamespace(ref: object): string | undefined {
  return declaredMetaByRef.get(ref)?.namespace;
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
  create: {
    <TSchema extends TokenSchema, N extends string>(
      namespace: N,
      values: InferValuesFromSchema<TSchema>,
      options: {
        decl: DeclaredTokenRef<TSchema, N>;
        layer?: string;
        nameTemplate?: TokenNameTemplate;
      },
    ): CreatedTokenRef<TokenValues, N>;
    <T extends CreateTokenValues, N extends string>(
      namespace: N,
      values: T,
      options?: { layer?: string; nameTemplate?: TokenNameTemplate },
    ): CreatedTokenRef<T, N>;
  };
  use: {
    <T extends TokenValues, N extends string>(ref: CreatedTokenRef<T, N>): TokenRef<T>;
    <N extends keyof R & string>(namespace: N): TokenRef<R[N]>;
    <T extends TokenValues = TokenValues>(namespace: string): TokenRef<T>;
  };
  /**
   * Declares a namespace schema, emits `@property` for `syntax` leaves, and returns a
   * typed reference proxy usable before `tokens.create()`.
   */
  declare: <TSchema extends TokenSchema, N extends string>(
    namespace: N,
    schema: TSchema,
    options?: { nameTemplate?: TokenNameTemplate },
  ) => DeclaredTokenRef<TSchema, N>;
  createTheme: (name: string, config: ThemeConfig) => ThemeSurface;
  createDarkMode: (name: string, darkOverrides: ThemeOverrides) => ThemeSurface;
  when: typeof when;
  colorMode: typeof colorMode;
};

/**
 * Registry tracking which token namespaces have been created per instance,
 * so `use()` can provide warnings in development.
 */
function mergeCreateValues(
  base: CreateTokenValues | undefined,
  chunk: CreateTokenValues,
): CreateTokenValues {
  if (base === undefined) return chunk;
  if (typeof base === 'string' || typeof base === 'number') return chunk;
  if (typeof chunk === 'string' || typeof chunk === 'number') return chunk;
  return mergeTokenTrees(
    base as Record<string, unknown>,
    chunk as Record<string, unknown>,
  ) as CreateTokenValues;
}

function collectAllKeysFromValues(values: CreateTokenValues, prefix = ''): Set<string> {
  const keys = new Set<string>();
  if (typeof values === 'string' || typeof values === 'number') {
    if (prefix) keys.add(prefix);
    return keys;
  }
  for (const [key, value] of Object.entries(values)) {
    const fullKey = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'string' || typeof value === 'number') {
      keys.add(fullKey);
    } else if (value !== null && typeof value === 'object') {
      keys.add(fullKey);
      for (const nested of collectAllKeysFromValues(value as CreateTokenValues, fullKey)) {
        keys.add(nested);
      }
    }
  }
  return keys;
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
 * Builds a proxy for `tokens.declare()`: continues path accumulation at any depth;
 * `toString`/`valueOf` resolve syntax leaves to {@link RegisteredPropertyRef}.
 */
function createDeclaredTokenProxy(
  resolvePathName: (path: string) => string,
  prefix: string,
  syntaxLeaves: Set<string>,
): object {
  const leafString = (p: string) => {
    if (syntaxLeaves.has(p)) {
      return String(createRegisteredPropertyRef(resolvePathName(p)));
    }
    return `var(${resolvePathName(p)})`;
  };

  const handler: ProxyHandler<object> = {
    get(_target, prop: string | symbol): unknown {
      if (typeof prop === 'symbol') {
        return undefined;
      }
      if (prop === 'toString' || prop === 'valueOf') {
        return () => leafString(prefix);
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
      if (syntaxLeaves.has(newPrefix)) {
        return createRegisteredPropertyRef(resolvePathName(newPrefix));
      }
      return createDeclaredTokenProxy(resolvePathName, newPrefix, syntaxLeaves);
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
  /** `nameTemplate` recorded by `tokens.declare()`, checked for agreement when `create()` later runs. */
  const declaredNamespaceTemplates = new Map<string, TokenNameTemplate | undefined>();
  const namespaceSchemas = new Map<string, TokenSchema>();
  const declaredSchemaLeaves = new Map<string, Map<string, TokenSchemaLeaf>>();
  const namespaceValueTrees = new Map<string, CreateTokenValues>();
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

  function create<T extends CreateTokenValues, N extends string>(
    namespace: N,
    values: T,
    options?: {
      layer?: string;
      nameTemplate?: TokenNameTemplate;
      decl?: DeclaredTokenRef<TokenSchema, N>;
    },
  ): CreatedTokenRef<T, N> {
    if (options?.layer != null && !themeLayerContext) {
      throw new Error(
        '[typestyles] `tokens.create(..., { layer })` requires `createTokens({ layers, tokenLayer })`.',
      );
    }

    if (process.env.NODE_ENV !== 'production' && options?.decl) {
      const declNamespace = getDeclaredNamespace(options.decl);
      if (declNamespace !== namespace) {
        throw new Error(
          `[typestyles] tokens.create('${namespace}', ...) was passed a decl handle for ` +
            `'${declNamespace}' — namespace strings must match.`,
        );
      }
    }

    const hasDeclared = declaredNamespaceTemplates.has(namespace);
    const declaredTemplate = declaredNamespaceTemplates.get(namespace);
    if (
      process.env.NODE_ENV !== 'production' &&
      hasDeclared &&
      options?.nameTemplate !== undefined &&
      options.nameTemplate !== declaredTemplate
    ) {
      throw new Error(
        `[typestyles] tokens.create('${namespace}', ...) was called with a different nameTemplate than ` +
          `tokens.declare('${namespace}', ...) used — pass the same nameTemplate to both, or omit it on ` +
          `create() to reuse the declared one.`,
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      const schemaLeaves = declaredSchemaLeaves.get(namespace);
      if (schemaLeaves) {
        for (const [path] of flattenTokenEntries(values as TokenValues)) {
          if (!schemaLeaves.has(path)) {
            throw new Error(
              `[typestyles] tokens.create('${namespace}', ...) path "${path}" is not in the declared schema.`,
            );
          }
        }
      }
      assertPlainCreateValues(values);
    }

    registeredNamespaces.add(namespace);

    const mergedValues = mergeCreateValues(namespaceValueTrees.get(namespace), values);
    namespaceValueTrees.set(namespace, mergedValues);

    const cssNs = scopedTokenNamespace(scopeId, namespace);
    const effectiveTemplate =
      options?.nameTemplate ?? (hasDeclared ? declaredTemplate : instanceDefaultTemplate);
    if (effectiveTemplate !== undefined) customNamingActive = true;

    let declarations: string;
    const nameByPath = new Map<string, string>();

    if (effectiveTemplate === undefined) {
      const flatEntries = flattenTokenEntries(mergedValues as TokenValues);
      for (const [path] of flatEntries) {
        nameByPath.set(path, `--${cssNs}-${path}`);
      }
      declarations = flatEntries.map(([key, value]) => `--${cssNs}-${key}: ${value}`).join('; ');
    } else {
      const flatEntries = flattenTokenPaths(mergedValues as TokenValues);
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
      invalidateKeys([key], []);
      insertRules(applyLayerToRules([{ key, css }], layer, themeLayerContext.stack));
    } else {
      const key = `tokens:${cssNs}`;
      invalidateKeys([key], []);
      insertRule(key, css);
    }

    const mergedSchema = namespaceSchemas.get(namespace);
    const allKeys = collectAllKeysFromValues(mergedValues);
    if (mergedSchema) {
      for (const { path } of flattenTokenSchema(mergedSchema)) {
        allKeys.add(path);
      }
    }

    const descriptorLeaves = mergedSchema ? getSchemaSyntaxLeaves(mergedSchema) : new Set<string>();

    createdTokenKeys.set(namespace, allKeys);
    createdDescriptorLeaves.set(namespace, descriptorLeaves);
    createdTokenTemplates.set(namespace, effectiveTemplate);
    createdTokenNameByPath.set(namespace, nameByPath);

    const resolvePathName = buildResolvePathName(namespace, effectiveTemplate, nameByPath);
    const leafValues = Object.fromEntries(
      flattenTokenEntries(mergedValues as TokenValues).map(([path, leafValue]) => [
        path,
        leafValue,
      ]),
    );

    const ref = createTokenProxy(resolvePathName, '', allKeys, descriptorLeaves) as CreatedTokenRef<
      T,
      N
    >;
    attachTokenMeta(ref, namespace);
    attachTokenLeafValues(ref, leafValues);
    return ref;
  }

  function assertPlainCreateValues(obj: CreateTokenValues, path = ''): void {
    if (typeof obj === 'string' || typeof obj === 'number') return;

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = path ? `${path}-${key}` : key;
      if (isTokenDescriptor(value)) {
        throw new Error(
          `[typestyles] tokens.create(...) path "${fullKey}" uses a TokenDescriptor — ` +
            `move syntax to tokens.declare() schema instead.`,
        );
      }
      if (value !== null && typeof value === 'object') {
        assertPlainCreateValues(value as CreateTokenValues, fullKey);
      }
    }
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

  function declare<TSchema extends TokenSchema, N extends string>(
    namespace: N,
    schema: TSchema,
    options?: { nameTemplate?: TokenNameTemplate },
  ): DeclaredTokenRef<TSchema, N> {
    const isCreated = registeredNamespaces.has(namespace);
    const createdTemplate = createdTokenTemplates.get(namespace);

    if (
      process.env.NODE_ENV !== 'production' &&
      isCreated &&
      options?.nameTemplate !== undefined &&
      options.nameTemplate !== createdTemplate
    ) {
      throw new Error(
        `[typestyles] tokens.declare('${namespace}', ...) was called with a different nameTemplate than ` +
          `tokens.create('${namespace}', ...) already used — pass the same nameTemplate to both, or omit it ` +
          `on declare() to reuse the created one.`,
      );
    }

    const effectiveTemplate = isCreated
      ? createdTemplate
      : (options?.nameTemplate ??
        (declaredNamespaceTemplates.has(namespace)
          ? declaredNamespaceTemplates.get(namespace)
          : instanceDefaultTemplate));

    if (
      process.env.NODE_ENV !== 'production' &&
      !isCreated &&
      declaredNamespaceTemplates.has(namespace) &&
      declaredNamespaceTemplates.get(namespace) !== effectiveTemplate
    ) {
      throw new Error(
        `[typestyles] tokens.declare('${namespace}', ...) was called with a different nameTemplate than ` +
          `a previous tokens.declare('${namespace}', ...) on this instance — pass the same nameTemplate ` +
          `to every declare() call for a namespace, or reuse refs from the first declare().`,
      );
    }

    declaredNamespaceTemplates.set(namespace, effectiveTemplate);

    const priorSchema = namespaceSchemas.get(namespace);
    const mergedSchema = priorSchema
      ? mergeTokenTrees(priorSchema as Record<string, unknown>, schema as Record<string, unknown>)
      : schema;
    namespaceSchemas.set(namespace, mergedSchema as TokenSchema);

    const incoming = flattenTokenSchema(schema);
    const leafMap = declaredSchemaLeaves.get(namespace) ?? new Map<string, TokenSchemaLeaf>();
    const nameByPath = createdTokenNameByPath.get(namespace) ?? new Map<string, string>();
    const resolvePathName = buildResolvePathName(namespace, effectiveTemplate, nameByPath);

    for (const { path, leaf } of incoming) {
      const existing = leafMap.get(path);
      if (existing !== undefined) {
        if (!tokenSchemaLeavesEqual(existing, leaf)) {
          if (process.env.NODE_ENV !== 'production') {
            throw new Error(
              `[typestyles] tokens.declare('${namespace}', ...) re-declared path "${path}" with a ` +
                `conflicting schema leaf.`,
            );
          }
        } else {
          continue;
        }
      }

      leafMap.set(path, leaf);
      if (leaf !== true) {
        const propName = resolvePathName(path);
        registerAtPropertySchema(propName, {
          syntax: leaf.syntax,
          inherits: leaf.inherits,
          initial: leaf.initial,
        });
      }
    }

    declaredSchemaLeaves.set(namespace, leafMap);

    const syntaxLeaves = getSchemaSyntaxLeaves(mergedSchema as TokenSchema);
    const ref = createDeclaredTokenProxy(resolvePathName, '', syntaxLeaves) as DeclaredTokenRef<
      TSchema,
      N
    >;
    attachDeclaredMeta(ref, { namespace, schema: mergedSchema as TokenSchema });
    return ref;
  }

  return {
    scopeId,
    create: create as TokensApi<R>['create'],
    use: use as TokensApi<R>['use'],
    declare: declare as TokensApi<R>['declare'],
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
