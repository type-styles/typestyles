import type { OverrideConfigFor } from './override';

/**
 * Map of theme `components` overrides keyed by namespace when you have a const
 * registry object (e.g. `getRegisteredComponentRefs(styles)`).
 */
export type ThemeComponentsOverrideMap<T extends Record<string, object>> = {
  readonly [K in keyof T]?: OverrideConfigFor<T[K]>;
};

export type OverrideConfigForNamespace<
  TRegistry extends Record<string, object>,
  N extends keyof TRegistry & string,
> = OverrideConfigFor<TRegistry[N]>;
