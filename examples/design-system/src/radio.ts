import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const radio = styles.create('radio', {
  group: {
    display: 'grid',
    gap: t.space.xs,
  },
  item: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space.sm,
    cursor: 'pointer',
  },
  control: {
    width: '18px',
    height: '18px',
    borderRadius: t.radius.full,
    border: `1px solid ${t.color.borderStrong}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&::before': {
      content: '""',
      width: '8px',
      height: '8px',
      borderRadius: t.radius.full,
      backgroundColor: 'transparent',
      transition: 'background-color 120ms ease',
    },
    '&[data-selected]::before': {
      backgroundColor: t.color.accent,
    },
  },
  label: {
    fontSize: t.font.sizeMd,
  },
  groupLabel: {
    fontSize: t.font.sizeMd,
    fontWeight: t.font.weightMedium,
    color: t.color.text,
  },
});

