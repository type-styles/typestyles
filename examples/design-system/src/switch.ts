import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const switchStyles = styles.create('switch', {
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space.sm,
    cursor: 'pointer',
  },
  track: {
    position: 'relative',
    width: '40px',
    height: '24px',
    borderRadius: t.radius.full,
    backgroundColor: t.color.border,
    transition: 'background-color 140ms ease',
    '&[data-selected]': {
      backgroundColor: t.color.accent,
    },
  },
  thumb: {
    position: 'absolute',
    top: '3px',
    left: '3px',
    width: '18px',
    height: '18px',
    borderRadius: t.radius.full,
    backgroundColor: t.color.surface,
    transition: 'transform 140ms ease',
    '&[data-selected]': {
      transform: 'translateX(16px)',
    },
  },
  label: {
    fontSize: t.font.sizeMd,
  },
});

