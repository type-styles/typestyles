import { designTokens as t } from '@examples/design-system';
import { docsTokens as dt, styles } from './typestyles';

const belowTocBp = '@media (max-width: 1023px)';
const tocBp = '@media (min-width: 1024px)';

export const toc = styles.component('docs-toc', {
  nav: {
    fontFamily: t.fontFamily.sans,
  },
  title: {
    margin: `0 0 ${t.space[2]}`,
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: t.color.text.placeholder,
    [belowTocBp]: {
      display: 'none',
    },
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    margin: 0,
    marginBottom: dt.size.borderThin,
  },
  link: {
    display: 'block',
    fontSize: t.fontSize.sm,
    lineHeight: 1.35,
    color: t.color.text.secondary,
    textDecoration: 'none',
    padding: `4px ${t.space[2]}`,
    borderLeft: '2px solid transparent',
    transition: 'color 0.12s ease, background-color 0.12s ease, border-color 0.12s ease',
    '&:hover': {
      color: t.color.text.primary,
      backgroundColor: t.color.background.subtle,
    },
    '&[aria-current="location"]': {
      color: t.color.accent.default,
      fontWeight: t.fontWeight.medium,
      backgroundColor: t.color.accent.subtle,
      borderLeftColor: t.color.accent.default,
      '&:hover': {
        color: t.color.accent.default,
        backgroundColor: t.color.accent.subtle,
      },
    },
  },
  root: {
    marginBottom: t.space[5],
    border: `1px solid ${t.color.border.default}`,
    borderRadius: t.radius.md,
    backgroundColor: t.color.background.subtle,
    overflow: 'hidden',
    position: 'sticky',
    top: dt.size.tocStickyTop,
    zIndex: 20,
    [tocBp]: {
      marginBottom: 0,
      border: 'none',
      borderRadius: 0,
      backgroundColor: 'transparent',
      overflow: 'visible',
      position: 'static',
      top: 'auto',
      zIndex: 'auto',
    },
  },
  details: {
    margin: 0,
  },
  summary: {
    listStyle: 'none',
    cursor: 'pointer',
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    color: t.color.text.primary,
    padding: `${t.space[2]} ${t.space[4]}`,
    '&::-webkit-details-marker': {
      display: 'none',
    },
    [tocBp]: {
      display: 'none',
    },
  },
  panel: {
    padding: `0 ${t.space[4]} ${t.space[4]}`,
    borderTop: `1px solid ${t.color.border.default}`,
    [tocBp]: {
      padding: 0,
      borderTop: 'none',
    },
  },
});
