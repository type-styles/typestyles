import { lightDark } from './color';
import { isColorModeObject, validateColorModeObject, type ColorModeMap } from './color-modes';
import { isPlainObject } from './breakpoints';
import type { ThemeOverrides, TokenValues } from './types';

/** Whether a scalar token value can be wrapped in CSS `light-dark()` (color or image). */
export function canUseLightDarkForTokenValue(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith('light-dark(')) return true;
  if (
    /^(#|oklch|oklab|hsl|hwb|rgb|var\(|color-mix|linear-gradient|radial-gradient|url\()/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  if (/^-?\d/.test(trimmed)) return false;
  return true;
}

function scalar(value: string | number): string {
  return String(value);
}

function isNestedTokenObject(value: unknown): value is Record<string, TokenValues> {
  return isPlainObject(value);
}

function expandScalarPair(
  lightVal: string,
  darkVal: string,
  path: string,
): { merged: string; darkOnly?: string } {
  if (lightVal === darkVal) return { merged: lightVal };
  if (canUseLightDarkForTokenValue(lightVal) && canUseLightDarkForTokenValue(darkVal)) {
    return { merged: lightDark(lightVal, darkVal) };
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[typestyles] Token "${path}" cannot use \`light-dark()\` — emitting a dark-mode override rule instead.`,
    );
  }
  return { merged: lightVal, darkOnly: darkVal };
}

function expandModeAwareLeaf(
  value: Record<string, string | number>,
  path: string,
  colorModes: ColorModeMap,
): { merged: string; darkOnly?: string } {
  validateColorModeObject(path, value, colorModes);
  const lightKey = colorModes[0];
  const darkKey = colorModes[1] ?? colorModes.find((m) => m !== lightKey);
  const lightVal = value[lightKey] != null ? scalar(value[lightKey]) : undefined;
  const darkVal = darkKey != null && value[darkKey] != null ? scalar(value[darkKey]) : undefined;
  if (lightVal === undefined && darkVal === undefined) return { merged: '' };
  if (lightVal === undefined || darkVal === undefined) {
    return { merged: lightVal ?? darkVal! };
  }
  return expandScalarPair(lightVal, darkVal, path);
}

/**
 * Deep-merge light/dark token trees into one tree with `light-dark()` leaves where possible.
 * Returns `darkOnly` for leaves that cannot use `light-dark()` (e.g. box-shadow strings).
 */
export function mergeTokenTreesWithColorModes(
  light: TokenValues,
  dark: TokenValues,
): { merged: TokenValues; darkOnly: TokenValues | null } {
  const merged: Record<string, unknown> = {};
  const darkOnly: Record<string, unknown> = {};
  let hasDarkOnly = false;
  const keys = new Set([
    ...(isNestedTokenObject(light) ? Object.keys(light) : []),
    ...(isNestedTokenObject(dark) ? Object.keys(dark) : []),
  ]);

  for (const key of keys) {
    const lightValue = isNestedTokenObject(light) ? light[key] : undefined;
    const darkValue = isNestedTokenObject(dark) ? dark[key] : undefined;

    if (isNestedTokenObject(lightValue) && isNestedTokenObject(darkValue)) {
      const nested = mergeTokenTreesWithColorModes(lightValue, darkValue);
      merged[key] = nested.merged;
      if (nested.darkOnly) {
        darkOnly[key] = nested.darkOnly;
        hasDarkOnly = true;
      }
      continue;
    }

    if (typeof lightValue === 'string' && typeof darkValue === 'string') {
      const result = expandScalarPair(lightValue, darkValue, key);
      merged[key] = result.merged;
      if (result.darkOnly) {
        darkOnly[key] = result.darkOnly;
        hasDarkOnly = true;
      }
      continue;
    }

    if (typeof lightValue === 'number' && typeof darkValue === 'number') {
      const result = expandScalarPair(scalar(lightValue), scalar(darkValue), key);
      merged[key] = result.merged;
      if (result.darkOnly) {
        darkOnly[key] = result.darkOnly;
        hasDarkOnly = true;
      }
      continue;
    }

    merged[key] = lightValue ?? darkValue;
  }

  return {
    merged: merged as TokenValues,
    darkOnly: hasDarkOnly ? (darkOnly as TokenValues) : null,
  };
}

function deepMergeThemeOverrides(base: ThemeOverrides, patch?: ThemeOverrides): ThemeOverrides {
  if (!patch) return structuredClone(base) as ThemeOverrides;
  const out = structuredClone(base) as Record<string, unknown>;
  for (const [key, patchValue] of Object.entries(patch)) {
    const baseValue = out[key];
    if (isNestedTokenObject(baseValue) && isNestedTokenObject(patchValue)) {
      out[key] = deepMergeTokenValues(baseValue as TokenValues, patchValue as TokenValues);
    } else {
      out[key] = patchValue;
    }
  }
  return out as ThemeOverrides;
}

function deepMergeTokenValues(base: TokenValues, patch: TokenValues): TokenValues {
  if (typeof base === 'string' || typeof base === 'number') return patch;
  if (typeof patch === 'string' || typeof patch === 'number') return patch;
  if (!isNestedTokenObject(base) || !isNestedTokenObject(patch)) return patch;

  const out = { ...base } as Record<string, TokenValues>;
  for (const [key, patchValue] of Object.entries(patch)) {
    const baseValue = out[key];
    if (baseValue != null && isNestedTokenObject(baseValue) && isNestedTokenObject(patchValue)) {
      out[key] = deepMergeTokenValues(baseValue, patchValue);
    } else {
      out[key] = patchValue;
    }
  }
  return out as TokenValues;
}

function walkExpandModeAware(
  values: TokenValues,
  colorModes: ColorModeMap,
  pathPrefix: string,
): { expanded: TokenValues; darkOnly: TokenValues | null } {
  if (typeof values === 'string' || typeof values === 'number') {
    return { expanded: values, darkOnly: null };
  }
  if (!isNestedTokenObject(values)) {
    return { expanded: values, darkOnly: null };
  }

  const expanded: Record<string, unknown> = {};
  const darkOnly: Record<string, unknown> = {};
  let hasDarkOnly = false;

  for (const [key, child] of Object.entries(values)) {
    const path = pathPrefix ? `${pathPrefix}-${key}` : key;

    if (isColorModeObject(child, colorModes)) {
      const result = expandModeAwareLeaf(child, path, colorModes);
      expanded[key] = result.merged;
      if (result.darkOnly) {
        darkOnly[key] = result.darkOnly;
        hasDarkOnly = true;
      }
      continue;
    }

    if (isNestedTokenObject(child)) {
      const nested = walkExpandModeAware(child as TokenValues, colorModes, path);
      expanded[key] = nested.expanded;
      if (nested.darkOnly) {
        darkOnly[key] = nested.darkOnly;
        hasDarkOnly = true;
      }
      continue;
    }

    expanded[key] = child;
  }

  return {
    expanded: expanded as TokenValues,
    darkOnly: hasDarkOnly ? (darkOnly as TokenValues) : null,
  };
}

/**
 * Expand `{ light, dark }` leaves in a token tree to scalar / `light-dark()` strings.
 * Incompatible pairs are returned in `darkOnly` for mode-rule emission.
 */
export function expandModeAwareTokenValues(
  values: TokenValues,
  colorModes: ColorModeMap | undefined,
): { expanded: TokenValues; darkOnly: TokenValues | null } {
  if (!colorModes) {
    if (process.env.NODE_ENV !== 'production' && isNestedTokenObject(values)) {
      for (const [key, child] of Object.entries(values)) {
        if (isColorModeObject(child, ['light', 'dark'] as ColorModeMap)) {
          console.warn(
            `[typestyles] Mode-aware token leaf "${key}" requires \`colorModes\` on \`createTypeStyles\` / \`createTokens\`.`,
          );
        }
      }
    }
    return { expanded: values, darkOnly: null };
  }
  return walkExpandModeAware(values, colorModes, '');
}

/** Deep-merge base + light/dark patches, compiling color-compatible leaves to `light-dark()`. */
export function mergeThemeColorModePatches(
  base: ThemeOverrides,
  lightPatch: ThemeOverrides | undefined,
  darkPatch: ThemeOverrides | undefined,
  colorModes: ColorModeMap | undefined,
): { merged: ThemeOverrides; darkOnly: ThemeOverrides | null } {
  if (!colorModes) {
    return {
      merged: deepMergeThemeOverrides(deepMergeThemeOverrides(base, lightPatch), darkPatch),
      darkOnly: null,
    };
  }

  const lightTree = deepMergeThemeOverrides(base, lightPatch);
  const darkTree = deepMergeThemeOverrides(base, darkPatch);
  const merged: Record<string, unknown> = {};
  const darkOnly: Record<string, unknown> = {};
  let hasDarkOnly = false;
  const namespaces = new Set([...Object.keys(lightTree), ...Object.keys(darkTree)]);

  for (const namespace of namespaces) {
    const lightNs = (lightTree[namespace] ?? {}) as TokenValues;
    const darkNs = (darkTree[namespace] ?? {}) as TokenValues;
    const result = mergeTokenTreesWithColorModes(lightNs, darkNs);
    merged[namespace] = result.merged;
    if (result.darkOnly) {
      darkOnly[namespace] = result.darkOnly;
      hasDarkOnly = true;
    }
  }

  const expanded = expandThemeOverrides(merged as ThemeOverrides, colorModes);
  const combinedDarkOnly: Record<string, unknown> = { ...darkOnly };
  if (expanded.darkOnly) {
    for (const [namespace, values] of Object.entries(expanded.darkOnly)) {
      if (isNestedTokenObject(combinedDarkOnly[namespace]) && isNestedTokenObject(values)) {
        const { merged: nestedMerged } = mergeTokenTreesWithColorModes(
          combinedDarkOnly[namespace] as TokenValues,
          values as TokenValues,
        );
        combinedDarkOnly[namespace] = nestedMerged;
      } else {
        combinedDarkOnly[namespace] = values;
      }
    }
    hasDarkOnly = true;
  }

  return {
    merged: expanded.expanded,
    darkOnly: hasDarkOnly ? (combinedDarkOnly as ThemeOverrides) : null,
  };
}

/** Expand mode-aware values inside each namespace of theme overrides. */
export function expandThemeOverrides(
  overrides: ThemeOverrides,
  colorModes: ColorModeMap | undefined,
): { expanded: ThemeOverrides; darkOnly: ThemeOverrides | null } {
  const expanded: Record<string, unknown> = {};
  const darkOnly: Record<string, unknown> = {};
  let hasDarkOnly = false;

  for (const [namespace, values] of Object.entries(overrides)) {
    if (values == null) continue;
    const result = expandModeAwareTokenValues(values as TokenValues, colorModes);
    expanded[namespace] = result.expanded;
    if (result.darkOnly) {
      darkOnly[namespace] = result.darkOnly;
      hasDarkOnly = true;
    }
  }

  return {
    expanded: expanded as ThemeOverrides,
    darkOnly: hasDarkOnly ? (darkOnly as ThemeOverrides) : null,
  };
}
