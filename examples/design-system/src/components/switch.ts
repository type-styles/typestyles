import { styles } from 'typestyles';
import { designTokens as t } from '../tokens';

export const switchStyles = styles.component('switch', {
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[2],
    cursor: 'pointer',
  },
  track: {
    position: 'relative',
    width: '40px',
    height: '24px',
    borderRadius: t.radius.full,
    backgroundColor: t.color.border.default,
    transition: 'background-color 140ms ease',
    '&[data-selected]': {
      backgroundColor: t.color.accent.default,
    },
  },
  thumb: {
    position: 'absolute',
    top: '3px',
    left: '3px',
    width: '18px',
    height: '18px',
    borderRadius: t.radius.full,
    backgroundColor: t.color.background.surface,
    transition: 'transform 140ms ease',
    '&[data-selected]': {
      transform: 'translateX(16px)',
    },
  },
  label: {
    fontSize: t.fontSize.md,
  },
});
