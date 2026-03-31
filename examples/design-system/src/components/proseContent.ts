import { styles } from 'typestyles';
import { designTokens as t } from '../tokens';

const bp = '@media (max-width: 768px)';

/**
 * Long-form / markdown prose primitives: blockquote, kbd, inline badges, tables, dividers,
 * heading permalink anchors, lists, and a responsive vertical rhythm.
 *
 * Apply `proseContent('root')` on the wrapper around rendered markdown HTML.
 */
export const proseContent = styles.create('docs-prose', {
  root: {
    fontSize: t.fontSize.md,
    lineHeight: 1.75,
    color: t.color.text.primary,
    '& h1': {
      fontSize: '28px',
      fontWeight: t.fontWeight.semibold,
      letterSpacing: '-0.02em',
      lineHeight: 1.25,
      marginTop: 0,
      marginBottom: t.space[3],
      color: t.color.text.primary,
      [bp]: {
        fontSize: '24px',
        marginBottom: t.space[2],
      },
    },
    '& h2': {
      fontSize: '22px',
      fontWeight: t.fontWeight.semibold,
      letterSpacing: '-0.015em',
      lineHeight: 1.3,
      marginTop: t.space[6],
      marginBottom: t.space[2],
      color: t.color.text.primary,
      [bp]: {
        fontSize: '19px',
        marginTop: t.space[5],
      },
    },
    '& h3': {
      fontSize: '17px',
      fontWeight: t.fontWeight.semibold,
      lineHeight: 1.35,
      marginTop: t.space[4],
      marginBottom: t.space[1],
      color: t.color.text.primary,
      [bp]: {
        marginTop: t.space[3],
      },
    },
    '& h4, & h5, & h6': {
      fontSize: t.fontSize.md,
      fontWeight: t.fontWeight.semibold,
      marginTop: t.space[4],
      marginBottom: t.space[1],
      color: t.color.text.primary,
      [bp]: {
        marginTop: t.space[3],
      },
    },
    '& h2, & h3, & h4, & h5, & h6': {
      position: 'relative',
    },
    '& p': {
      marginBottom: t.space[3],
      [bp]: {
        marginBottom: t.space[2],
      },
    },
    '& ul, & ol': {
      marginBottom: t.space[3],
      paddingLeft: t.space[4],
      [bp]: {
        marginBottom: t.space[2],
        paddingLeft: t.space[3],
      },
    },
    '& li': {
      marginBottom: t.space[1],
    },
    '& a': {
      color: t.color.accent.default,
      textDecoration: 'none',
      fontWeight: t.fontWeight.medium,
      transition: t.transition.colorShift,
      '&:hover': {
        color: t.color.accent.hover,
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      },
      '&:focus-visible': {
        outline: `2px solid ${t.color.border.focus}`,
        outlineOffset: '2px',
        borderRadius: t.radius.sm,
      },
    },
    '& code': {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: t.fontSize.sm,
      backgroundColor: t.color.background.subtle,
      padding: `2px ${t.space[2]}`,
      borderRadius: t.radius.sm,
      border: `1px solid ${t.color.border.default}`,
    },
    '& pre:not([data-codeblock-pre])': {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: t.fontSize.sm,
      lineHeight: 1.6,
      backgroundColor: t.color.background.subtle,
      padding: t.space[3],
      borderRadius: t.radius.md,
      border: `1px solid ${t.color.border.default}`,
      overflow: 'auto',
      marginBottom: t.space[3],
      [bp]: {
        padding: t.space[2],
        marginBottom: t.space[2],
      },
    },
    '& pre code': {
      backgroundColor: 'transparent',
      padding: 0,
      border: 'none',
      fontSize: 'inherit',
    },
    '& blockquote': {
      margin: `${t.space[4]} 0`,
      padding: `${t.space[3]} ${t.space[4]}`,
      borderLeft: `3px solid ${t.color.accent.default}`,
      borderRadius: t.radius.md,
      backgroundColor: t.color.background.subtle,
      color: t.color.text.secondary,
      fontStyle: 'normal',
      [bp]: {
        margin: `${t.space[3]} 0`,
        padding: `${t.space[2]} ${t.space[3]}`,
      },
    },
    '& blockquote p': {
      marginBottom: t.space[2],
    },
    '& blockquote p:last-child': {
      marginBottom: 0,
    },
    '& kbd': {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: t.fontSize.sm,
      fontWeight: t.fontWeight.medium,
      padding: `2px ${t.space[2]}`,
      borderRadius: t.radius.sm,
      border: `1px solid ${t.color.border.strong}`,
      backgroundColor: t.color.background.surface,
      boxShadow: `0 1px 0 ${t.color.border.default}`,
      whiteSpace: 'nowrap',
    },
    '& [data-docs-badge]': {
      display: 'inline-flex',
      alignItems: 'center',
      boxSizing: 'border-box',
      fontSize: t.fontSize.sm,
      fontWeight: t.fontWeight.medium,
      lineHeight: 1.2,
      padding: `2px ${t.space[2]}`,
      borderRadius: t.radius.full,
      border: `1px solid ${t.color.border.default}`,
      backgroundColor: t.color.background.subtle,
      color: t.color.text.primary,
      verticalAlign: '0.08em',
    },
    '& [data-docs-badge][data-docs-badge-tone="success"]': {
      borderColor: `color-mix(in srgb, ${t.color.success.default} 45%, ${t.color.border.default})`,
      backgroundColor: `color-mix(in srgb, ${t.color.success.default} 14%, ${t.color.background.surface})`,
      color: `color-mix(in srgb, ${t.color.success.default} 85%, ${t.color.text.primary})`,
    },
    '& [data-docs-badge][data-docs-badge-tone="warning"]': {
      borderColor: `color-mix(in srgb, ${t.color.warning.default} 45%, ${t.color.border.default})`,
      backgroundColor: `color-mix(in srgb, ${t.color.warning.default} 16%, ${t.color.background.surface})`,
      color: `color-mix(in srgb, ${t.color.warning.default} 75%, ${t.color.text.primary})`,
    },
    '& [data-docs-badge][data-docs-badge-tone="danger"]': {
      borderColor: `color-mix(in srgb, ${t.color.danger.default} 45%, ${t.color.border.default})`,
      backgroundColor: `color-mix(in srgb, ${t.color.danger.default} 12%, ${t.color.background.surface})`,
      color: `color-mix(in srgb, ${t.color.danger.default} 80%, ${t.color.text.primary})`,
    },
    '& [data-docs-badge][data-docs-badge-tone="info"]': {
      borderColor: `color-mix(in srgb, ${t.color.accent.default} 45%, ${t.color.border.default})`,
      backgroundColor: `color-mix(in srgb, ${t.color.accent.default} 12%, ${t.color.background.surface})`,
      color: `color-mix(in srgb, ${t.color.accent.default} 75%, ${t.color.text.primary})`,
    },
    '& hr': {
      border: 'none',
      borderTop: `1px solid ${t.color.border.default}`,
      margin: `${t.space[5]} 0`,
      [bp]: {
        margin: `${t.space[4]} 0`,
      },
    },
    '& table': {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: t.space[3],
      fontSize: t.fontSize.sm,
    },
    '& thead': {
      borderBottom: `2px solid ${t.color.border.default}`,
    },
    '& th, & td': {
      textAlign: 'left',
      padding: `${t.space[2]} ${t.space[3]}`,
      borderBottom: `1px solid ${t.color.border.default}`,
      verticalAlign: 'top',
    },
    '& th': {
      fontWeight: t.fontWeight.semibold,
      fontSize: t.fontSize.sm,
      color: t.color.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    '& tr:last-child td': {
      borderBottom: 'none',
    },
    '& caption': {
      captionSide: 'bottom',
      paddingTop: t.space[2],
      fontSize: t.fontSize.sm,
      color: t.color.text.secondary,
      textAlign: 'left',
    },
    '& [data-prose-heading-anchor]': {
      marginLeft: t.space[2],
      fontWeight: t.fontWeight.medium,
      color: t.color.text.secondary,
      textDecoration: 'none',
      opacity: 0,
      transition: `opacity var(--duration-medium) var(--easing-standard), color var(--duration-medium) var(--easing-standard)`,
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
      outline: `2px solid ${t.color.border.focus}`,
      outlineOffset: '2px',
      borderRadius: t.radius.sm,
    },
  },
  /** Scroll container for wide GFM tables (wrap HTML manually). */
  tableWrap: {
    overflowX: 'auto',
    marginBottom: t.space[3],
    WebkitOverflowScrolling: 'touch',
  },
  /** Applied with `data-prose-heading-anchor`; visual rules live on `root`. */
  headingAnchor: {},
});
