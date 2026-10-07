import type { CSSProperties, StylesApi, TypeStylesApi } from 'typestyles';

/** Styles host for the css prop / TypeStylesProvider. */
export type CssStylesHost = Pick<TypeStylesApi, 'hash'> | StylesApi;

export type HashClassFn = (properties: CSSProperties, label?: string) => string;

/** Normalize `hash` (createTypeStyles) and `hashClass` (createStyles). */
export function resolveHashClass(api: CssStylesHost): HashClassFn {
  if ('hash' in api && typeof api.hash === 'function') {
    return (properties, label) => api.hash(properties, { label });
  }
  return (api as StylesApi).hashClass;
}
