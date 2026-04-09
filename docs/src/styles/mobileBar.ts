import { designTokens as t } from '@examples/design-system';
import { docsTokens as dt, styles } from './typestyles';

const bp = '@media (max-width: 768px)';

export const mobileBar = styles.component('docs-mobile-bar', {
  root: {
    display: 'none',
    [bp]: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: dt.size.mobileHeaderHeight,
      zIndex: 300,
      padding: `0 ${t.space[4]}`,
      backgroundColor: t.color.background.app,
      borderBottom: `${t.borderWidth.thick} solid #000`,
    },
  },
  menuBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dt.size.mobileIconButton,
    height: dt.size.mobileIconButton,
    padding: 0,
    backgroundColor: t.color.background.surface,
    border: `${t.borderWidth.default} solid #000`,
    color: t.color.text.primary,
    cursor: 'pointer',
    boxShadow: t.shadow.xs,
    '&:hover': {
      backgroundColor: t.color.background.subtle,
    },
    '&:active': {
      boxShadow: 'none',
      transform: 'translate(2px, 2px)',
    },
  },
  logo: {
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.bold,
    color: t.color.text.primary,
    textDecoration: 'none',
    letterSpacing: '-0.03em',
    textTransform: 'uppercase',
  },
  logoAccent: {
    color: t.color.accent.default,
  },
  /** Balances the menu button so the logo stays centered on small screens. */
  headerSpacer: {
    width: dt.size.mobileIconButton,
    flexShrink: 0,
  },
});
