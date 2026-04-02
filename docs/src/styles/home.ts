import { designTokens as t } from '@examples/design-system';
import { styles } from 'typestyles';

const bp = '@media (max-width: 768px)';

export const home = styles.component('docs-home', {
  hero: {
    paddingTop: t.space[8],
    paddingBottom: t.space[8],
  },
  title: {
    fontSize: '44px',
    fontWeight: t.fontWeight.bold,
    letterSpacing: '-0.035em',
    lineHeight: 1.15,
    marginBottom: t.space[4],
    color: t.color.text.primary,
    [bp]: {
      fontSize: '32px',
    },
  },
  titleAccent: {
    color: t.color.accent.default,
  },
  subtitle: {
    fontSize: '18px',
    color: t.color.text.secondary,
    lineHeight: t.lineHeight.relaxed,
    maxWidth: '540px',
    marginBottom: t.space[6],
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: t.space[4],
  },
  cta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[2],
    fontSize: '15px',
    fontWeight: t.fontWeight.medium,
    fontFamily: t.fontFamily.sans,
    color: t.color.text.onAccent,
    backgroundColor: t.color.accent.default,
    padding: `10px ${t.space[5]}`,
    borderRadius: t.radius.md,
    textDecoration: 'none',
    transition: 'background-color 0.15s ease',
    border: 'none',
    cursor: 'pointer',
    '&:hover': { backgroundColor: t.color.accent.hover },
  },
  ctaSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[2],
    fontSize: '15px',
    fontWeight: t.fontWeight.medium,
    fontFamily: t.fontFamily.sans,
    color: t.color.text.primary,
    backgroundColor: 'transparent',
    padding: `10px ${t.space[5]}`,
    borderRadius: t.radius.md,
    textDecoration: 'none',
    border: `1px solid ${t.color.border.default}`,
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
    cursor: 'pointer',
    '&:hover': {
      borderColor: t.color.text.secondary,
      backgroundColor: t.color.background.subtle,
    },
  },
});
