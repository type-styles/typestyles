/**
 * Type-level `Array.prototype.join(', ')` for tuple literals — used by {@link has}, {@link is}, {@link where}
 * so `[builder(…)]` keys stay **specific template literals** (TypeScript otherwise invents a `string` index
 * when mixed with plain CSS longhands unless the key type is narrow).
 */
export type JoinComma<T extends readonly string[]> = T extends readonly []
  ? ''
  : T extends readonly [infer A extends string]
    ? A
    : T extends readonly [infer A extends string, ...infer R extends string[]]
      ? R['length'] extends 0
        ? A
        : `${A}, ${JoinComma<R>}`
      : string;

/**
 * Type-level `Array.prototype.join(' and ')` for container query condition groups.
 */
export type JoinAnd<T extends readonly string[]> = T extends readonly []
  ? ''
  : T extends readonly [infer A extends string]
    ? A
    : T extends readonly [infer A extends string, ...infer R extends string[]]
      ? R['length'] extends 0
        ? A
        : `${A} and ${JoinAnd<R>}`
      : string;
