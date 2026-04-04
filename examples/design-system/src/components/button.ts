import { styles } from '../runtime';
import { designTokens as t } from '../tokens';

export const button = styles.component('button', {
  base: {
    appearance: 'none',
    border: `1px solid ${t.color.border.default}`,
    borderRadius: t.radius.md,
    backgroundColor: t.color.background.surface,
    color: t.color.text.primary,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.medium,
    padding: `${t.space[2]} ${t.space[4]}`,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.space[2],
    transition: 'background-color 140ms ease, border-color 140ms ease, transform 80ms ease',
    '&:hover': {
      borderColor: t.color.border.strong,
      backgroundColor: t.color.background.subtle,
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
    '&:focus-visible': {
      outline: `2px solid ${t.color.border.focus}`,
      outlineOffset: '2px',
    },
  },
  variants: {
    intent: {
      primary: {
        borderColor: t.color.accent.default,
        backgroundColor: t.color.accent.default,
        color: t.color.text.onAccent,
        '&:hover': {
          backgroundColor: t.color.accent.hover,
          borderColor: t.color.accent.hover,
        },
      },
      secondary: {
        backgroundColor: t.color.background.surface,
        borderColor: t.color.border.default,
        color: t.color.text.primary,
        '&:hover': {
          borderColor: t.color.border.strong,
          backgroundColor: t.color.background.subtle,
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: t.color.text.primary,
        '&:hover': {
          backgroundColor: t.color.background.subtle,
        },
      },
    },
  },
});

export const linkButton = button;
