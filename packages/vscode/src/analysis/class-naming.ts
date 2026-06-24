/**
 * Class naming aligned with `packages/typestyles/src/class-naming.ts`.
 */

import type { StyleRecord } from './css-serialize';

export type ClassNamingMode = 'semantic' | 'hashed' | 'compact' | 'atomic';

export interface ClassNamingConfig {
  mode: ClassNamingMode;
  prefix: string;
  scopeId: string;
}

export const defaultClassNamingConfig: ClassNamingConfig = {
  mode: 'semantic',
  prefix: 'ts',
  scopeId: '',
};

export function stableSerialize(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableSerialize(v)).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableSerialize(v)}`);

  return `{${entries.join(',')}}`;
}

export function hashString(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function sanitizeClassSegment(label: string): string {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');
  return normalized.replace(/-+/g, '-').replace(/^-|-$/g, '') || 'style';
}

function semanticScopePrefix(cfg: ClassNamingConfig): string {
  if (!cfg.scopeId || !cfg.scopeId.trim()) return '';
  return `${sanitizeClassSegment(cfg.scopeId)}-`;
}

export function buildSingleClassName(
  cfg: ClassNamingConfig,
  name: string,
  properties: StyleRecord,
): string {
  if (cfg.mode === 'semantic') {
    return `${semanticScopePrefix(cfg)}${name}`;
  }

  const payload = stableSerialize({
    ...(cfg.scopeId ? { scope: cfg.scopeId } : {}),
    namespace: name,
    suffix: '',
    properties,
  });
  const h = hashString(payload);
  return cfg.mode === 'compact'
    ? `${cfg.prefix}-${h}`
    : `${cfg.prefix}-${sanitizeClassSegment(name)}-${h}`;
}

export function buildComponentClassName(
  cfg: ClassNamingConfig,
  namespace: string,
  suffix: string,
  properties: StyleRecord,
): string {
  if (cfg.mode === 'semantic') {
    return `${semanticScopePrefix(cfg)}${namespace}-${suffix}`;
  }

  const payload = stableSerialize({
    ...(cfg.scopeId ? { scope: cfg.scopeId } : {}),
    namespace,
    suffix,
    properties,
  });
  const h = hashString(payload);
  return cfg.mode === 'compact'
    ? `${cfg.prefix}-${h}`
    : `${cfg.prefix}-${sanitizeClassSegment(namespace)}-${h}`;
}

export function emittedComponentClassPrefix(
  cfg: ClassNamingConfig,
  namespace: string,
): string | null {
  if (cfg.mode === 'semantic') return `${semanticScopePrefix(cfg)}${namespace}-`;
  if (cfg.mode === 'hashed') return `${cfg.prefix}-${sanitizeClassSegment(namespace)}-`;
  return null;
}
