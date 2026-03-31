import { designTokens as t } from '@examples/design-system';
import { styles } from 'typestyles';

export const doc = styles.create('docs-doc', {
  root: {
    flex: 1,
    minWidth: 0,
  },
  eyebrowRow: {
    marginBottom: t.space[2],
  },
  title: {
    fontSize: '32px',
    fontWeight: t.fontWeight.bold,
    marginBottom: t.space[2],
    color: t.color.text.primary,
    letterSpacing: '-0.025em',
    lineHeight: t.lineHeight.tight,
  },
  description: {
    fontSize: t.fontSize.lg,
    color: t.color.text.secondary,
    marginBottom: t.space[6],
    lineHeight: t.lineHeight.relaxed,
  },
  content: {
    '& a:not([data-prose-heading-anchor]):not([data-alert-action])': {
      color: t.color.accent.default,
      textDecoration: 'none',
      transition: 'color 0.12s ease',
      '&:hover': {
        color: t.color.accent.hover,
        textDecoration: 'underline',
      },
    },
    '& a[data-prose-heading-anchor]': {
      color: t.color.text.secondary,
      fontWeight: t.fontWeight.medium,
      '&:hover': {
        color: t.color.accent.default,
      },
    },
    '& a[data-alert-action]': {
      color: 'inherit',
      fontWeight: 'inherit',
      textDecoration: 'underline',
      '&:hover': {
        color: 'inherit',
        textDecoration: 'none',
      },
    },
    '& code': {
      fontFamily: t.fontFamily.mono,
      fontSize: t.fontSize.sm,
      backgroundColor: t.color.background.subtle,
      padding: `2px ${t.space[1]}`,
      borderRadius: t.radius.sm,
      border: `1px solid ${t.color.border.default}`,
    },
    '& pre:not([data-codeblock-pre])': {
      fontFamily: t.fontFamily.mono,
      fontSize: t.fontSize.sm,
      lineHeight: 1.6,
      backgroundColor: t.color.background.subtle,
      padding: t.space[4],
      borderRadius: t.radius.md,
      border: `1px solid ${t.color.border.default}`,
      overflow: 'auto',
      marginBottom: t.space[4],
    },
    '& pre code': {
      backgroundColor: 'transparent',
      padding: 0,
      border: 'none',
    },
  },
});
