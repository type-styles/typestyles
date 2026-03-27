import { tokens } from 'typestyles';
import { codeSyntaxDarkValues, designColorDarkValues } from '@examples/design-system';

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

/** Dark mode: only design-system semantic tokens (`ds-color`, `ds-code-syntax`). */
export const darkTheme = tokens.createTheme('docs-dark', {
  'ds-color': designColorDarkValues as Record<string, string>,
  'ds-code-syntax': codeSyntaxDarkValues as Record<string, string>,
});
