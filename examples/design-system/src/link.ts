import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const link = styles.class('link', {
  color: t.color.accent,
  fontSize: t.font.sizeMd,
  textDecoration: 'none',
  fontWeight: t.font.weightMedium,
  '&:hover': {
    textDecoration: 'underline',
  },
  '&:focus-visible': {
    outline: `2px solid ${t.color.focusRing}`,
    outlineOffset: '2px',
    borderRadius: t.radius.sm,
  },
});

