import type { CreateTokenValues, ThemeCompileConfig, ThemeConfig, ThemeOverrides } from './types';
export type ThemeTokensMap = Record<string, CreateTokenValues>;

/**
 * Register `tokens` namespaces and fold them into compiler `base` overrides.
 */
export function applyThemeTokensToConfig(
  config: ThemeConfig,
  registerNamespace: (namespace: string, values: CreateTokenValues) => void,
): ThemeCompileConfig {
  const tokens = config.tokens;
  if (!tokens || Object.keys(tokens).length === 0) {
    const { tokens: _t, from: _f, ...rest } = config;
    return rest;
  }

  const base: ThemeOverrides = {};
  for (const [namespace, values] of Object.entries(tokens)) {
    registerNamespace(namespace, values);
    base[namespace] = values as ThemeOverrides[string];
  }

  const { tokens: _omit, from: _from, ...rest } = config;
  return { ...rest, base };
}

/** Fold `tokens` into `base` for the core theme compiler (optional namespace registration). */
export function themeTokensToCompileConfig(
  config: ThemeConfig,
  registerNamespace?: (namespace: string, values: CreateTokenValues) => void,
): ThemeCompileConfig {
  if (registerNamespace) {
    return applyThemeTokensToConfig(config, registerNamespace);
  }
  return applyThemeTokensToConfig(config, () => {});
}
