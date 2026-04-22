import { designTokens as t } from '@examples/design-system';
import { styles } from './typestyles';

export const doc = styles.component(
  'docs-doc',
  {
    root: {
      flex: 1,
      minWidth: 0,
    },
    eyebrowRow: {
      marginBottom: t.space[2],
    },
    /** Mono kicker above H1 surfacing the parent navigation category (e.g. CORE CONCEPTS —). */
    kicker: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: t.space[2],
      margin: 0,
      marginBottom: t.space[3],
      fontFamily: t.fontFamily.mono,
      fontSize: t.fontSize.xs,
      fontWeight: t.fontWeight.bold,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: t.color.text.secondary,
    },
    kickerDot: {
      width: '6px',
      height: '6px',
      backgroundColor: t.color.accent.default,
    },
    title: {
      fontFamily: t.fontFamily.display,
      fontStyle: 'italic',
      fontSize: 'clamp(2rem, 2.2vw + 1.25rem, 2.75rem)',
      fontWeight: t.fontWeight.bold,
      marginTop: 0,
      marginBottom: t.space[3],
      color: t.color.text.primary,
      letterSpacing: '-0.025em',
      lineHeight: 1.1,
      textWrap: 'balance',
    },
    description: {
      fontSize: t.fontSize.lg,
      color: t.color.text.secondary,
      marginTop: 0,
      marginBottom: t.space[6],
      lineHeight: t.lineHeight.relaxed,
      maxWidth: '60ch',
      textWrap: 'pretty',
    },
    /**
     * Component-specific layer over `proseContent.root`. Prose (link, inline code, table, blockquote)
     * styling lives exclusively in `proseContent` so there's a single source of truth. This file
     * only resets highlighted code tokens inside fenced blocks so the inline-code prose treatment
     * doesn't bleed into `hljs` spans.
     */
    content: {
      '& [data-codeblock] code': {
        fontFamily: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        color: 'inherit',
        backgroundColor: 'transparent',
        padding: 0,
        borderRadius: 0,
        border: 'none',
      },
      /** Install tab group (`expandInstallTabGroups`) — tab rail + stacked code blocks */
      '& [data-doc-install-tabs]': {
        marginBlock: t.space[6],
      },
      '& .doc-install-tabs-tablist': {
        display: 'flex',
        flexWrap: 'wrap',
        gap: t.space[1],
        padding: t.space[2],
        paddingBottom: t.space[2],
        border: `${t.borderWidth.default} solid ${t.color.border.default}`,
        borderBottom: 'none',
        borderTopLeftRadius: t.radius.lg,
        borderTopRightRadius: t.radius.lg,
        backgroundColor: t.codeBlock.backgroundHeader,
      },
      '& .doc-install-tabs-tab': {
        appearance: 'none',
        margin: 0,
        border: 'none',
        borderRadius: t.radius.md,
        paddingBlock: t.space[1],
        paddingInline: t.space[3],
        fontFamily: t.fontFamily.mono,
        fontSize: t.fontSize.xs,
        fontWeight: t.fontWeight.semibold,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: t.color.text.secondary,
        backgroundColor: 'transparent',
        cursor: 'pointer',
        transition: t.transition.colorShift,
        '&:hover': {
          color: t.color.text.primary,
          backgroundColor: t.color.background.subtle,
        },
      },
      '& .doc-install-tabs-tab[aria-selected="true"]': {
        color: t.color.text.primary,
        backgroundColor: t.color.background.default,
        boxShadow: t.shadow.sm,
      },
      '& [data-doc-install-tabs] [data-codeblock]': {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      '& .doc-install-tabs-panels': {
        position: 'relative',
      },
      '& .doc-install-tabs-panelwrap[hidden]': {
        display: 'none',
      },
    },
  },
  { layer: 'components' },
);
