import { styles } from 'typestyles';
import { proseContent } from '@examples/design-system';
import { color, space, font } from './tokens';

/** Compose with `doc('content')` on markdown bodies — registers prose CSS before doc overrides. */
export const docProseRoot = proseContent('root');

const bp = '@media (max-width: 768px)';

const layoutBase = styles.create('docs-layout', {
  root: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: font.sans,
    color: color.text,
    backgroundColor: color.surface,
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  content: {
    flex: 1,
    minWidth: 0,
    overflowY: 'auto',
    [bp]: {
      paddingTop: '56px',
    },
  },
  main: {
    maxWidth: '768px',
    padding: space.xxl,
    [bp]: {
      padding: `${space.lg} ${space.md}`,
    },
  },
});

export const layout = layoutBase;

const sidebarBase = styles.create('docs-sidebar', {
  root: {
    width: '280px',
    flexShrink: 0,
    height: '100vh',
    position: 'sticky',
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: color.sidebarBg,
    borderRight: `1px solid ${color.sidebarBorder}`,
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
    [bp]: {
      position: 'fixed',
      height: 'auto',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 200,
      transform: 'translateX(-100%)',
      visibility: 'hidden',
      transition:
        'transform 0.25s ease, visibility 0.25s ease, background-color 0.2s ease, border-color 0.2s ease',
    },
  },
  rootOpen: {
    [bp]: {
      transform: 'translateX(0)',
      visibility: 'visible',
    },
  },
  backdrop: {
    display: 'none',
    [bp]: {
      display: 'block',
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      opacity: 0,
      visibility: 'hidden',
      transition: 'opacity 0.25s ease, visibility 0.25s ease',
    },
  },
  backdropVisible: {
    [bp]: {
      opacity: 1,
      visibility: 'visible',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: `${space.lg} ${space.lg} ${space.md}`,
  },
  logo: {
    fontSize: '18px',
    fontWeight: 700,
    color: color.text,
    textDecoration: 'none',
    letterSpacing: '-0.03em',
    transition: 'color 0.15s ease',
    '&:hover': { color: color.primary },
  },
  logoAccent: {
    color: color.primary,
  },
  search: {
    margin: `0 ${space.md} ${space.md}`,
    padding: `8px ${space.md}`,
    fontSize: '13px',
    fontFamily: font.sans,
    backgroundColor: color.searchBg,
    border: `1px solid ${color.searchBorder}`,
    borderRadius: '8px',
    color: color.searchText,
    outline: 'none',
    transition: 'border-color 0.15s ease, background-color 0.2s ease',
    '&:focus': { borderColor: color.primary },
    '&::placeholder': { color: color.textFaint },
  },
  searchWrapper: {
    position: 'relative',
    margin: `0 ${space.md} ${space.md}`,
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: color.textFaint,
    pointerEvents: 'none',
    fontSize: '14px',
    lineHeight: 1,
  },
  searchInput: {
    width: '100%',
    padding: `8px ${space.md} 8px 32px`,
    fontSize: '13px',
    fontFamily: font.sans,
    backgroundColor: color.searchBg,
    border: `1px solid ${color.searchBorder}`,
    borderRadius: '8px',
    color: color.searchText,
    outline: 'none',
    transition: 'border-color 0.15s ease, background-color 0.2s ease',
    '&:focus': { borderColor: color.primary },
    '&::placeholder': { color: color.textFaint },
  },
  searchKbd: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '11px',
    color: color.textFaint,
    backgroundColor: color.surface,
    border: `1px solid ${color.border}`,
    borderRadius: '4px',
    padding: '1px 5px',
    fontFamily: font.sans,
    lineHeight: '16px',
    pointerEvents: 'none',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: `0 ${space.md}`,
  },
  section: {
    marginBottom: space.sm,
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: color.textFaint,
    padding: `${space.sm} ${space.sm}`,
    marginTop: space.sm,
  },
  link: {
    display: 'block',
    fontSize: '13.5px',
    color: color.textMuted,
    textDecoration: 'none',
    padding: `6px ${space.sm}`,
    borderRadius: '6px',
    transition: 'color 0.12s ease, background-color 0.12s ease',
    '&:hover': {
      color: color.text,
      backgroundColor: color.searchBg,
    },
  },
  linkActive: {
    color: color.primary,
    fontWeight: 500,
    backgroundColor: color.primarySubtle,
    '&:hover': {
      color: color.primary,
      backgroundColor: color.primarySubtle,
    },
  },
  footer: {
    padding: `${space.md} ${space.lg}`,
    borderTop: `1px solid ${color.sidebarBorder}`,
    transition: 'border-color 0.2s ease',
  },
  themeToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    width: '100%',
    padding: `7px ${space.md}`,
    fontSize: '13px',
    color: color.textMuted,
    backgroundColor: color.searchBg,
    border: `1px solid ${color.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: font.sans,
    transition: 'color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
    '&:hover': {
      color: color.text,
      borderColor: color.textMuted,
    },
  },
});

export const sidebar = sidebarBase;

export const mobileBar = styles.create('docs-mobile-bar', {
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
      height: '56px',
      zIndex: 300,
      padding: `0 ${space.md}`,
      backgroundColor: color.sidebarBg,
      borderBottom: `1px solid ${color.sidebarBorder}`,
      transition: 'background-color 0.2s ease, border-color 0.2s ease',
    },
  },
  menuBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: color.text,
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
    '&:hover': {
      backgroundColor: color.searchBg,
    },
  },
  logo: {
    fontSize: '16px',
    fontWeight: 700,
    color: color.text,
    textDecoration: 'none',
    letterSpacing: '-0.03em',
  },
  logoAccent: {
    color: color.primary,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: space.xs,
  },
  themeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: color.textMuted,
    cursor: 'pointer',
    transition: 'color 0.12s ease, background-color 0.12s ease',
    '&:hover': {
      color: color.text,
      backgroundColor: color.searchBg,
    },
  },
});

export const doc = styles.create('docs-doc', {
  root: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: space.sm,
    color: color.text,
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },
  description: {
    fontSize: '16px',
    color: color.textMuted,
    marginBottom: space.xl,
    lineHeight: 1.6,
  },
  content: {
    '& a:not([data-prose-heading-anchor]):not([data-alert-action])': {
      color: color.link,
      textDecoration: 'none',
      transition: 'color 0.12s ease',
      '&:hover': { color: color.linkHover, textDecoration: 'underline' },
    },
    '& a[data-prose-heading-anchor]': {
      color: color.textMuted,
      fontWeight: 500,
      '&:hover': {
        color: color.link,
      },
    },
    '& a[data-alert-action]': {
      color: 'inherit',
      fontWeight: 'inherit',
      textDecoration: 'underline',
      '&:hover': {
        color: 'inherit',
        textDecoration: 'none',
      },
    },
    '& code': {
      fontFamily: font.mono,
      fontSize: '13px',
      backgroundColor: color.codeBg,
      padding: '2px 6px',
      borderRadius: '4px',
      border: `1px solid ${color.codeBorder}`,
    },
    '& pre:not([data-codeblock-pre])': {
      fontFamily: font.mono,
      fontSize: '13px',
      lineHeight: 1.6,
      backgroundColor: color.codeBg,
      padding: space.md,
      borderRadius: '8px',
      border: `1px solid ${color.codeBorder}`,
      overflow: 'auto',
      marginBottom: space.md,
    },
    '& pre code': {
      backgroundColor: 'transparent',
      padding: 0,
      border: 'none',
    },
  },
});

export const docPage = styles.create('docs-doc-page', {
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTop: `1px solid ${color.border}`,
    gap: space.md,
  },
  paginationLink: {
    fontSize: '14px',
    color: color.primary,
    textDecoration: 'none',
    padding: `${space.sm} ${space.md}`,
    borderRadius: '8px',
    border: `1px solid ${color.border}`,
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    '&:hover': {
      backgroundColor: color.surfaceRaised,
      borderColor: color.primary,
    },
  },
});

export const home = styles.create('docs-home', {
  hero: {
    paddingTop: space.xxl,
    paddingBottom: space.xxl,
  },
  title: {
    fontSize: '44px',
    fontWeight: 700,
    letterSpacing: '-0.035em',
    lineHeight: 1.15,
    marginBottom: space.md,
    color: color.text,
    [bp]: {
      fontSize: '32px',
    },
  },
  titleAccent: {
    color: color.primary,
  },
  subtitle: {
    fontSize: '18px',
    color: color.textMuted,
    lineHeight: 1.6,
    maxWidth: '540px',
    marginBottom: space.xl,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: space.md,
  },
  cta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.sm,
    fontSize: '15px',
    fontWeight: 500,
    fontFamily: font.sans,
    color: '#ffffff',
    backgroundColor: color.primary,
    padding: `10px ${space.lg}`,
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'background-color 0.15s ease',
    border: 'none',
    cursor: 'pointer',
    '&:hover': { backgroundColor: color.primaryHover },
  },
  ctaSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.sm,
    fontSize: '15px',
    fontWeight: 500,
    fontFamily: font.sans,
    color: color.text,
    backgroundColor: 'transparent',
    padding: `10px ${space.lg}`,
    borderRadius: '8px',
    textDecoration: 'none',
    border: `1px solid ${color.border}`,
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
    cursor: 'pointer',
    '&:hover': {
      borderColor: color.textMuted,
      backgroundColor: color.surfaceRaised,
    },
  },
});
