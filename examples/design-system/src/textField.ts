import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const textField = styles.create('text-field', {
  root: {
    display: 'grid',
    gap: t.space.xs,
    minWidth: '240px',
  },
  label: {
    fontSize: t.font.sizeMd,
    fontWeight: t.font.weightMedium,
    color: t.color.text,
  },
  input: {
    border: `1px solid ${t.color.border}`,
    borderRadius: t.radius.md,
    padding: `${t.space.sm} ${t.space.md}`,
    fontSize: t.font.sizeMd,
    backgroundColor: t.color.surface,
    color: t.color.text,
    '&:focus': {
      outline: `2px solid ${t.color.focusRing}`,
      outlineOffset: '1px',
      borderColor: t.color.focusRing,
    },
    '&::placeholder': {
      color: t.color.textMuted,
    },
  },
  description: {
    fontSize: t.font.sizeSm,
    color: t.color.textMuted,
  },
  error: {
    fontSize: t.font.sizeSm,
    color: t.color.danger,
  },
});

