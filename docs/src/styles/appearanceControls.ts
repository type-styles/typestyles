import { designTokens as t } from '@examples/design-system';
import { styles } from './typestyles';

/** Matches fixed `siteHeader` chrome (viewport breakpoints; duplicate mount is `display: none`). */
const desktop = '@media (min-width: 769px)';

export const appearanceControls = styles.component(
  'docs-appearance-controls',
  {
    /**
     * One markup instance lives in the desktop header and one in the mobile bar; the hidden
     * chrome uses `display: none`, so viewport breakpoints still match the visible control.
     */
    cluster: {
      display: 'flex',
      alignItems: 'stretch',
      flexShrink: 0,
      height: '100%',
      gap: 0,
    },
    iconButton: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      backgroundColor: 'transparent',
      color: t.color.text.primary,
      cursor: 'pointer',
      flexShrink: 0,
      width: 'auto',
      height: 'auto',
      minWidth: `calc(${t.space[7]} + ${t.space[4]})`,
      paddingInline: t.space[4],
      alignSelf: 'stretch',
      border: 'none',
      borderInlineStart: `${t.borderWidth.default} solid ${t.color.border.strong}`,
      '&:hover': {
        backgroundColor: t.color.accent.default,
        color: t.color.text.onAccent,
      },
      '&:active': {
        transform: 'translate(2px, 2px)',
      },
      '&:focus-visible': {
        outline: `${t.borderWidth.thin} solid ${t.color.accent.default}`,
        outlineOffset: '-2px',
      },
    },
    paletteHost: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      [desktop]: {
        alignItems: 'stretch',
        alignSelf: 'stretch',
      },
    },
    /** `hidden` must win over `display` so only one mode icon shows at a time. */
    modeIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 0,
      '&[hidden]': {
        display: 'none',
      },
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: t.space[2],
      minWidth: '11rem',
      maxHeight: 'min(50vh, 16rem)',
      overflowY: 'auto',
      padding: t.space[1],
      backgroundColor: t.color.background.surface,
      border: `${t.borderWidth.thick} solid ${t.color.border.strong}`,
      boxShadow: t.shadow.md,
      zIndex: 400,
    },
    menuItem: {
      display: 'block',
      width: '100%',
      margin: 0,
      padding: `${t.space[2]} ${t.space[3]}`,
      fontSize: t.fontSize.sm,
      fontFamily: t.fontFamily.sans,
      textAlign: 'left',
      color: t.color.text.primary,
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      borderRadius: t.radius.none,
      '&:hover': {
        backgroundColor: t.color.background.subtle,
      },
      '&[aria-selected="true"]': {
        backgroundColor: t.color.accent.subtle,
        fontWeight: t.fontWeight.medium,
      },
    },
  },
  { layer: 'components' },
);
