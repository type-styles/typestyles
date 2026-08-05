import type { ComponentMeta } from './component-meta';
import type { RegisteredComponentVar, ComponentVarRegistry } from './component-meta';
import type { CSSVarRef } from './types';

export type ComponentVarAssignValue = string | number | CSSVarRef | { light: string; dark: string };

function isCssVarRef(value: unknown): value is CSSVarRef {
  return typeof value === 'string' && value.startsWith('var(--');
}

function isColorModePair(value: unknown): value is { light: string; dark: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  return typeof o.light === 'string' && typeof o.dark === 'string';
}

function isPlainVarValue(value: unknown): value is ComponentVarAssignValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    isCssVarRef(value) ||
    isColorModePair(value)
  );
}

function shouldRecurseLightDarkChildren(
  path: string,
  value: Record<string, unknown>,
  registry?: ComponentVarRegistry,
): boolean {
  if (!registry || !isColorModePair(value)) return false;
  if (registry.byPath.has(path)) return false;
  return registry.byPath.has(`${path}-light`) && registry.byPath.has(`${path}-dark`);
}

/**
 * Flatten nested consumer `vars` input to logical dashed paths (same as `c.vars()` definitions).
 * Supports dotted keys at the top level (`padding.outer.x`).
 *
 * When `registry` is provided, `{ light, dark }` objects recurse into `path-light` / `path-dark`
 * if those paths are registered and `path` itself is not.
 */
export function flattenVarValues(
  input: Record<string, unknown>,
  prefix = '',
  registry?: ComponentVarRegistry,
): Array<{ path: string; value: ComponentVarAssignValue }> {
  const out: Array<{ path: string; value: ComponentVarAssignValue }> = [];

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;

    if (prefix === '' && key.includes('.')) {
      if (isPlainVarValue(value)) {
        out.push({ path: key.replace(/\./g, '-'), value });
      }
      continue;
    }

    const path = prefix ? `${prefix}-${key}` : key;

    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      shouldRecurseLightDarkChildren(path, value as Record<string, unknown>, registry)
    ) {
      out.push(...flattenVarValues(value as Record<string, unknown>, path, registry));
      continue;
    }

    if (isPlainVarValue(value)) {
      out.push({ path, value });
      continue;
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      out.push(...flattenVarValues(value as Record<string, unknown>, path, registry));
    }
  }

  return out;
}

function resolveAssignValue(
  value: ComponentVarAssignValue,
): string | { light: string; dark: string } {
  if (typeof value === 'number') return String(value);
  return value;
}

function warnDev(message: string): void {
  if (process.env.NODE_ENV === 'production') return;
  console.warn(`[typestyles] ${message}`);
}

/**
 * Resolve consumer `vars` overrides to full custom-property declarations keyed by `--…` name.
 */
export function resolveVarOverrides(
  registry: ComponentVarRegistry,
  varsInput: Record<string, unknown>,
): Record<string, string | { light: string; dark: string }> {
  const declarations: Record<string, string | { light: string; dark: string }> = {};
  const entries = flattenVarValues(varsInput, '', registry);

  for (const { path, value } of entries) {
    const registered = registry.byPath.get(path);
    if (!registered) {
      warnDev(
        `Unknown component var "${path}" in styles.override() vars — ` +
          `declare it with c.vars() on the recipe.`,
      );
      continue;
    }
    declarations[registered.name] = resolveAssignValue(value);
  }

  return declarations;
}

/** Reuse host-slot resolution from `mergeComponentVarDefaultsInto`. */
export function resolveVarHostSlot(config: Record<string, unknown>): string {
  const s = config.slots;
  if (Array.isArray(s) && s.length) {
    return s.includes('root') ? 'root' : String(s[0]);
  }
  return 'base';
}

export function finalizeVarRegistry(
  registeredVars: RegisteredComponentVar[],
  byPath: Map<string, RegisteredComponentVar>,
  config: Record<string, unknown>,
): ComponentVarRegistry | undefined {
  if (registeredVars.length === 0) return undefined;
  return {
    hostSlot: resolveVarHostSlot(config),
    vars: registeredVars,
    byPath,
  };
}

export function resolveVarHostClass(
  meta: ComponentMeta,
  registry: ComponentVarRegistry,
): string | null {
  const { hostSlot } = registry;
  switch (meta.kind) {
    case 'dimensioned':
    case 'flat':
      return meta.base || null;
    case 'slot':
    case 'multi-slot':
      return meta.base[hostSlot] ?? null;
    default:
      return null;
  }
}
