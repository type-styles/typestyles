import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const tabs = styles.create('tabs', {
  root: {
    display: 'grid',
    gap: t.space.md,
  },
  list: {
    display: 'inline-flex',
    gap: t.space.xs,
    borderBottom: `1px solid ${t.color.border}`,
  },
  tab: {
    border: 'none',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
    padding: `${t.space.sm} ${t.space.md}`,
    color: t.color.textMuted,
    cursor: 'pointer',
    fontSize: t.font.sizeMd,
    '&[data-selected]': {
      color: t.color.text,
      borderBottomColor: t.color.accent,
      fontWeight: t.font.weightSemibold,
    },
  },
  panel: {
    padding: t.space.md,
    backgroundColor: t.color.surfaceMuted,
    borderRadius: t.radius.md,
    border: `1px solid ${t.color.border}`,
  },
});

