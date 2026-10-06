import type {
  CreateTokenValues,
  ThemeConfig,
  ThemeModeDefinition,
  ThemePreset,
  ThemeSurface,
  ThemeSurfaceOverrideInput,
} from './types';
import { mergeThemeOverrides, mergeTokenValues } from './token-color-modes';

export type { ThemePreset };

function mergeTokensMaps(
  from: Record<string, CreateTokenValues> | undefined,
  onto: Record<string, CreateTokenValues> | undefined,
): Record<string, CreateTokenValues> | undefined {
  if (!from && !onto) return undefined;
  const keys = new Set([...Object.keys(from ?? {}), ...Object.keys(onto ?? {})]);
  const out: Record<string, CreateTokenValues> = {};
  for (const key of keys) {
    const a = from?.[key];
    const b = onto?.[key];
    if (a !== undefined && b !== undefined) {
      out[key] = mergeTokenValues(a, b) as CreateTokenValues;
    } else {
      out[key] = (b ?? a)!;
    }
  }
  return out;
}

/** Merge mode layers by `id`; overrides win over preset (same as tokens / colorMode). */
function mergeThemeModes(
  from: ThemeModeDefinition[] | undefined,
  onto: ThemeModeDefinition[] | undefined,
): ThemeModeDefinition[] | undefined {
  if (!from?.length && !onto?.length) return undefined;
  if (!from?.length) return onto ? [...onto] : undefined;
  if (!onto?.length) return [...from];

  const byId = new Map<string, ThemeModeDefinition>();
  for (const mode of from) {
    byId.set(mode.id, mode);
  }
  for (const mode of onto) {
    const existing = byId.get(mode.id);
    byId.set(
      mode.id,
      existing
        ? {
            id: mode.id,
            when: mode.when,
            overrides: mergeThemeOverrides(existing.overrides, mode.overrides),
          }
        : mode,
    );
  }

  const out: ThemeModeDefinition[] = [];
  const seen = new Set<string>();
  for (const mode of from) {
    out.push(byId.get(mode.id)!);
    seen.add(mode.id);
  }
  for (const mode of onto) {
    if (!seen.has(mode.id)) {
      out.push(byId.get(mode.id)!);
      seen.add(mode.id);
    }
  }
  return out;
}

/**
 * Deep-merge preset + override slices (`tokens`, `colorMode`, `modes`).
 * Does not run mode-aware normalization — call {@link normalizeThemeConfig} after when compiling.
 */
export function mergeThemePresetConfig(
  from: ThemePreset | undefined,
  onto: ThemePreset & Pick<ThemeConfig, 'components'>,
): ThemeConfig {
  const f = from ?? {};
  const p = onto ?? {};

  const colorModeLight = mergeThemeOverrides(f.colorMode?.light ?? {}, p.colorMode?.light);
  const colorModeDark = mergeThemeOverrides(f.colorMode?.dark ?? {}, p.colorMode?.dark);
  const hasColorMode =
    Object.keys(colorModeLight).length > 0 || Object.keys(colorModeDark).length > 0;

  return {
    tokens: mergeTokensMaps(f.tokens, p.tokens),
    colorMode: hasColorMode ? { light: colorModeLight, dark: colorModeDark } : undefined,
    modes: mergeThemeModes(f.modes, p.modes),
    components: p.components,
  };
}

/** Merge a {@link ThemeSurface.override} input onto a parent {@link ThemePreset} snapshot. */
export function applyThemeSurfaceOverride(
  source: ThemePreset,
  input: ThemeSurfaceOverrideInput,
): ThemeConfig {
  const { components, tokens, colorMode, modes } = input;
  return mergeThemePresetConfig(source, {
    tokens: tokens as ThemeConfig['tokens'],
    colorMode: colorMode as ThemeConfig['colorMode'],
    modes: modes as ThemeConfig['modes'],
    ...(components !== undefined ? { components } : {}),
  });
}

/**
 * Bind {@link ThemeSurface.override} to a recreate callback (tokens API or low-level createTheme).
 */
export function bindThemeSurfaceOverride(
  source: ThemePreset,
  apply: (name: string, config: ThemeConfig, callOptions?: { replace?: boolean }) => ThemeSurface,
): (input: ThemeSurfaceOverrideInput) => ThemeSurface {
  return (input) =>
    apply(input.name, applyThemeSurfaceOverride(source, input), { replace: input.replace });
}
