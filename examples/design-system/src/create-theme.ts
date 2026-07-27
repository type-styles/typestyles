import { tokens } from './runtime';
import type { DesignTheme, DesignThemeConfig } from './types';

/**
 * One place for the design-system palette pattern: light base + dark patch
 * compiled to `light-dark()` on theme custom properties.
 */
export function createDesignTheme(config: DesignThemeConfig): DesignTheme {
  const { light, dark } = config;
  return tokens.createTheme(config.name, {
    base: light,
    colorMode: { light, dark },
  });
}
