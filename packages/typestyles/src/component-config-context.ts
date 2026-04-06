import {
  sanitizeClassSegment,
  scopedTokenNamespace,
  type ClassNamingConfig,
} from './class-naming.js';
import type {
  ComponentConfigContext,
  ComponentInternalVarRef,
  ComponentVarDefinitions,
  ComponentVarDescriptor,
  ComponentVarNode,
  ComponentVarOptions,
  ComponentVarRefTree,
  CSSVarRef,
} from './types.js';
import { insertRule } from './sheet.js';

function escapePropertySyntaxString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

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

export function mergeComponentVarDefaultsInto(
  config: Record<string, unknown>,
  defaults: Record<string, string>,
): Record<string, unknown> {
  if (Object.keys(defaults).length === 0) return config;
  if ('slots' in config) return config;

  const userBase = config.base;
  const mergedBase =
    userBase && typeof userBase === 'object' && !Array.isArray(userBase)
      ? { ...defaults, ...userBase }
      : { ...defaults };
  return { ...config, base: mergedBase };
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

  function registerVar(
    logicalPath: string,
    entry: { value: string; syntax?: string; inherits?: boolean },
  ): ComponentInternalVarRef {
    const safeId = sanitizeClassSegment(logicalPath);
    if (seen.has(safeId)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[typestyles] Duplicate internal var path "${logicalPath}" for component "${namespace}". ` +
            `Declare each path once and reuse the returned ref.`,
        );
      }
    } else {
      seen.add(safeId);
    }

    const name = `--${ns}-${safeId}`;
    varBaseDefaults[name] = entry.value;

    if (entry.syntax != null) {
      const inherits = entry.inherits ?? false;
      const css = `@property ${name} { syntax: "${escapePropertySyntaxString(entry.syntax)}"; inherits: ${inherits}; initial-value: ${entry.value}; }`;
      insertRule(`@property:${name}`, css);
    }

    return {
      name,
      var: `var(${name})` as CSSVarRef,
    };
  }

  function varFn(id: string, options?: ComponentVarOptions): ComponentInternalVarRef {
    const safePath = sanitizeClassSegment(id);
    const valueStr =
      options?.value !== undefined && options?.value !== null ? String(options.value) : undefined;

    if (valueStr !== undefined) {
      return registerVar(safePath, {
        value: valueStr,
        syntax: options?.syntax,
        inherits: options?.inherits,
      });
    }

    const name = `--${ns}-${safePath}`;
    if (seen.has(safePath)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[typestyles] Duplicate internal var "${id}" for component "${namespace}". ` +
            `Declare each id once and reuse the returned ref.`,
        );
      }
    } else {
      seen.add(safePath);
    }

    return {
      name,
      var: `var(${name})` as CSSVarRef,
    };
  }

  function varsFn<const T extends ComponentVarDefinitions>(definitions: T): ComponentVarRefTree<T> {
    const entries = flattenComponentVars(definitions);
    const refByPath = new Map<string, ComponentInternalVarRef>();
    const allPathKeys = collectPathKeys(entries);

    for (const e of entries) {
      refByPath.set(e.path, registerVar(e.path, e));
    }

    return createVarRefsProxy(refByPath, allPathKeys, '') as ComponentVarRefTree<T>;
  }

  const ctx: ComponentConfigContext = { var: varFn, vars: varsFn };

  return {
    ctx,
    mergeVarDefaultsInto: (config: Record<string, unknown>) =>
      mergeComponentVarDefaultsInto(config, varBaseDefaults),
  };
}
