import { styles } from 'typestyles';
import { designTokens as t } from '../tokens';

export const link = styles.class('link', {
  color: t.color.accent.default,
  fontSize: t.fontSize.md,
  textDecoration: 'none',
  fontWeight: t.fontWeight.medium,
  '&:hover': {
    textDecoration: 'underline',
  },
  '&:focus-visible': {
    outline: `2px solid ${t.color.border.focus}`,
    outlineOffset: '2px',
    borderRadius: t.radius.sm,
  },
});

