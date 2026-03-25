import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const codeBlock = styles.create('code-block', {
  root: {
    border: `1px solid ${t.color.border}`,
    borderRadius: t.radius.lg,
    backgroundColor: t.color.surface,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.space.md,
    padding: `${t.space.sm} ${t.space.md}`,
    borderBottom: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surfaceMuted,
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
    border: `1px solid ${t.color.border}`,
    borderRadius: t.radius.full,
    padding: '2px 8px',
    backgroundColor: t.color.surface,
    whiteSpace: 'nowrap',
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
  body: {
    padding: t.space.md,
  },
  pre: {
    margin: 0,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '13px',
    lineHeight: 1.6,
    overflow: 'auto',
  },
  code: {
    display: 'block',
  },
});

