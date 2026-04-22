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
    },
  },
  { layer: 'components' },
);
