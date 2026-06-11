import {
  aiGlowTheme,
  amberTheme,
  classicSystemTheme,
  defaultTheme,
  designStyleList,
  forestTheme,
  newWaveTheme,
  roseTheme,
  type DesignStyleId,
  windows95Theme,
} from '@examples/design-system';

/** Strip these from `<html>` before applying a new appearance. */
export const docsAppearanceClassesToClear = [
  defaultTheme.className,
  forestTheme.className,
  roseTheme.className,
  amberTheme.className,
  aiGlowTheme.className,
  newWaveTheme.className,
  windows95Theme.className,
  classicSystemTheme.className,
];

const docsThemeByStyle: Record<DesignStyleId, { className: string }> = {
  default: defaultTheme,
  'ai-glow': aiGlowTheme,
  'new-wave': newWaveTheme,
  'windows-95': windows95Theme,
  'classic-system': classicSystemTheme,
};

export type DocsColorMode = 'light' | 'dark' | 'system';

export function getDocsAppearanceClass(
  style: DesignStyleId,
  mode: DocsColorMode,
): { className: string; dataMode: 'light' | 'dark' | undefined; dataStyle: DesignStyleId } {
  const theme = docsThemeByStyle[style] ?? defaultTheme;
  return {
    className: theme.className,
    dataMode: mode === 'system' ? undefined : mode,
    dataStyle: docsThemeByStyle[style] ? style : 'default',
  };
}

export { designStyleList };
export type { DesignStyleId };
