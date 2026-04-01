import { styles } from 'typestyles';
import { designTokens as t } from '../tokens';

export const checkbox = styles.create('checkbox', {
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[2],
    cursor: 'pointer',
  },
  box: {
    width: '18px',
    height: '18px',
    borderRadius: t.radius.sm,
    border: `1px solid ${t.color.border.strong}`,
    backgroundColor: t.color.background.surface,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: t.fontWeight.semibold,
    color: t.color.text.onAccent,
    '&[data-selected]': {
      backgroundColor: t.color.accent.default,
      borderColor: t.color.accent.default,
    },
  },
  label: {
    fontSize: t.fontSize.md,
  },
});
