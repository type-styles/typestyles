import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const card = styles.create('card', {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: t.space.sm,
    padding: t.space.lg,
    borderRadius: t.radius.md,
    border: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surface,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  title: {
    margin: 0,
    fontSize: t.font.sizeLg,
    fontWeight: t.font.weightSemibold,
    color: t.color.text,
    lineHeight: 1.3,
  },
  body: {
    margin: 0,
    fontSize: t.font.sizeMd,
    color: t.color.textMuted,
    lineHeight: 1.55,
  },
  grid: {
    display: 'grid',
    gap: t.space.lg,
    gridTemplateColumns: '1fr',
    '@media (min-width: 640px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  },
  linkRoot: {
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
    '&:hover': {
      borderColor: t.color.borderStrong,
      boxShadow: t.shadow.sm,
    },
    '&:focus-visible': {
      outline: `2px solid ${t.color.focusRing}`,
      outlineOffset: '2px',
    },
  },
  linkTitle: {
    color: t.color.accent,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  linkDescription: {
    margin: 0,
    fontSize: t.font.sizeMd,
    color: t.color.textMuted,
    lineHeight: 1.55,
  },
  linkHint: {
    marginTop: 'auto',
    paddingTop: t.space.sm,
    fontSize: t.font.sizeSm,
    fontWeight: t.font.weightMedium,
    color: t.color.textMuted,
  },
});
