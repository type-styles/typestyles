const tokenMetaByRef = new WeakMap<object, TokenMeta>();

export type TokenMeta = {
  namespace: string;
};

export function attachTokenMeta(ref: object, namespace: string): void {
  tokenMetaByRef.set(ref, { namespace });
}

export function getTokenNamespace(ref: object): string | undefined {
  return tokenMetaByRef.get(ref)?.namespace;
}
