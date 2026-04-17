import { designTokens as t } from '@examples/design-system';
import { styles } from './typestyles';

const bp = '@media (max-width: 768px)';

const heroTitleSize = `calc(${t.space[8]} + ${t.space[2]})`;

export const home = styles.component(
  'docs-home',
  {
    hero: {
      paddingTop: t.space[12],
      paddingBottom: t.space[8],
      [bp]: {
        paddingTop: t.space[8],
      },
    },
    title: {
      fontSize: heroTitleSize,
      fontWeight: t.fontWeight.bold,
      letterSpacing: '-0.035em',
      lineHeight: 1.1,
      marginBottom: t.space[4],
      color: t.color.text.primary,
      [bp]: {
        fontSize: t.space[6],
      },
    },
    titleAccent: {
      backgroundColor: t.color.accent.default,
      color: t.color.text.onAccent,
      padding: `0 ${t.space[2]}`,
      display: 'inline',
      boxDecorationBreak: 'clone',
    },
    subtitle: {
      fontSize: t.fontSize.xl,
      color: t.color.text.secondary,
      lineHeight: t.lineHeight.relaxed,
      maxWidth: '33.75rem',
      marginBottom: t.space[6],
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: t.space[4],
      marginBottom: t.space[8],
      [bp]: {
        flexDirection: 'column',
        alignItems: 'flex-start',
      },
    },
    cta: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: t.space[2],
      fontSize: t.fontSize.lg,
      fontWeight: t.fontWeight.bold,
      fontFamily: t.fontFamily.sans,
      color: t.color.text.onAccent,
      backgroundColor: t.color.accent.default,
      padding: `12px ${t.space[5]}`,
      textDecoration: 'none',
      border: `${t.borderWidth.default} solid ${t.color.border.default}`,
      boxShadow: t.shadow.md,
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      '&:hover': {
        transform: 'translate(2px, 2px)',
        boxShadow: t.shadow.xs,
      },
      '&:active': {
        transform: 'translate(4px, 4px)',
        boxShadow: 'none',
      },
    },
    ctaSecondary: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: t.space[2],
      fontSize: t.fontSize.lg,
      fontWeight: t.fontWeight.bold,
      fontFamily: t.fontFamily.sans,
      color: t.color.text.primary,
      backgroundColor: t.color.background.surface,
      padding: `12px ${t.space[5]}`,
      textDecoration: 'none',
      border: `${t.borderWidth.default} solid ${t.color.border.default}`,
      boxShadow: t.shadow.md,
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      '&:hover': {
        transform: 'translate(2px, 2px)',
        boxShadow: t.shadow.xs,
      },
      '&:active': {
        transform: 'translate(4px, 4px)',
        boxShadow: 'none',
      },
    },
    /** Max width for the homepage sample (same `Code.astro` + `codeBlock` recipe as markdown docs). */
    codeExampleWrap: {
      maxWidth: '520px',
    },
  },
  { layer: 'components' },
);
