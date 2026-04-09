import { designTokens as t } from '@examples/design-system';
import { styles } from './typestyles';

export const skipLink = styles.component('docs-skip', {
  root: {
    position: 'absolute',
    left: t.space[4],
    top: t.space[4],
    zIndex: 10000,
    padding: `${t.space[2]} ${t.space[4]}`,
    backgroundColor: t.color.accent.default,
    color: t.color.text.onAccent,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.bold,
    textDecoration: 'none',
    border: `${t.borderWidth.default} solid #000`,
    boxShadow: t.shadow.md,
    transform: 'translateY(-160%)',
    '&:focus': {
      transform: 'translateY(0)',
      outline: `${t.borderWidth.thin} solid ${t.color.accent.default}`,
      outlineOffset: '2px',
    },
  },
});
