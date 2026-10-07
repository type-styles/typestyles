import { tokens } from './runtime';
import type { CreateTokenValues, ThemeOverrides } from 'typestyles';
import type { DesignTheme, DesignThemeConfig } from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Design-system helper: zip separate light/dark palette trees into mode-aware leaves
 * for `tokens.createTheme` (`{ light, dark }` → CSS `light-dark()`).
 */
function toModeAwareTokens(
  light: ThemeOverrides,
  dark: ThemeOverrides,
): Record<string, CreateTokenValues> {
  const zip = (lightNode: unknown, darkNode: unknown): unknown => {
    if (
      (typeof lightNode === 'string' || typeof lightNode === 'number') &&
      (typeof darkNode === 'string' || typeof darkNode === 'number')
    ) {
      return String(lightNode) === String(darkNode)
        ? lightNode
        : { light: lightNode, dark: darkNode };
    }
    if (typeof lightNode === 'string' || typeof lightNode === 'number') {
      return lightNode;
    }
    if (!isPlainObject(lightNode)) {
      return lightNode;
    }
    const darkObj = isPlainObject(darkNode) ? darkNode : {};
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(lightNode)) {
      out[key] = zip(lightNode[key], darkObj[key]);
    }
    return out;
  };

  return zip(light, dark) as Record<string, CreateTokenValues>;
}

/**
 * One place for the design-system palette pattern: light + dark trees become
 * mode-aware token leaves compiled to `light-dark()` on theme custom properties.
 */
export function createDesignTheme(config: DesignThemeConfig): DesignTheme {
  const { light, dark } = config;
  return tokens.createTheme({
    name: config.name,
    tokens: toModeAwareTokens(light, dark),
  }) as DesignTheme;
}
