import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const checkbox = styles.create('checkbox', {
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space.sm,
    cursor: 'pointer',
  },
  box: {
    width: '18px',
    height: '18px',
    borderRadius: t.radius.sm,
    border: `1px solid ${t.color.borderStrong}`,
    backgroundColor: t.color.surface,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: t.font.weightSemibold,
    color: t.color.accentForeground,
    '&[data-selected]': {
      backgroundColor: t.color.accent,
      borderColor: t.color.accent,
    },
  },
  label: {
    fontSize: t.font.sizeMd,
  },
});

