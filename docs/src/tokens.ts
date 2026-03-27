import { tokens } from 'typestyles';
import {
  codeSyntaxDarkValues,
  codeSyntaxLightValues,
  designColorPalettes,
  designPaletteList,
  type DesignPaletteId,
} from '@examples/design-system';

export const space = tokens.create('docs-space', {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
});

export const font = tokens.create('docs-font', {
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"Fira Code", ui-monospace, "Cascadia Code", monospace',
});

/** Default dark mode — same class name as before (`theme-docs-dark`). */
export const darkTheme = tokens.createTheme('docs-dark', {
  'ds-color': designColorPalettes.default.dark as Record<string, string>,
  'ds-code-syntax': codeSyntaxDarkValues as Record<string, string>,
});

const forestLightTheme = tokens.createTheme('docs-palette-forest', {
  'ds-color': designColorPalettes.forest.light as Record<string, string>,
  'ds-code-syntax': codeSyntaxLightValues as Record<string, string>,
});

const forestDarkTheme = tokens.createTheme('docs-palette-forest-dark', {
  'ds-color': designColorPalettes.forest.dark as Record<string, string>,
  'ds-code-syntax': codeSyntaxDarkValues as Record<string, string>,
});

const roseLightTheme = tokens.createTheme('docs-palette-rose', {
  'ds-color': designColorPalettes.rose.light as Record<string, string>,
  'ds-code-syntax': codeSyntaxLightValues as Record<string, string>,
});

const roseDarkTheme = tokens.createTheme('docs-palette-rose-dark', {
  'ds-color': designColorPalettes.rose.dark as Record<string, string>,
  'ds-code-syntax': codeSyntaxDarkValues as Record<string, string>,
});

const amberLightTheme = tokens.createTheme('docs-palette-amber', {
  'ds-color': designColorPalettes.amber.light as Record<string, string>,
  'ds-code-syntax': codeSyntaxLightValues as Record<string, string>,
});

const amberDarkTheme = tokens.createTheme('docs-palette-amber-dark', {
  'ds-color': designColorPalettes.amber.dark as Record<string, string>,
  'ds-code-syntax': codeSyntaxDarkValues as Record<string, string>,
});

const paletteLightClass: Record<DesignPaletteId, string> = {
  default: '',
  forest: forestLightTheme,
  rose: roseLightTheme,
  amber: amberLightTheme,
};

const paletteDarkClass: Record<DesignPaletteId, string> = {
  default: darkTheme,
  forest: forestDarkTheme,
  rose: roseDarkTheme,
  amber: amberDarkTheme,
};

/** Strip these from `<html>` before applying a new appearance. */
export const docsAppearanceClassesToClear = [
  darkTheme,
  forestLightTheme,
  forestDarkTheme,
  roseLightTheme,
  roseDarkTheme,
  amberLightTheme,
  amberDarkTheme,
];

export type DocsColorMode = 'light' | 'dark';

export function getDocsAppearanceClass(palette: DesignPaletteId, mode: DocsColorMode): string {
  return mode === 'light' ? paletteLightClass[palette] : paletteDarkClass[palette];
}

export { designPaletteList };
export type { DesignPaletteId };
