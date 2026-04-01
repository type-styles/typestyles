import { styles } from 'typestyles';
import { colors, spacing, fontSize, borderRadius } from '../styles/tokens';

export const pageStyles = {
  page: styles.class('page', {
    minHeight: '100vh',
    backgroundColor: colors.background,
    color: colors.foreground,
  }),

  container: styles.class('container', {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: `0 ${spacing[6]}`,
  }),

  hero: styles.class('hero', {
    padding: `${spacing[20]} 0 ${spacing[16]}`,
    textAlign: 'center',
  }),

  h1: styles.class('h1', {
    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
    fontWeight: '700',
    letterSpacing: '-0.025em',
    marginBottom: spacing[4],
    color: colors.foreground,
    lineHeight: 1.2,
  }),

  h2: styles.class('h2', {
    fontSize: fontSize['5xl'],
    fontWeight: '700',
    letterSpacing: '-0.025em',
    marginBottom: spacing[3],
    color: colors.foreground,
  }),

  subtitle: styles.class('subtitle', {
    fontSize: fontSize.lg,
    color: colors.mutedForeground,
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.6,
  }),

  heroButtons: styles.class('hero-buttons', {
    display: 'flex',
    gap: spacing[3],
    justifyContent: 'center',
    marginTop: spacing[8],
    flexWrap: 'wrap',
  }),

  section: styles.create(
    'section',
    { padding: `${spacing[12]} 0` },
    {
      border: {
        borderTop: `1px solid ${colors.border}`,
      },
    },
  ),

  sectionHeader: styles.class('section-header', {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    marginBottom: spacing[8],
  }),

  sectionTitle: styles.class('section-title', {
    fontSize: fontSize['5xl'],
    fontWeight: '700',
    letterSpacing: '-0.025em',
    color: colors.foreground,
  }),

  sectionDescription: styles.class('section-description', {
    fontSize: fontSize.lg,
    color: colors.mutedForeground,
  }),

  tabs: styles.class('tabs', {
    display: 'flex',
    gap: spacing[1],
    marginBottom: spacing[6],
    flexWrap: 'wrap',
  }),

  tab: styles.create(
    'tab',
    {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: colors.mutedForeground,
      padding: `${spacing[2]} ${spacing[3]}`,
      borderRadius: borderRadius.md,
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      transition: 'color 0.15s ease, background-color 0.15s ease',
      textDecoration: 'none',
      '&:hover': {
        color: colors.foreground,
        backgroundColor: colors.muted,
      },
    },
    {
      active: {
        color: colors.foreground,
        backgroundColor: colors.muted,
      },
    },
  ),

  toolbar: styles.class('toolbar', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing[2],
    marginBottom: spacing[6],
    flexWrap: 'wrap',
  }),

  select: styles.class('select', {
    height: '2.25rem',
    padding: `0 ${spacing[3]}`,
    fontSize: '0.875rem',
    color: colors.foreground,
    backgroundColor: colors.muted,
    border: '1px solid transparent',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    outline: 'none',
  }),

  grid: styles.class('grid', {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: spacing[6],
  }),

  featureCard: styles.class('feature-card', {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
    padding: spacing[6],
    backgroundColor: colors.card,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: borderRadius.lg,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    '&:hover': {
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    },
  }),

  featureIcon: styles.create(
    'feature-icon',
    {
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: borderRadius.md,
      backgroundColor: colors.muted,
      color: colors.foreground,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.875rem',
      fontWeight: '600',
    },
    {
      accent: {
        backgroundColor: colors.primary,
        color: colors.primaryForeground,
      },
      success: {
        backgroundColor: 'hsl(142.1 76.2% 36.3%)',
        color: 'white',
      },
    },
  ),

  featureTitle: styles.class('feature-title', {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.foreground,
    margin: 0,
  }),

  featureDescription: styles.class('feature-description', {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    lineHeight: 1.6,
    margin: 0,
  }),

  codeBlock: styles.class('code', {
    padding: spacing[4],
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
    fontSize: fontSize.sm,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    overflow: 'auto',
    color: colors.foreground,
    border: `1px solid ${colors.border}`,
  }),

  footer: styles.class('footer', {
    padding: `${spacing[12]} 0`,
    borderTop: `1px solid ${colors.border}`,
    marginTop: spacing[12],
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  }),
};
