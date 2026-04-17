import { designTokens as t } from '@examples/design-system';
import { createTypeStyles } from 'typestyles';

/**
 * Application-level typestyles: page chrome only. Shared components and tokens
 * come from `@examples/react-design-system` (pulled in via `typestyles-entry.ts`).
 *
 * Uses `createTypeStyles` with the same cascade stack as `@examples/design-system`
 * so app shell classes and globals participate in `@layer` ordering with the library.
 */
const { styles, global } = createTypeStyles({
  scopeId: 'example-app',
  mode: 'semantic',
  layers: ['tokens', 'components', 'utilities'] as const,
  tokenLayer: 'tokens',
  globalLayer: 'tokens',
});

const componentLayer = { layer: 'components' } as const;

/** Fill the viewport so palette + mode on `<html>` read like the docs (not a white band above the demo card). */
global.style('html', {
  minHeight: '100%',
  backgroundColor: t.color.background.app,
  color: t.color.text.primary,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
});

global.style('#app', {
  minHeight: '100%',
});

export const site = {
  page: styles.class(
    'app-site-page',
    {
      maxWidth: '920px',
      margin: '0 auto',
      padding: '32px 20px',
    },
    componentLayer,
  ),
  header: styles.class(
    'app-site-header',
    {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    componentLayer,
  ),
  appearanceControls: styles.class(
    'app-site-appearance',
    {
      display: 'flex',
      flexDirection: 'column',
      gap: t.space[2],
      maxWidth: '240px',
    },
    componentLayer,
  ),
  themeFieldLabel: styles.class(
    'app-site-theme-label',
    {
      fontSize: t.fontSize.xs,
      fontWeight: t.fontWeight.semibold,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: t.color.text.placeholder,
    },
    componentLayer,
  ),
  themeSelect: styles.class(
    'app-site-theme-select',
    {
      width: '100%',
      padding: `${t.space[2]} ${t.space[4]}`,
      fontSize: t.fontSize.sm,
      fontFamily: t.fontFamily.sans,
      backgroundColor: t.color.background.subtle,
      border: `1px solid ${t.color.border.default}`,
      borderRadius: t.radius.md,
      color: t.color.text.primary,
      cursor: 'pointer',
      outline: 'none',
      transition: 'border-color 0.15s ease, background-color 0.2s ease',
      '&:focus': { borderColor: t.color.accent.default },
    },
    componentLayer,
  ),
  themeToggle: styles.class(
    'app-site-theme-toggle',
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.space[2],
      width: '100%',
      padding: `7px ${t.space[4]}`,
      fontSize: t.fontSize.sm,
      color: t.color.text.secondary,
      backgroundColor: t.color.background.subtle,
      border: `1px solid ${t.color.border.default}`,
      borderRadius: t.radius.md,
      cursor: 'pointer',
      fontFamily: t.fontFamily.sans,
      transition: 'color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
      '&:hover': {
        color: t.color.text.primary,
        borderColor: t.color.text.secondary,
      },
    },
    componentLayer,
  ),
} as const;
