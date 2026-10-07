import type {
  CreateTokenValues,
  ThemeConfig,
  ThemeModeDefinition,
  ThemeSource,
  Theme,
  ThemeOverrideInput,
} from './types';
import { mergeThemeOverrides, mergeTokenValues } from './token-color-modes';

export type { ThemeSource };

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

/** Merge mode layers by `id`; overrides win over preset (same as tokens). */
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
 * Deep-merge preset + override slices (`tokens`, `modes`).
 * Does not run mode-aware normalization — call {@link normalizeThemeConfig} after when compiling.
 */
export function mergeThemeSource(
  from: ThemeSource | undefined,
  onto: ThemeSource & Pick<ThemeConfig, 'components'>,
): ThemeConfig {
  const f = from ?? {};
  const p = onto ?? {};

  return {
    tokens: mergeTokensMaps(f.tokens, p.tokens),
    modes: mergeThemeModes(f.modes, p.modes),
    components: p.components,
  };
}

/** Merge a {@link Theme.override} input onto a parent {@link ThemeSource} snapshot. */
export function applyThemeOverride(source: ThemeSource, input: ThemeOverrideInput): ThemeConfig {
  const { components, tokens, modes } = input;
  return mergeThemeSource(source, {
    tokens: tokens as ThemeConfig['tokens'],
    modes: modes as ThemeConfig['modes'],
    ...(components !== undefined ? { components } : {}),
  });
}

/**
 * Bind {@link Theme.override} to a recreate callback (tokens API or low-level createTheme).
 */
export function bindThemeOverride(
  source: ThemeSource,
  apply: (name: string, config: ThemeConfig, callOptions?: { replace?: boolean }) => Theme,
): (input: ThemeOverrideInput) => Theme {
  return (input) =>
    apply(input.name, applyThemeOverride(source, input), { replace: input.replace });
}
