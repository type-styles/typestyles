import type { CreateTokenValues, ThemeConfig, ThemeOverrides } from './types';
import { mergeThemeOverrides } from './token-color-modes';

export type ThemeExtendMap = Record<string, CreateTokenValues>;

/**
 * Register `extend` namespaces and merge their values into theme `base` overrides.
 * Returns config without `extend` for the core theme compiler.
 */
export function applyThemeExtendToConfig(
  config: ThemeConfig,
  registerNamespace: (namespace: string, values: CreateTokenValues) => void,
): ThemeConfig {
  const extend = config.extend;
  if (!extend || Object.keys(extend).length === 0) {
    return config;
  }

  const extendOverrides: ThemeOverrides = {};
  for (const [namespace, values] of Object.entries(extend)) {
    registerNamespace(namespace, values);
    extendOverrides[namespace] = values as ThemeOverrides[string];
  }

  const { extend: _omit, ...rest } = config;
  return {
    ...rest,
    base: mergeThemeOverrides(extendOverrides, config.base ?? {}),
  };
}
