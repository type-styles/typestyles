import { styles } from 'typestyles';
import { designTokens as ds, proseContent } from '@examples/design-system';
import { space, font } from './tokens';

const c = ds.color;
/** Accent wash for nav / TOC current — only `ds-color` references. */
const accentSurfaceMuted = `color-mix(in srgb, ${c.accent} 14%, ${c.surface})`;
const textQuiet = `color-mix(in srgb, ${c.textMuted} 70%, ${c.surface})`;

/** Compose with `doc('content')` on markdown bodies — registers prose CSS before doc overrides. */
export const docProseRoot = proseContent('root');

const bp = '@media (max-width: 768px)';
const tocBp = '@media (min-width: 1024px)';
const belowTocBp = '@media (max-width: 1023px)';

const layoutBase = styles.create('docs-layout', {
  root: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: font.sans,
    color: c.text,
    backgroundColor: c.bg,
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  content: {
    flex: 1,
    minWidth: 0,
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
  /** Grid wrapper when `tocHeadings` are present (desktop TOC column). */
  docPageWrap: {
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
  },
  docPageWrapWithToc: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateAreas: '"toc" "main"',
    [tocBp]: {
      gridTemplateColumns: 'minmax(0, 1fr) 200px',
      gridTemplateAreas: '"main toc"',
      gap: space.xxl,
      alignItems: 'start',
    },
  },
  mainColumn: {
    gridArea: 'main',
    minWidth: 0,
  },
  tocAside: {
    gridArea: 'toc',
    minWidth: 0,
    [tocBp]: {
      justifySelf: 'end',
      width: '200px',
      position: 'sticky',
      top: space.lg,
      maxHeight: `calc(100vh - ${space.lg} - ${space.sm})`,
      overflowY: 'auto',
      paddingTop: space.sm,
      paddingRight: space.xs,
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
    backgroundColor: c.surfaceMuted,
    borderRight: `1px solid ${c.border}`,
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
      backgroundColor: c.overlay,
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
    color: c.text,
    textDecoration: 'none',
    letterSpacing: '-0.03em',
    transition: 'color 0.15s ease',
    '&:hover': { color: c.accent },
  },
  logoAccent: {
    color: c.accent,
  },
  search: {
    margin: `0 ${space.md} ${space.md}`,
    padding: `8px ${space.md}`,
    fontSize: '13px',
    fontFamily: font.sans,
    backgroundColor: c.surfaceMuted,
    border: `1px solid ${c.border}`,
    borderRadius: '8px',
    color: c.textMuted,
    outline: 'none',
    transition: 'border-color 0.15s ease, background-color 0.2s ease',
    '&:focus': { borderColor: c.accent },
    '&::placeholder': { color: textQuiet },
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
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: textQuiet,
    pointerEvents: 'none',
    lineHeight: 0,
  },
  searchInput: {
    width: '100%',
    padding: `8px ${space.md} 8px 32px`,
    fontSize: '13px',
    fontFamily: font.sans,
    backgroundColor: c.surfaceMuted,
    border: `1px solid ${c.border}`,
    borderRadius: '8px',
    color: c.textMuted,
    outline: 'none',
    transition: 'border-color 0.15s ease, background-color 0.2s ease',
    '&:focus': { borderColor: c.accent },
    '&::placeholder': { color: textQuiet },
  },
  searchKbd: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '11px',
    color: textQuiet,
    backgroundColor: c.surface,
    border: `1px solid ${c.border}`,
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
    color: textQuiet,
    padding: `${space.sm} ${space.sm}`,
    marginTop: space.sm,
  },
  link: {
    display: 'block',
    fontSize: '13.5px',
    color: c.textMuted,
    textDecoration: 'none',
    padding: `6px ${space.sm}`,
    borderRadius: '6px',
    transition: 'color 0.12s ease, background-color 0.12s ease',
    '&:hover': {
      color: c.text,
      backgroundColor: c.surfaceMuted,
    },
  },
  linkActive: {
    color: c.accent,
    fontWeight: 500,
    backgroundColor: accentSurfaceMuted,
    '&:hover': {
      color: c.accent,
      backgroundColor: accentSurfaceMuted,
    },
  },
  footer: {
    padding: `${space.md} ${space.lg}`,
    borderTop: `1px solid ${c.border}`,
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
    color: c.textMuted,
    backgroundColor: c.surfaceMuted,
    border: `1px solid ${c.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: font.sans,
    transition: 'color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
    '&:hover': {
      color: c.text,
      borderColor: c.textMuted,
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
      backgroundColor: c.surfaceMuted,
      borderBottom: `1px solid ${c.border}`,
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
    color: c.text,
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
    '&:hover': {
      backgroundColor: c.surfaceMuted,
    },
  },
  logo: {
    fontSize: '16px',
    fontWeight: 700,
    color: c.text,
    textDecoration: 'none',
    letterSpacing: '-0.03em',
  },
  logoAccent: {
    color: c.accent,
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
    color: c.textMuted,
    cursor: 'pointer',
    transition: 'color 0.12s ease, background-color 0.12s ease',
    '&:hover': {
      color: c.text,
      backgroundColor: c.surfaceMuted,
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
    color: c.text,
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },
  description: {
    fontSize: '16px',
    color: c.textMuted,
    marginBottom: space.xl,
    lineHeight: 1.6,
  },
  content: {
    '& a:not([data-prose-heading-anchor]):not([data-alert-action])': {
      color: c.accent,
      textDecoration: 'none',
      transition: 'color 0.12s ease',
      '&:hover': { color: c.accentHover, textDecoration: 'underline' },
    },
    '& a[data-prose-heading-anchor]': {
      color: c.textMuted,
      fontWeight: 500,
      '&:hover': {
        color: c.accent,
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
      backgroundColor: c.surfaceMuted,
      padding: '2px 6px',
      borderRadius: '4px',
      border: `1px solid ${c.border}`,
    },
    '& pre:not([data-codeblock-pre])': {
      fontFamily: font.mono,
      fontSize: '13px',
      lineHeight: 1.6,
      backgroundColor: c.surfaceMuted,
      padding: space.md,
      borderRadius: '8px',
      border: `1px solid ${c.border}`,
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

export const skipLink = styles.create('docs-skip', {
  root: {
    position: 'absolute',
    left: space.md,
    top: space.md,
    zIndex: 10000,
    padding: `${space.sm} ${space.md}`,
    backgroundColor: c.accent,
    color: c.accentForeground,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    transform: 'translateY(-160%)',
    transition: 'transform 0.15s ease',
    '&:focus': {
      transform: 'translateY(0)',
      outline: `2px solid ${c.accent}`,
      outlineOffset: '2px',
    },
  },
});

export const toc = styles.create('docs-toc', {
  nav: {
    fontFamily: font.sans,
  },
  title: {
    margin: `0 0 ${space.sm}`,
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: textQuiet,
    [belowTocBp]: {
      display: 'none',
    },
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    margin: 0,
    marginBottom: '2px',
  },
  link: {
    display: 'block',
    fontSize: '13px',
    lineHeight: 1.35,
    color: c.textMuted,
    textDecoration: 'none',
    padding: `4px ${space.sm}`,
    borderLeft: '2px solid transparent',
    transition: 'color 0.12s ease, background-color 0.12s ease, border-color 0.12s ease',
    '&:hover': {
      color: c.text,
      backgroundColor: c.surfaceMuted,
    },
    '&[aria-current="location"]': {
      color: c.accent,
      fontWeight: 500,
      backgroundColor: accentSurfaceMuted,
      borderLeftColor: c.accent,
      '&:hover': {
        color: c.accent,
        backgroundColor: accentSurfaceMuted,
      },
    },
  },
  root: {
    marginBottom: space.lg,
    border: `1px solid ${c.border}`,
    borderRadius: '8px',
    backgroundColor: c.surfaceMuted,
    overflow: 'hidden',
    position: 'sticky',
    top: '64px',
    zIndex: 20,
    [tocBp]: {
      marginBottom: 0,
      border: 'none',
      borderRadius: 0,
      backgroundColor: 'transparent',
      overflow: 'visible',
      position: 'static',
      top: 'auto',
      zIndex: 'auto',
    },
  },
  details: {
    margin: 0,
  },
  summary: {
    listStyle: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: c.text,
    padding: `${space.sm} ${space.md}`,
    '&::-webkit-details-marker': {
      display: 'none',
    },
    [tocBp]: {
      display: 'none',
    },
  },
  panel: {
    padding: `0 ${space.md} ${space.md}`,
    borderTop: `1px solid ${c.border}`,
    [tocBp]: {
      padding: 0,
      borderTop: 'none',
    },
  },
});

export const docPage = styles.create('docs-doc-page', {
  footer: {
    marginTop: space.lg,
    paddingTop: space.md,
    borderTop: `1px solid ${c.border}`,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${space.md} ${space.lg}`,
    fontSize: '13px',
    color: c.textMuted,
  },
  editLink: {
    color: c.accent,
    textDecoration: 'none',
    fontWeight: 500,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTop: `1px solid ${c.border}`,
    gap: space.md,
  },
  paginationLink: {
    fontSize: '14px',
    color: c.accent,
    textDecoration: 'none',
    padding: `${space.sm} ${space.md}`,
    borderRadius: '8px',
    border: `1px solid ${c.border}`,
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    '&:hover': {
      backgroundColor: c.surfaceMuted,
      borderColor: c.accent,
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
    color: c.text,
    [bp]: {
      fontSize: '32px',
    },
  },
  titleAccent: {
    color: c.accent,
  },
  subtitle: {
    fontSize: '18px',
    color: c.textMuted,
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
    color: c.accentForeground,
    backgroundColor: c.accent,
    padding: `10px ${space.lg}`,
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'background-color 0.15s ease',
    border: 'none',
    cursor: 'pointer',
    '&:hover': { backgroundColor: c.accentHover },
  },
  ctaSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.sm,
    fontSize: '15px',
    fontWeight: 500,
    fontFamily: font.sans,
    color: c.text,
    backgroundColor: 'transparent',
    padding: `10px ${space.lg}`,
    borderRadius: '8px',
    textDecoration: 'none',
    border: `1px solid ${c.border}`,
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
    cursor: 'pointer',
    '&:hover': {
      borderColor: c.textMuted,
      backgroundColor: c.surfaceMuted,
    },
  },
});
