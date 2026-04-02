import { styles } from 'typestyles';
import { designTokens as t } from '../tokens';

export const codeBlock = styles.component('code-block', {
  root: {
    border: `1px solid ${t.codeBlock.border}`,
    borderRadius: t.radius.lg,
    backgroundColor: t.codeBlock.background,
    overflow: 'hidden',
    boxShadow: t.shadow.xs,
  },
  rootDefault: {},
  rootInline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[1],
    borderRadius: t.radius.md,
    border: `1px solid ${t.codeBlock.border}`,
    padding: '2px 8px',
    backgroundColor: t.codeBlock.backgroundInline,
  },
  rootDiff: {
    borderColor: t.color.border.strong,
  },
  rootTerminal: {
    backgroundColor: t.color.text.primary,
    borderColor: t.color.text.primary,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.space[2],
    padding: `${t.space[1]} ${t.space[3]}`,
    borderBottom: `1px solid ${t.codeBlock.border}`,
    backgroundColor: t.codeBlock.backgroundHeader,
  },
  headerTerminal: {
    borderBottomColor: t.color.border.strong,
    backgroundColor: t.codeBlock.backgroundHeader,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: t.space[2],
    minWidth: 0,
  },
  filename: {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.medium,
    color: t.color.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  language: {
    fontSize: t.fontSize.sm,
    color: t.color.text.secondary,
    whiteSpace: 'nowrap',
  },
  languageTerminal: {
    color: t.color.text.onAccent,
    borderColor: 'rgb(255 255 255 / 0.2)',
  },
  actions: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[1],
    flexShrink: 0,
  },
  copyButton: {
    appearance: 'none',
    border: `1px solid ${t.codeBlock.border}`,
    backgroundColor: t.codeBlock.background,
    color: t.color.text.primary,
    borderRadius: t.radius.md,
    padding: '6px 10px',
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.medium,
    cursor: 'pointer',
    transition: t.transition.controlSurface,
    '&:hover': {
      backgroundColor: t.codeBlock.backgroundHeader,
      borderColor: t.color.border.strong,
    },
    '&:focus-visible': {
      outline: `2px solid ${t.color.border.focus}`,
      outlineOffset: '2px',
    },
    '&[data-copied]': {
      borderColor: t.color.success.default,
      color: t.color.success.default,
    },
    '&[data-error]': {
      borderColor: t.color.danger.default,
      color: t.color.danger.default,
    },
  },
  copyButtonIdle: {},
  copyButtonCopied: {
    borderColor: t.color.success.default,
    color: t.color.success.default,
  },
  copyButtonError: {
    borderColor: t.color.danger.default,
    color: t.color.danger.default,
  },
  feedback: {
    fontSize: t.fontSize.sm,
    color: t.color.text.secondary,
    minHeight: '1lh',
  },
  feedbackInline: {
    display: 'inline-flex',
    alignItems: 'center',
    marginInlineStart: t.space[1],
  },
  feedbackToast: {
    position: 'absolute',
    right: t.space[3],
    top: t.space[3],
    zIndex: 1,
    border: `1px solid ${t.codeBlock.border}`,
    backgroundColor: t.codeBlock.background,
    borderRadius: t.radius.md,
    padding: `2px ${t.space[2]}`,
    boxShadow: t.shadow.xs,
  },
  feedbackSuccess: {
    color: t.color.success.default,
  },
  feedbackError: {
    color: t.color.danger.default,
  },
  body: {
    padding: 0,
    backgroundColor: t.codeBlock.background,
  },
  bodyTerminal: {
    color: t.color.text.onAccent,
  },
  bodyScrollable: {
    overflowX: 'auto',
  },
  pre: {
    margin: 0,
    padding: t.space[3],
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '13px',
    lineHeight: 1.6,
    overflow: 'auto',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 0,
  },
  preTerminal: {
    color: t.color.text.onAccent,
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
    columnGap: t.space[3],
    borderRadius: t.radius.sm,
    paddingInline: t.space[2],
  },
  lineNumber: {
    minWidth: '2ch',
    textAlign: 'right',
    fontSize: t.fontSize.sm,
    color: t.color.text.secondary,
    opacity: 0.8,
    userSelect: 'none',
  },
  lineContent: {
    minWidth: 0,
  },
  lineHighlighted: {
    backgroundColor: t.codeBlock.backgroundLineHighlight,
  },
  lineAdded: {
    backgroundColor: 'rgb(16 185 129 / 0.12)',
  },
  lineDeleted: {
    backgroundColor: 'rgb(248 113 113 / 0.12)',
  },
});
