import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

const bp = '@media (max-width: 768px)';

/**
 * Long-form / markdown prose primitives: blockquote, kbd, inline badges, tables, dividers,
 * heading permalink anchors, lists, and a responsive vertical rhythm.
 *
 * Apply `proseContent('root')` on the wrapper around rendered markdown HTML.
 */
export const proseContent = styles.create('docs-prose', {
  root: {
    fontSize: t.font.sizeMd,
    lineHeight: 1.75,
    color: t.color.text,
    '& h1': {
      fontSize: '28px',
      fontWeight: t.font.weightSemibold,
      letterSpacing: '-0.02em',
      lineHeight: 1.25,
      marginTop: 0,
      marginBottom: t.space.md,
      color: t.color.text,
      [bp]: {
        fontSize: '24px',
        marginBottom: t.space.sm,
      },
    },
    '& h2': {
      fontSize: '22px',
      fontWeight: t.font.weightSemibold,
      letterSpacing: '-0.015em',
      lineHeight: 1.3,
      marginTop: t.space.xxl,
      marginBottom: t.space.sm,
      color: t.color.text,
      [bp]: {
        fontSize: '19px',
        marginTop: t.space.xl,
      },
    },
    '& h3': {
      fontSize: '17px',
      fontWeight: t.font.weightSemibold,
      lineHeight: 1.35,
      marginTop: t.space.lg,
      marginBottom: t.space.xs,
      color: t.color.text,
      [bp]: {
        marginTop: t.space.md,
      },
    },
    '& h4, & h5, & h6': {
      fontSize: t.font.sizeMd,
      fontWeight: t.font.weightSemibold,
      marginTop: t.space.lg,
      marginBottom: t.space.xs,
      color: t.color.text,
      [bp]: {
        marginTop: t.space.md,
      },
    },
    '& h2, & h3, & h4, & h5, & h6': {
      position: 'relative',
    },
    '& p': {
      marginBottom: t.space.md,
      [bp]: {
        marginBottom: t.space.sm,
      },
    },
    '& ul, & ol': {
      marginBottom: t.space.md,
      paddingLeft: t.space.lg,
      [bp]: {
        marginBottom: t.space.sm,
        paddingLeft: t.space.md,
      },
    },
    '& li': {
      marginBottom: t.space.xs,
    },
    '& a': {
      color: t.color.accent,
      textDecoration: 'none',
      fontWeight: t.font.weightMedium,
      transition: 'color 120ms ease, text-decoration-color 120ms ease',
      '&:hover': {
        color: t.color.accentHover,
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      },
      '&:focus-visible': {
        outline: `2px solid ${t.color.focusRing}`,
        outlineOffset: '2px',
        borderRadius: t.radius.sm,
      },
    },
    '& code': {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: t.font.sizeSm,
      backgroundColor: t.color.surfaceMuted,
      padding: `2px ${t.space.sm}`,
      borderRadius: t.radius.sm,
      border: `1px solid ${t.color.border}`,
    },
    '& pre': {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: t.font.sizeSm,
      lineHeight: 1.6,
      backgroundColor: t.color.surfaceMuted,
      padding: t.space.md,
      borderRadius: t.radius.md,
      border: `1px solid ${t.color.border}`,
      overflow: 'auto',
      marginBottom: t.space.md,
      [bp]: {
        padding: t.space.sm,
        marginBottom: t.space.sm,
      },
    },
    '& pre code': {
      backgroundColor: 'transparent',
      padding: 0,
      border: 'none',
      fontSize: 'inherit',
    },
    '& blockquote': {
      margin: `${t.space.lg} 0`,
      padding: `${t.space.md} ${t.space.lg}`,
      borderLeft: `3px solid ${t.color.accent}`,
      borderRadius: t.radius.md,
      backgroundColor: t.color.surfaceMuted,
      color: t.color.textMuted,
      fontStyle: 'normal',
      [bp]: {
        margin: `${t.space.md} 0`,
        padding: `${t.space.sm} ${t.space.md}`,
      },
    },
    '& blockquote p': {
      marginBottom: t.space.sm,
    },
    '& blockquote p:last-child': {
      marginBottom: 0,
    },
    '& kbd': {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: t.font.sizeSm,
      fontWeight: t.font.weightMedium,
      padding: `2px ${t.space.sm}`,
      borderRadius: t.radius.sm,
      border: `1px solid ${t.color.borderStrong}`,
      backgroundColor: t.color.surface,
      boxShadow: `0 1px 0 ${t.color.border}`,
      whiteSpace: 'nowrap',
    },
    '& [data-docs-badge]': {
      display: 'inline-flex',
      alignItems: 'center',
      boxSizing: 'border-box',
      fontSize: t.font.sizeSm,
      fontWeight: t.font.weightMedium,
      lineHeight: 1.2,
      padding: `2px ${t.space.sm}`,
      borderRadius: t.radius.full,
      border: `1px solid ${t.color.border}`,
      backgroundColor: t.color.surfaceMuted,
      color: t.color.text,
      verticalAlign: '0.08em',
    },
    '& [data-docs-badge][data-docs-badge-tone="success"]': {
      borderColor: `color-mix(in srgb, ${t.color.success} 45%, ${t.color.border})`,
      backgroundColor: `color-mix(in srgb, ${t.color.success} 14%, ${t.color.surface})`,
      color: `color-mix(in srgb, ${t.color.success} 85%, ${t.color.text})`,
    },
    '& [data-docs-badge][data-docs-badge-tone="warning"]': {
      borderColor: `color-mix(in srgb, ${t.color.warning} 45%, ${t.color.border})`,
      backgroundColor: `color-mix(in srgb, ${t.color.warning} 16%, ${t.color.surface})`,
      color: `color-mix(in srgb, ${t.color.warning} 75%, ${t.color.text})`,
    },
    '& [data-docs-badge][data-docs-badge-tone="danger"]': {
      borderColor: `color-mix(in srgb, ${t.color.danger} 45%, ${t.color.border})`,
      backgroundColor: `color-mix(in srgb, ${t.color.danger} 12%, ${t.color.surface})`,
      color: `color-mix(in srgb, ${t.color.danger} 80%, ${t.color.text})`,
    },
    '& [data-docs-badge][data-docs-badge-tone="info"]': {
      borderColor: `color-mix(in srgb, ${t.color.accent} 45%, ${t.color.border})`,
      backgroundColor: `color-mix(in srgb, ${t.color.accent} 12%, ${t.color.surface})`,
      color: `color-mix(in srgb, ${t.color.accent} 75%, ${t.color.text})`,
    },
    '& hr': {
      border: 'none',
      borderTop: `1px solid ${t.color.border}`,
      margin: `${t.space.xl} 0`,
      [bp]: {
        margin: `${t.space.lg} 0`,
      },
    },
    '& table': {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: t.space.md,
      fontSize: t.font.sizeSm,
    },
    '& thead': {
      borderBottom: `2px solid ${t.color.border}`,
    },
    '& th, & td': {
      textAlign: 'left',
      padding: `${t.space.sm} ${t.space.md}`,
      borderBottom: `1px solid ${t.color.border}`,
      verticalAlign: 'top',
    },
    '& th': {
      fontWeight: t.font.weightSemibold,
      fontSize: t.font.sizeSm,
      color: t.color.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    '& tr:last-child td': {
      borderBottom: 'none',
    },
    '& caption': {
      captionSide: 'bottom',
      paddingTop: t.space.sm,
      fontSize: t.font.sizeSm,
      color: t.color.textMuted,
      textAlign: 'left',
    },
    '& [data-prose-heading-anchor]': {
      marginLeft: t.space.sm,
      fontWeight: t.font.weightMedium,
      color: t.color.textMuted,
      textDecoration: 'none',
      opacity: 0,
      transition: 'opacity 120ms ease, color 120ms ease',
    },
    '& [data-prose-heading-anchor]::before': {
      content: '"#"',
      fontSize: '0.85em',
    },
    '& :is(h1, h2, h3, h4, h5, h6):hover [data-prose-heading-anchor]': {
      opacity: 1,
    },
    '& [data-prose-heading-anchor]:focus-visible': {
      opacity: 1,
      outline: `2px solid ${t.color.focusRing}`,
      outlineOffset: '2px',
      borderRadius: t.radius.sm,
    },
  },
  /** Scroll container for wide GFM tables (wrap HTML manually). */
  tableWrap: {
    overflowX: 'auto',
    marginBottom: t.space.md,
    WebkitOverflowScrolling: 'touch',
  },
  /** Applied with `data-prose-heading-anchor`; visual rules live on `root`. */
  headingAnchor: {},
});
