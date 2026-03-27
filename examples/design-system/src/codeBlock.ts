import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const codeBlock = styles.create('code-block', {
  root: {
    border: `1px solid ${t.color.border}`,
    borderRadius: t.radius.lg,
    backgroundColor: t.color.surface,
    overflow: 'hidden',
    boxShadow: t.shadow.sm,
  },
  rootDefault: {},
  rootInline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space.xs,
    borderRadius: t.radius.md,
    border: `1px solid ${t.color.border}`,
    padding: '2px 8px',
    backgroundColor: t.color.surfaceMuted,
  },
  rootDiff: {
    borderColor: t.color.borderStrong,
  },
  rootTerminal: {
    backgroundColor: t.color.text,
    borderColor: t.color.text,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.space.sm,
    padding: `${t.space.xs} ${t.space.md}`,
    borderBottom: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surfaceMuted,
  },
  headerTerminal: {
    borderBottomColor: t.color.borderStrong,
    backgroundColor: 'rgb(15 23 42 / 0.22)',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: t.space.sm,
    minWidth: 0,
  },
  filename: {
    fontSize: t.font.sizeSm,
    fontWeight: t.font.weightMedium,
    color: t.color.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  language: {
    fontSize: t.font.sizeSm,
    color: t.color.textMuted,
    whiteSpace: 'nowrap',
  },
  languageTerminal: {
    color: t.color.accentForeground,
    borderColor: 'rgb(255 255 255 / 0.2)',
  },
  actions: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space.xs,
    flexShrink: 0,
  },
  copyButton: {
    appearance: 'none',
    border: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surface,
    color: t.color.text,
    borderRadius: t.radius.md,
    padding: '6px 10px',
    fontSize: t.font.sizeSm,
    fontWeight: t.font.weightMedium,
    cursor: 'pointer',
    transition: 'background-color 140ms ease, border-color 140ms ease',
    '&:hover': {
      backgroundColor: t.color.surfaceMuted,
      borderColor: t.color.borderStrong,
    },
    '&:focus-visible': {
      outline: `2px solid ${t.color.focusRing}`,
      outlineOffset: '2px',
    },
    '&[data-copied]': {
      borderColor: t.color.success,
      color: t.color.success,
    },
    '&[data-error]': {
      borderColor: t.color.danger,
      color: t.color.danger,
    },
  },
  copyButtonIdle: {},
  copyButtonCopied: {
    borderColor: t.color.success,
    color: t.color.success,
  },
  copyButtonError: {
    borderColor: t.color.danger,
    color: t.color.danger,
  },
  feedback: {
    fontSize: t.font.sizeSm,
    color: t.color.textMuted,
    minHeight: '1lh',
  },
  feedbackInline: {
    display: 'inline-flex',
    alignItems: 'center',
    marginInlineStart: t.space.xs,
  },
  feedbackToast: {
    position: 'absolute',
    right: t.space.md,
    top: t.space.md,
    zIndex: 1,
    border: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surface,
    borderRadius: t.radius.md,
    padding: `2px ${t.space.sm}`,
    boxShadow: t.shadow.sm,
  },
  feedbackSuccess: {
    color: t.color.success,
  },
  feedbackError: {
    color: t.color.danger,
  },
  body: {
    padding: 0,
    backgroundColor: t.color.surface,
  },
  bodyTerminal: {
    color: t.color.accentForeground,
  },
  bodyScrollable: {
    overflowX: 'auto',
  },
  pre: {
    margin: 0,
    padding: t.space.md,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '13px',
    lineHeight: 1.6,
    overflow: 'auto',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 0,
  },
  preTerminal: {
    color: t.color.accentForeground,
  },
  preWrap: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowX: 'visible',
  },
  preScrollX: {
    whiteSpace: 'pre',
    overflowX: 'auto',
  },
  code: {
    display: 'block',
  },
  lines: {
    display: 'grid',
    gap: '2px',
  },
  line: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    alignItems: 'start',
    columnGap: t.space.md,
    borderRadius: t.radius.sm,
    paddingInline: t.space.sm,
  },
  lineNumber: {
    minWidth: '2ch',
    textAlign: 'right',
    fontSize: t.font.sizeSm,
    color: t.color.textMuted,
    opacity: 0.8,
    userSelect: 'none',
  },
  lineContent: {
    minWidth: 0,
  },
  lineHighlighted: {
    backgroundColor: t.color.surfaceMuted,
  },
  lineAdded: {
    backgroundColor: 'rgb(16 185 129 / 0.12)',
  },
  lineDeleted: {
    backgroundColor: 'rgb(248 113 113 / 0.12)',
  },
});

