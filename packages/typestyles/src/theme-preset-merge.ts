import type { CreateTokenValues, ThemeConfig, ThemePreset } from './types';
import { mergeThemeOverrides, mergeTokenValues, normalizeThemeConfig } from './token-color-modes';
import type { ColorModeMap } from './color-modes';

export type { ThemePreset };

function mergeExtendMaps(
  from: Record<string, CreateTokenValues> | undefined,
  patch: Record<string, CreateTokenValues> | undefined,
): Record<string, CreateTokenValues> | undefined {
  if (!from && !patch) return undefined;
  const keys = new Set([...Object.keys(from ?? {}), ...Object.keys(patch ?? {})]);
  const out: Record<string, CreateTokenValues> = {};
  for (const key of keys) {
    const a = from?.[key];
    const b = patch?.[key];
    if (a !== undefined && b !== undefined) {
      out[key] = mergeTokenValues(a, b);
    } else {
      out[key] = (b ?? a)!;
    }
  }
  return out;
}

/**
 * Deep-merge `from` + `patch` theme presets (base, colorMode, extend, modes).
 * Does not run mode-aware normalization — call {@link normalizeThemeConfig} after.
 */
export function mergeThemePresetConfig(
  from: ThemePreset | undefined,
  patch: ThemePreset & Pick<ThemeConfig, 'components'>,
): ThemeConfig {
  const f = from ?? {};
  const p = patch ?? {};

  const colorModeLight = mergeThemeOverrides(f.colorMode?.light ?? {}, p.colorMode?.light);
  const colorModeDark = mergeThemeOverrides(f.colorMode?.dark ?? {}, p.colorMode?.dark);
  const hasColorMode =
    Object.keys(colorModeLight).length > 0 || Object.keys(colorModeDark).length > 0;

  return {
    base: mergeThemeOverrides(f.base ?? {}, p.base),
    colorMode: hasColorMode ? { light: colorModeLight, dark: colorModeDark } : undefined,
    modes: [...(f.modes ?? []), ...(p.modes ?? [])],
    extend: mergeExtendMaps(f.extend, p.extend),
    components: p.components,
  };
}

export function resolveThemeFromPatchConfig(
  config: ThemeConfig,
  colorModes?: ColorModeMap,
): ThemeConfig {
  if (config.from === undefined && config.patch === undefined) {
    return normalizeThemeConfig(config, colorModes);
  }

  const merged = mergeThemePresetConfig(config.from, {
    ...config.patch,
    components: config.patch?.components ?? config.components,
  });

  return normalizeThemeConfig(merged, colorModes);
}
