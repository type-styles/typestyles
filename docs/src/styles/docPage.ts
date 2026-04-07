import { designTokens as t } from '@examples/design-system';
import { styles } from './typestyles';

export const docPage = styles.component('docs-doc-page', {
  footer: {
    marginTop: t.space[5],
    paddingTop: t.space[4],
    borderTop: `1px solid ${t.color.border.default}`,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${t.space[4]} ${t.space[5]}`,
    fontSize: t.fontSize.sm,
    color: t.color.text.secondary,
  },
  editLink: {
    color: t.color.accent.default,
    textDecoration: 'none',
    fontWeight: t.fontWeight.medium,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: t.space[6],
    paddingTop: t.space[5],
    borderTop: `1px solid ${t.color.border.default}`,
    gap: t.space[4],
  },
  paginationLink: {
    fontSize: t.fontSize.md,
    color: t.color.accent.default,
    textDecoration: 'none',
    padding: `${t.space[2]} ${t.space[4]}`,
    borderRadius: t.radius.md,
    border: `1px solid ${t.color.border.default}`,
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    '&:hover': {
      backgroundColor: t.color.background.subtle,
      borderColor: t.color.accent.default,
    },
  },
});
