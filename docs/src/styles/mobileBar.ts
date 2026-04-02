import { designTokens as t } from '@examples/design-system';
import { styles } from 'typestyles';

const bp = '@media (max-width: 768px)';

export const mobileBar = {
  root: styles.class('docs-mobile-bar-root', {
    display: 'none',
    [bp]: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      zIndex: 300,
      padding: `0 ${t.space[4]}`,
      backgroundColor: t.color.background.subtle,
      borderBottom: `1px solid ${t.color.border.default}`,
      transition: 'background-color 0.2s ease, border-color 0.2s ease',
    },
  }),
  menuBtn: styles.class('docs-mobile-bar-menuBtn', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: t.radius.sm,
    color: t.color.text.primary,
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
    '&:hover': {
      backgroundColor: t.color.background.subtle,
    },
  }),
  logo: styles.class('docs-mobile-bar-logo', {
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.bold,
    color: t.color.text.primary,
    textDecoration: 'none',
    letterSpacing: '-0.03em',
  }),
  logoAccent: styles.class('docs-mobile-bar-logoAccent', {
    color: t.color.accent.default,
  }),
  /** Balances the menu button so the logo stays centered on small screens. */
  headerSpacer: styles.class('docs-mobile-bar-headerSpacer', {
    width: '36px',
    flexShrink: 0,
  }),
};
