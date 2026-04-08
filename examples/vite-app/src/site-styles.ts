import { designTokens as t } from '@examples/design-system';
import { createStyles, global } from 'typestyles';

/**
 * Application-level typestyles: page chrome only. Shared components and tokens
 * come from `@examples/react-design-system` (pulled in via `typestyles-entry.ts`).
 */
const styles = createStyles({ scopeId: 'example-app', mode: 'semantic' });

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
  page: styles.class('app-site-page', {
    maxWidth: '920px',
    margin: '0 auto',
    padding: '32px 20px',
  }),
  header: styles.class('app-site-header', {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  }),
  appearanceControls: styles.class('app-site-appearance', {
    display: 'flex',
    flexDirection: 'column',
    gap: t.space[2],
    maxWidth: '240px',
  }),
  themeFieldLabel: styles.class('app-site-theme-label', {
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: t.color.text.placeholder,
  }),
  themeSelect: styles.class('app-site-theme-select', {
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
  }),
  themeToggle: styles.class('app-site-theme-toggle', {
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
  }),
} as const;
