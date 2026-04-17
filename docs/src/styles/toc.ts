import { designTokens as t } from '@examples/design-system';
import { docsNavLinkInteraction } from './docsNavLink';
import { styles } from './typestyles';

const belowTocBp = '@media (max-width: 1023px)';
const tocBp = '@media (min-width: 1024px)';

export const toc = styles.component(
  'docs-toc',
  {
    nav: {
      fontFamily: t.fontFamily.sans,
    },
    title: {
      margin: `0 0 ${t.space[2]}`,
      fontSize: t.fontSize.xs,
      fontWeight: t.fontWeight.bold,
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
      marginBottom: t.borderWidth.thin,
    },
    link: {
      display: 'block',
      fontSize: t.fontSize.sm,
      lineHeight: 1.35,
      color: t.color.text.secondary,
      textDecoration: 'none',
      padding: `4px ${t.space[2]}`,
      paddingLeft: `calc(${t.space[2]} + var(--docs-toc-depth, 0px))`,
      borderLeft: `${t.borderWidth.default} solid transparent`,
      '&:hover': { ...docsNavLinkInteraction.hover },
      '&[aria-current="location"]': {
        position: 'relative',
        zIndex: 1,
        ...docsNavLinkInteraction.current,
        borderLeftStyle: 'solid',
        borderLeftColor: t.color.accent.default,
        borderLeftWidth: t.borderWidth.thick,
        [belowTocBp]: {
          /** Pull to the TOC card’s left inner edge so the accent bar shares one stroke with the outer border. */
          marginLeft: `calc(-1 * (${t.space[4]} + ${t.borderWidth.default}))`,
          paddingLeft: `calc(${t.space[4]} + ${t.space[2]} - ${t.borderWidth.default} + (${t.borderWidth.thick} - ${t.borderWidth.default}) * 2 + var(--docs-toc-depth, 0px))`,
        },
        [tocBp]: {
          /** Same overlap against the desktop column rule (`toc.root` border-left). */
          marginLeft: `calc(-1 * (${t.space[4]} + ${t.borderWidth.thick}))`,
          paddingLeft: `calc(${t.space[4]} + ${t.space[2]} + ${t.borderWidth.default} + var(--docs-toc-depth, 0px))`,
        },
        '&:hover': { ...docsNavLinkInteraction.hover },
      },
    },
    root: {
      marginBottom: t.space[5],
      border: `${t.borderWidth.default} solid ${t.color.border.default}`,
      backgroundColor: t.color.background.subtle,
      overflow: 'hidden',
      position: 'sticky',
      top: t.space[12],
      zIndex: 20,
      [tocBp]: {
        marginBottom: 0,
        border: 'none',
        borderLeft: `${t.borderWidth.thick} solid ${t.color.border.strong}`,
        backgroundColor: 'transparent',
        overflow: 'visible',
        position: 'static',
        top: 'auto',
        zIndex: 'auto',
        paddingLeft: t.space[4],
      },
    },
    details: {
      margin: 0,
    },
    summary: {
      listStyle: 'none',
      cursor: 'pointer',
      fontSize: t.fontSize.sm,
      fontWeight: t.fontWeight.bold,
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
      borderTop: `${t.borderWidth.default} solid ${t.color.border.default}`,
      [tocBp]: {
        padding: 0,
        borderTop: 'none',
      },
    },
  },
  { layer: 'components' },
);
