import { designTokens as t } from '@examples/design-system';
import { styles } from './typestyles';

const bp = '@media (max-width: 768px)';

const siteHeaderHeight = `calc(${t.space[8]} + ${t.space[2]})`;
const mobileIconButton = `calc(${t.space[6]} + ${t.space[1]})`;

export const mobileBar = styles.component(
  'docs-mobile-bar',
  {
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
        height: siteHeaderHeight,
        zIndex: 300,
        padding: `0 ${t.space[4]}`,
        backgroundColor: t.color.background.app,
        borderBottom: `${t.borderWidth.thick} solid ${t.color.border.strong}`,
      },
    },
    menuBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: mobileIconButton,
      height: mobileIconButton,
      padding: 0,
      backgroundColor: t.color.background.surface,
      border: `${t.borderWidth.default} solid ${t.color.border.default}`,
      color: t.color.text.primary,
      cursor: 'pointer',
      boxShadow: t.shadow.xs,
      flexShrink: 0,
      '&:hover': {
        backgroundColor: t.color.background.subtle,
      },
      '&:active': {
        boxShadow: 'none',
        transform: 'translate(2px, 2px)',
      },
    },
    /** Same chrome as `menuBtn`, for icon-only header actions. */
    /** Icon-sized control; also used for the compact “GH” GitHub link (no `Github` icon in this Lucide build). */
    iconLink: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: mobileIconButton,
      height: mobileIconButton,
      padding: `0 ${t.space[2]}`,
      fontSize: t.fontSize.xs,
      fontWeight: t.fontWeight.bold,
      fontFamily: t.fontFamily.sans,
      letterSpacing: '0.04em',
      backgroundColor: t.color.background.surface,
      border: `${t.borderWidth.default} solid ${t.color.border.default}`,
      color: t.color.text.primary,
      textDecoration: 'none',
      boxShadow: t.shadow.xs,
      flexShrink: 0,
      '&:hover': {
        backgroundColor: t.color.background.subtle,
      },
      '&:active': {
        boxShadow: 'none',
        transform: 'translate(2px, 2px)',
      },
    },
    logoWrap: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingInline: t.space[2],
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
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: t.space[2],
      flexShrink: 0,
    },
  },
  { layer: 'components' },
);
