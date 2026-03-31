import {
  amberTheme,
  defaultTheme,
  designPaletteList,
  forestTheme,
  roseTheme,
  type DesignPaletteId,
} from '@examples/design-system';

const docsThemeByPalette: Record<DesignPaletteId, { className: string }> = {
  default: defaultTheme,
  forest: forestTheme,
  rose: roseTheme,
  amber: amberTheme,
};

/** Strip these from `<html>` before applying a new appearance. */
export const docsAppearanceClassesToClear = [
  defaultTheme.className,
  forestTheme.className,
  roseTheme.className,
  amberTheme.className,
];

export type DocsColorMode = 'light' | 'dark' | 'system';

export function getDocsAppearanceClass(
  palette: DesignPaletteId,
  mode: DocsColorMode
): { className: string; dataMode: 'light' | 'dark' | undefined } {
  const theme = docsThemeByPalette[palette] ?? defaultTheme;
  return {
    className: theme.className,
    dataMode: mode === 'system' ? undefined : mode,
  };
}

export { designPaletteList };
export type { DesignPaletteId };
