import { designTokens as t } from '@examples/design-system';
import { styles } from 'typestyles';

export const skipLink = styles.component('docs-skip', {
  root: {
    position: 'absolute',
    left: t.space[4],
    top: t.space[4],
    zIndex: 10000,
    padding: `${t.space[2]} ${t.space[4]}`,
    backgroundColor: t.color.accent.default,
    color: t.color.text.onAccent,
    borderRadius: t.radius.md,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
    textDecoration: 'none',
    transform: 'translateY(-160%)',
    transition: 'transform 0.15s ease',
    '&:focus': {
      transform: 'translateY(0)',
      outline: `2px solid ${t.color.accent.default}`,
      outlineOffset: '2px',
    },
  },
});
