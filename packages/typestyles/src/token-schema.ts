import type { TokenSchema, TokenSchemaLeaf } from './types';

export function isTokenSchemaLeaf(value: unknown): value is TokenSchemaLeaf {
  return value === true || (typeof value === 'object' && value !== null && 'syntax' in value);
}

export function flattenTokenSchema(
  schema: TokenSchema,
  prefix = '',
): Array<{ path: string; leaf: TokenSchemaLeaf }> {
  const entries: Array<{ path: string; leaf: TokenSchemaLeaf }> = [];

  if (isTokenSchemaLeaf(schema)) {
    if (prefix) entries.push({ path: prefix, leaf: schema });
    return entries;
  }

  for (const [key, value] of Object.entries(schema)) {
    const path = prefix ? `${prefix}-${key}` : key;
    entries.push(...flattenTokenSchema(value as TokenSchema, path));
  }

  return entries;
}

export function mergeTokenTrees<T extends Record<string, unknown>>(base: T, chunk: T): T {
  const result = { ...base } as T;

  for (const [key, value] of Object.entries(chunk)) {
    const existing = result[key as keyof T];
    if (
      existing !== undefined &&
      typeof existing === 'object' &&
      existing !== null &&
      typeof value === 'object' &&
      value !== null &&
      !isTokenSchemaLeaf(existing) &&
      !isTokenSchemaLeaf(value)
    ) {
      result[key as keyof T] = mergeTokenTrees(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      ) as T[keyof T];
    } else {
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
}

export function tokenSchemaLeavesEqual(a: TokenSchemaLeaf, b: TokenSchemaLeaf): boolean {
  if (a === true && b === true) return true;
  if (typeof a === 'object' && typeof b === 'object') {
    return (
      a.syntax === b.syntax &&
      (a.inherits ?? false) === (b.inherits ?? false) &&
      (a.initial ?? undefined) === (b.initial ?? undefined)
    );
  }
  return false;
}

export function getSchemaSyntaxLeaves(schema: TokenSchema): Set<string> {
  return new Set(
    flattenTokenSchema(schema)
      .filter((entry) => entry.leaf !== true)
      .map((entry) => entry.path),
  );
}
