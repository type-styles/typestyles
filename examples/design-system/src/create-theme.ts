import { tokens } from './runtime';
import type { CreateTokenValues } from 'typestyles';
import type { DesignTheme, DesignThemeConfig } from './types';

/**
 * One place for the design-system palette pattern: light tokens + dark patch
 * compiled to `light-dark()` on theme custom properties.
 */
export function createDesignTheme(config: DesignThemeConfig): DesignTheme {
  const { light, dark } = config;
  return tokens.createTheme({
    name: config.name,
    tokens: light as Record<string, CreateTokenValues>,
    colorMode: { light, dark },
  }) as DesignTheme;
}
