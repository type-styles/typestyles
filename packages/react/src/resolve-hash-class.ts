import type { CSSProperties, StylesApi, TypeStylesApi } from 'typestyles';

/** Styles host for the css prop / TypeStylesProvider. */
export type CssStylesHost = Pick<TypeStylesApi, 'style'> | StylesApi;

export type HashClassFn = (properties: CSSProperties, label?: string) => string;

/** Normalize `style.hash` (createTypeStyles) and `hashClass` (createStyles). */
export function resolveHashClass(api: CssStylesHost): HashClassFn {
  if ('style' in api && typeof api.style?.hash === 'function') {
    return (properties, label) => api.style.hash(properties, { label });
  }
  return (api as StylesApi).hashClass;
}
