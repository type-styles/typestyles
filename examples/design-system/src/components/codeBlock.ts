import { styles } from 'typestyles';
import { designTokens as t } from '../tokens';

export const codeBlock = {
  root: styles.class('code-block-root', {
    border: `1px solid ${t.codeBlock.border}`,
    borderRadius: t.radius.lg,
    backgroundColor: t.codeBlock.background,
    overflow: 'hidden',
    boxShadow: t.shadow.xs,
  }),
  rootDefault: styles.class('code-block-rootDefault', {}),
  rootInline: styles.class('code-block-rootInline', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[1],
    borderRadius: t.radius.md,
    border: `1px solid ${t.codeBlock.border}`,
    padding: '2px 8px',
    backgroundColor: t.codeBlock.backgroundInline,
  }),
  rootDiff: styles.class('code-block-rootDiff', {
    borderColor: t.color.border.strong,
  }),
  rootTerminal: styles.class('code-block-rootTerminal', {
    backgroundColor: t.color.text.primary,
    borderColor: t.color.text.primary,
  }),
  header: styles.class('code-block-header', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.space[2],
    padding: `${t.space[1]} ${t.space[3]}`,
    borderBottom: `1px solid ${t.codeBlock.border}`,
    backgroundColor: t.codeBlock.backgroundHeader,
  }),
  headerTerminal: styles.class('code-block-headerTerminal', {
    borderBottomColor: t.color.border.strong,
    backgroundColor: t.codeBlock.backgroundHeader,
  }),
  title: styles.class('code-block-title', {
    display: 'flex',
    alignItems: 'center',
    gap: t.space[2],
    minWidth: 0,
  }),
  filename: styles.class('code-block-filename', {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.medium,
    color: t.color.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  language: styles.class('code-block-language', {
    fontSize: t.fontSize.sm,
    color: t.color.text.secondary,
    whiteSpace: 'nowrap',
  }),
  languageTerminal: styles.class('code-block-languageTerminal', {
    color: t.color.text.onAccent,
    borderColor: 'rgb(255 255 255 / 0.2)',
  }),
  actions: styles.class('code-block-actions', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[1],
    flexShrink: 0,
  }),
  copyButton: styles.class('code-block-copyButton', {
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
  }),
  copyButtonIdle: styles.class('code-block-copyButtonIdle', {}),
  copyButtonCopied: styles.class('code-block-copyButtonCopied', {
    borderColor: t.color.success.default,
    color: t.color.success.default,
  }),
  copyButtonError: styles.class('code-block-copyButtonError', {
    borderColor: t.color.danger.default,
    color: t.color.danger.default,
  }),
  feedback: styles.class('code-block-feedback', {
    fontSize: t.fontSize.sm,
    color: t.color.text.secondary,
    minHeight: '1lh',
  }),
  feedbackInline: styles.class('code-block-feedbackInline', {
    display: 'inline-flex',
    alignItems: 'center',
    marginInlineStart: t.space[1],
  }),
  feedbackToast: styles.class('code-block-feedbackToast', {
    position: 'absolute',
    right: t.space[3],
    top: t.space[3],
    zIndex: 1,
    border: `1px solid ${t.codeBlock.border}`,
    backgroundColor: t.codeBlock.background,
    borderRadius: t.radius.md,
    padding: `2px ${t.space[2]}`,
    boxShadow: t.shadow.xs,
  }),
  feedbackSuccess: styles.class('code-block-feedbackSuccess', {
    color: t.color.success.default,
  }),
  feedbackError: styles.class('code-block-feedbackError', {
    color: t.color.danger.default,
  }),
  body: styles.class('code-block-body', {
    padding: 0,
    backgroundColor: t.codeBlock.background,
  }),
  bodyTerminal: styles.class('code-block-bodyTerminal', {
    color: t.color.text.onAccent,
  }),
  bodyScrollable: styles.class('code-block-bodyScrollable', {
    overflowX: 'auto',
  }),
  pre: styles.class('code-block-pre', {
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
  }),
  preTerminal: styles.class('code-block-preTerminal', {
    color: t.color.text.onAccent,
  }),
  preWrap: styles.class('code-block-preWrap', {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowX: 'visible',
  }),
  preScrollX: styles.class('code-block-preScrollX', {
    whiteSpace: 'pre',
    overflowX: 'auto',
  }),
  code: styles.class('code-block-code', {
    display: 'block',
  }),
  lines: styles.class('code-block-lines', {
    display: 'grid',
    gap: '2px',
  }),
  line: styles.class('code-block-line', {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    alignItems: 'start',
    columnGap: t.space[3],
    borderRadius: t.radius.sm,
    paddingInline: t.space[2],
  }),
  lineNumber: styles.class('code-block-lineNumber', {
    minWidth: '2ch',
    textAlign: 'right',
    fontSize: t.fontSize.sm,
    color: t.color.text.secondary,
    opacity: 0.8,
    userSelect: 'none',
  }),
  lineContent: styles.class('code-block-lineContent', {
    minWidth: 0,
  }),
  lineHighlighted: styles.class('code-block-lineHighlighted', {
    backgroundColor: t.codeBlock.backgroundLineHighlight,
  }),
  lineAdded: styles.class('code-block-lineAdded', {
    backgroundColor: 'rgb(16 185 129 / 0.12)',
  }),
  lineDeleted: styles.class('code-block-lineDeleted', {
    backgroundColor: 'rgb(248 113 113 / 0.12)',
  }),
};
