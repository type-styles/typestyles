import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const select = styles.create('select', {
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
  trigger: {
    textAlign: 'left',
    border: `1px solid ${t.color.border}`,
    borderRadius: t.radius.md,
    padding: `${t.space.sm} ${t.space.md}`,
    backgroundColor: t.color.surface,
    color: t.color.text,
    fontSize: t.font.sizeMd,
    cursor: 'pointer',
    '&:focus-visible': {
      outline: `2px solid ${t.color.focusRing}`,
      outlineOffset: '1px',
      borderColor: t.color.focusRing,
    },
  },
  popover: {
    border: `1px solid ${t.color.border}`,
    borderRadius: t.radius.md,
    backgroundColor: t.color.surface,
    boxShadow: t.shadow.md,
    padding: t.space.xs,
  },
  item: {
    fontSize: t.font.sizeMd,
    padding: `${t.space.sm} ${t.space.md}`,
    borderRadius: t.radius.sm,
    cursor: 'pointer',
    '&[data-focused]': {
      backgroundColor: t.color.surfaceMuted,
    },
    '&[data-selected]': {
      color: t.color.accent,
      fontWeight: t.font.weightSemibold,
    },
  },
});

