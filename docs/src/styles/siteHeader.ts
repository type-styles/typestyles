import { designTokens as t } from '@examples/design-system';
import { styles } from './typestyles';

const bp = '@media (max-width: 768px)';
const desktop = '@media (min-width: 769px)';

const siteHeaderHeight = `calc(${t.space[8]} + ${t.space[2]})`;
const compactControl = `calc(${t.space[6]} + ${t.space[1]})`;

export const siteHeader = styles.component(
  'docs-site-header',
  {
    root: {
      display: 'block',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      zIndex: 300,
      backgroundColor: t.color.background.app,
      borderBottom: `${t.borderWidth.thick} solid ${t.color.border.strong}`,
    },
    inner: {
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'space-between',
      gap: t.space[2],
      height: siteHeaderHeight,
      minHeight: siteHeaderHeight,
      paddingInline: t.space[4],
      boxSizing: 'border-box',
      [desktop]: {
        gap: t.space[6],
      },
    },
    menuToggle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: compactControl,
      height: compactControl,
      padding: 0,
      margin: 0,
      flexShrink: 0,
      backgroundColor: t.color.background.surface,
      border: `${t.borderWidth.default} solid ${t.color.border.default}`,
      color: t.color.text.primary,
      cursor: 'pointer',
      boxShadow: t.shadow.xs,
      fontSize: t.fontSize.lg,
      lineHeight: 1,
      '&:hover': {
        backgroundColor: t.color.background.subtle,
      },
      '&:active': {
        boxShadow: 'none',
        transform: 'translate(2px, 2px)',
      },
      '&:focus-visible': {
        outline: `${t.borderWidth.thin} solid ${t.color.accent.default}`,
        outlineOffset: '2px',
      },
      [desktop]: {
        display: 'none',
      },
    },
    left: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      [desktop]: {
        flex: 'initial',
        flexGrow: 0,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
      },
    },
    logo: {
      fontSize: t.fontSize.xl,
      fontWeight: t.fontWeight.bold,
      color: t.color.text.primary,
      textDecoration: 'none',
      letterSpacing: '-0.03em',
      textTransform: 'uppercase',
      flexShrink: 0,
      alignSelf: 'center',
      paddingInlineStart: t.space[4],
      paddingInlineEnd: t.space[6],
      '&:hover': { color: t.color.accent.default },
      [bp]: {
        fontSize: t.fontSize.lg,
        paddingInlineStart: t.space[2],
        paddingInlineEnd: t.space[2],
      },
    },
    logoAccent: {
      color: t.color.accent.default,
    },
    nav: {
      display: 'none',
      [desktop]: {
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        alignSelf: 'stretch',
        height: '100%',
        borderInlineStart: `${t.borderWidth.default} solid ${t.color.border.default}`,
      },
    },
    /**
     * Sidebar/TOC-style type and colors. Current item: `::after` bar sits in the header’s bottom border lane
     * (translated past the link box) so it overlaps the root `border-bottom` instead of stacking above it.
     */
    navLink: {
      display: 'flex',
      alignItems: 'center',
      boxSizing: 'border-box',
      height: '100%',
      margin: 0,
      fontSize: t.fontSize.md,
      fontFamily: t.fontFamily.sans,
      lineHeight: 1.35,
      color: t.color.text.secondary,
      textDecoration: 'none',
      paddingInline: t.space[5],
      borderRight: t.stroke.default,
      backgroundColor: 'transparent',
      cursor: 'pointer',
      zIndex: 2,
      '&:hover': {
        color: t.color.text.primary,
        backgroundColor: t.color.background.subtle,
      },
      '&[aria-current="page"]': {
        position: 'relative',
        zIndex: 3,
        color: t.color.accent.default,
        fontWeight: t.fontWeight.medium,
        backgroundColor: t.color.accent.subtle,
        '&:hover': {
          color: t.color.accent.default,
          backgroundColor: t.color.accent.subtle,
        },
      },
    },
    right: {
      display: 'flex',
      alignItems: 'stretch',
      flexShrink: 0,
      alignSelf: 'center',
      height: '100%',
    },
    searchWrapper: {
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      flexShrink: 0,
      borderInlineStart: `${t.borderWidth.default} solid ${t.color.border.default}`,
      paddingInline: t.space[3],
      [bp]: {
        borderInlineStart: 'none',
        paddingInline: 0,
      },
    },
    searchIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: t.color.text.placeholder,
      pointerEvents: 'none',
      lineHeight: 0,
      [bp]: {
        display: 'none',
      },
    },
    searchTriggerIconMobile: {
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 0,
      color: t.color.text.primary,
      [bp]: {
        display: 'inline-flex',
      },
    },
    searchTriggerLabel: {
      [bp]: {
        display: 'none',
      },
    },
    searchTrigger: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      margin: 0,
      paddingInline: t.space[4],
      paddingBlock: t.space[2],
      fontSize: t.fontSize.sm,
      fontFamily: t.fontFamily.sans,
      textAlign: 'left',
      cursor: 'pointer',
      backgroundColor: 'transparent',
      border: 'none',
      color: t.color.text.secondary,
      outline: 'none',
      '&:hover': {
        backgroundColor: t.color.background.subtle,
        color: t.color.text.primary,
      },
      '&:focus-visible': {
        outline: `${t.borderWidth.thin} solid ${t.color.accent.default}`,
        outlineOffset: '-2px',
      },
      [bp]: {
        width: compactControl,
        height: compactControl,
        padding: 0,
        justifyContent: 'center',
        backgroundColor: t.color.background.surface,
        border: `${t.borderWidth.default} solid ${t.color.border.default}`,
        boxShadow: t.shadow.xs,
        color: t.color.text.primary,
        '&:hover': {
          backgroundColor: t.color.background.subtle,
          color: t.color.text.primary,
        },
        '&:active': {
          boxShadow: 'none',
          transform: 'translate(2px, 2px)',
        },
        '&:focus-visible': {
          outlineOffset: '2px',
        },
      },
    },
    searchKbd: {
      boxSizing: 'border-box',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: t.fontSize.xs,
      color: t.color.text.placeholder,
      backgroundColor: t.color.accent.subtle,
      paddingInline: t.space[2],
      paddingBlock: t.space[3],
      fontFamily: t.fontFamily.sans,
      lineHeight: 1,
      pointerEvents: 'none',
      [bp]: {
        display: 'none',
      },
    },
    githubIcon: {
      display: 'block',
      flexShrink: 0,
    },
    githubLink: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.space[2],
      paddingInline: t.space[4],
      minHeight: compactControl,
      fontSize: t.fontSize.sm,
      fontWeight: t.fontWeight.bold,
      fontFamily: t.fontFamily.sans,
      textDecoration: 'none',
      color: t.color.text.primary,
      backgroundColor: 'transparent',
      border: 'none',
      borderInlineStart: `${t.borderWidth.default} solid ${t.color.border.strong}`,
      boxShadow: 'none',
      minWidth: 'unset',
      '&:hover': {
        backgroundColor: t.color.accent.default,
        color: t.color.text.onAccent,
      },
      '&:active': {
        boxShadow: 'none',
        transform: 'translate(2px, 2px)',
      },
    },
  },
  { layer: 'components' },
);
