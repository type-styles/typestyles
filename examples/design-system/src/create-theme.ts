import { tokens } from './runtime';
import type { DesignTheme, DesignThemeConfig } from './types';

/**
 * One place for the design-system palette pattern: `base` + shared `data-mode` / system color mode.
 * Pass the same `base` / `dark` shapes you would use with `tokens.createTheme`.
 */
export function createDesignTheme(config: DesignThemeConfig): DesignTheme {
  const { light, dark } = config;
  return tokens.createTheme(config.name, {
    base: light,
    colorMode: tokens.colorMode.systemWithLightDarkOverride({
      attribute: 'data-mode',
      values: { light: 'light', dark: 'dark' },
      scope: 'self',
      light,
      dark,
    }),
  });
}
