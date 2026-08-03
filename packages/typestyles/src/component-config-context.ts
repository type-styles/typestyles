import { sanitizeClassSegment, scopedTokenNamespace, type ClassNamingConfig } from './class-naming';
import {
  createRegisteredPropertyRef,
  registerAtPropertyRule,
  registerAtPropertySchema,
} from './registered-property';
import { flattenTokenSchema } from './token-schema';
import type {
  ComponentConfigContext,
  ComponentInternalVarRef,
  ComponentVarDefinitions,
  ComponentVarDescriptor,
  ComponentVarNode,
  ComponentVarOptions,
  ComponentVarRefTree,
  ComponentVarSchema,
  InferFromSchema,
  PropertyRegistration,
} from './types';

function isVarDescriptor(o: unknown): o is ComponentVarDescriptor {
  return (
    typeof o === 'object' &&
    o !== null &&
    'value' in o &&
    (typeof (o as { value: unknown }).value === 'string' ||
      typeof (o as { value: unknown }).value === 'number')
  );
}

export type FlatComponentVarEntry = {
  path: string;
  value: string;
  syntax?: string;
  inherits?: boolean;
  initial?: string | number;
};

/**
 * Flatten nested var definitions (same nesting rules as tokens) into dashed paths.
 */
export function flattenComponentVars(
  obj: Record<string, ComponentVarNode>,
  prefix = '',
): FlatComponentVarEntry[] {
  const out: FlatComponentVarEntry[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}-${key}` : key;

    if (typeof value === 'string' || typeof value === 'number') {
      out.push({ path, value: String(value) });
    } else if (isVarDescriptor(value)) {
      out.push({
        path,
        value: String(value.value),
        syntax: value.syntax,
        inherits: value.inherits,
        initial: value.initial,
      });
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      out.push(...flattenComponentVars(value as Record<string, ComponentVarNode>, path));
    }
  }

  return out;
}

function pathPrefixes(path: string): string[] {
  const parts = path.split('-');
  const prefixes: string[] = [];
  for (let i = 1; i <= parts.length; i++) {
    prefixes.push(parts.slice(0, i).join('-'));
  }
  return prefixes;
}

function collectPathKeys(entries: FlatComponentVarEntry[]): Set<string> {
  const keys = new Set<string>();
  for (const e of entries) {
    for (const p of pathPrefixes(e.path)) {
      keys.add(p);
    }
  }
  return keys;
}

function createVarRefsProxy(
  refByPath: Map<string, ComponentInternalVarRef>,
  allPathKeys: Set<string>,
  prefix: string,
): object {
  const handler: ProxyHandler<object> = {
    get(_target, prop: string | symbol): unknown {
      if (typeof prop === 'symbol') {
        return undefined;
      }
      if (prop === 'constructor') return Object;
      if (prop === '__esModule') return false;

      const newPrefix = prefix ? `${prefix}-${prop}` : prop;

      if (refByPath.has(newPrefix)) {
        const hasChildren = [...refByPath.keys()].some(
          (k) => k !== newPrefix && k.startsWith(`${newPrefix}-`),
        );
        if (hasChildren) {
          return createVarRefsProxy(refByPath, allPathKeys, newPrefix);
        }
        return refByPath.get(newPrefix);
      }

      if ([...refByPath.keys()].some((k) => k.startsWith(`${newPrefix}-`))) {
        return createVarRefsProxy(refByPath, allPathKeys, newPrefix);
      }

      if (prefix !== '' && allPathKeys.has(newPrefix)) {
        return createVarRefsProxy(refByPath, allPathKeys, newPrefix);
      }

      return undefined;
    },
    has(_target, prop: string | symbol) {
      if (typeof prop !== 'string') return false;
      const newPrefix = prefix ? `${prefix}-${prop}` : prop;
      if (refByPath.has(newPrefix)) return true;
      return [...refByPath.keys()].some((k) => k.startsWith(`${newPrefix}-`));
    },
    set(_target, _prop, _value) {
      return false;
    },
  };

  return new Proxy({}, handler);
}

function declareVarSchema(
  schema: ComponentVarSchema,
  registerRef: (logicalPath: string) => ComponentInternalVarRef,
): void {
  for (const { path, leaf } of flattenTokenSchema(schema)) {
    const ref = registerRef(path);
    if (leaf !== true) {
      registerAtPropertySchema(ref.name, {
        syntax: leaf.syntax,
        inherits: leaf.inherits ?? true,
        initial: leaf.initial,
      });
    }
  }
}

export function mergeComponentVarDefaultsInto(
  config: Record<string, unknown>,
  defaults: Record<string, string>,
): Record<string, unknown> {
  if (Object.keys(defaults).length === 0) return config;

  let key = 'base';
  let src: Record<string, unknown> = config;
  const s = config.slots;
  if (Array.isArray(s) && s.length) {
    key = s.includes('root') ? 'root' : String(s[0]);
    if ('variants' in config || 'compoundVariants' in config || 'defaultVariants' in config) {
      src = (config.base ?? {}) as Record<string, unknown>;
    }
  }

  const block = src[key];
  const merged =
    block && typeof block === 'object' && !Array.isArray(block)
      ? { ...defaults, ...(block as Record<string, string>) }
      : { ...defaults };
  return src === config
    ? { ...config, [key]: merged }
    : { ...config, base: { ...src, [key]: merged } };
}

export function createComponentConfigContextPair(
  classNaming: ClassNamingConfig,
  namespace: string,
): {
  ctx: ComponentConfigContext;
  mergeVarDefaultsInto: (config: Record<string, unknown>) => Record<string, unknown>;
} {
  const seen = new Set<string>();
  const ns = scopedTokenNamespace(
    classNaming.scopeId?.trim() || undefined,
    sanitizeClassSegment(namespace),
  );

  const varBaseDefaults: Record<string, string> = {};

  function trackSeen(safeId: string, label: string): void {
    if (seen.has(safeId)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[typestyles] Duplicate ${label} for component "${namespace}". ` +
            `Declare each path once and reuse the returned ref.`,
        );
      }
    } else {
      seen.add(safeId);
    }
  }

  function registerVarValue(
    logicalPath: string,
    entry: { value: string; syntax?: string; inherits?: boolean; initial?: string | number },
  ): ComponentInternalVarRef {
    const safeId = sanitizeClassSegment(logicalPath);
    trackSeen(safeId, `internal var path "${logicalPath}"`);

    const name = `--${ns}-${safeId}`;
    varBaseDefaults[name] = entry.value;

    if (entry.syntax != null) {
      registerAtPropertyRule(name, {
        value: entry.value,
        syntax: entry.syntax,
        inherits: entry.inherits ?? true,
        initial: entry.initial,
      });
    }

    return createRegisteredPropertyRef(name);
  }

  function declareVarFn(id: string, registration: PropertyRegistration): ComponentInternalVarRef {
    const safePath = sanitizeClassSegment(id);
    trackSeen(safePath, `internal var "${id}"`);
    const name = `--${ns}-${safePath}`;
    registerAtPropertySchema(name, {
      ...registration,
      inherits: registration.inherits ?? true,
    });
    return createRegisteredPropertyRef(name);
  }

  function varFn(id: string, options?: ComponentVarOptions): ComponentInternalVarRef {
    const safePath = sanitizeClassSegment(id);
    const valueStr =
      options?.value !== undefined && options?.value !== null ? String(options.value) : undefined;

    if (valueStr !== undefined) {
      return registerVarValue(safePath, {
        value: valueStr,
        syntax: options?.syntax,
        inherits: options?.inherits,
        initial: options?.initial,
      });
    }

    trackSeen(safePath, `internal var "${id}"`);
    const name = `--${ns}-${safePath}`;
    return createRegisteredPropertyRef(name);
  }

  function varsFn<const T extends ComponentVarDefinitions>(definitions: T): ComponentVarRefTree<T> {
    const entries = flattenComponentVars(definitions);
    const refByPath = new Map<string, ComponentInternalVarRef>();
    const allPathKeys = collectPathKeys(entries);

    for (const e of entries) {
      refByPath.set(e.path, registerVarValue(e.path, e));
    }

    return createVarRefsProxy(refByPath, allPathKeys, '') as ComponentVarRefTree<T>;
  }

  function varsDeclareFn<const T extends ComponentVarSchema>(
    schema: T,
  ): ComponentVarRefTree<InferFromSchema<T>> {
    const refByPath = new Map<string, ComponentInternalVarRef>();
    const allPathKeys = new Set<string>();

    for (const { path } of flattenTokenSchema(schema)) {
      for (const p of pathPrefixes(path)) allPathKeys.add(p);
      const safeId = sanitizeClassSegment(path);
      trackSeen(safeId, `internal var path "${path}"`);
      const name = `--${ns}-${safeId}`;
      refByPath.set(path, createRegisteredPropertyRef(name));
    }

    declareVarSchema(schema, (logicalPath) => {
      const ref = refByPath.get(logicalPath);
      if (!ref) throw new Error(`[typestyles] internal error: missing ref for "${logicalPath}"`);
      return ref;
    });

    return createVarRefsProxy(refByPath, allPathKeys, '') as ComponentVarRefTree<
      InferFromSchema<T>
    >;
  }

  const varCallable = Object.assign(varFn, { declare: declareVarFn });
  const varsCallable = Object.assign(varsFn, { declare: varsDeclareFn });
  const ctx: ComponentConfigContext = { var: varCallable, vars: varsCallable };

  return {
    ctx,
    mergeVarDefaultsInto: (config: Record<string, unknown>) =>
      mergeComponentVarDefaultsInto(config, varBaseDefaults),
  };
}
