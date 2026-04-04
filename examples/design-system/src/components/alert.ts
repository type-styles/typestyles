import type { CSSProperties } from 'typestyles';
import { styles } from '../runtime';
import { designTokens as t } from '../tokens';

export const alert = styles.component('alert', {
  slots: ['root', 'icon', 'body', 'title', 'content', 'action', 'actionLink'] as const,
  base: {
    root: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: t.space[3],
      padding: t.space[4],
      borderRadius: t.radius.md,
      lineHeight: 1.55,
    },
    icon: {
      flexShrink: 0,
      display: 'inline-flex',
      marginTop: '2px',
      fontSize: t.fontSize.lg,
      lineHeight: 1,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: t.fontSize.md,
      fontWeight: t.fontWeight.semibold,
      margin: 0,
    },
    content: {
      fontSize: t.fontSize.md,
      margin: 0,
      color: 'inherit',
    },
    action: {
      marginTop: t.space[2],
    },
    actionLink: {
      fontSize: t.fontSize.md,
      fontWeight: t.fontWeight.medium,
      color: 'inherit',
      textDecoration: 'underline',
      textUnderlineOffset: '2px',
      '&:hover': {
        textDecoration: 'none',
      },
      '&:focus-visible': {
        outline: `2px solid ${t.color.border.focus}`,
        outlineOffset: '2px',
        borderRadius: t.radius.sm,
      },
    },
  },
  variants: {
    tone: {
      info: { title: { color: t.color.accent.default } },
      success: { title: { color: t.color.success.default } },
      warning: { title: { color: t.color.warning.default } },
      danger: { title: { color: t.color.danger.default } },
      tip: { title: { color: t.color.info.default } },
    },
    appearance: {
      subtle: {},
      solid: {},
    },
    contentGap: {
      spaced: { content: { marginTop: t.space[1] } },
      flush: { content: { marginTop: 0 } },
    },
  },
  defaultVariants: {
    tone: 'info',
    appearance: 'subtle',
    contentGap: 'spaced',
  },
  compoundVariants: [
    { variants: { appearance: 'subtle', tone: 'info' }, style: { root: subtleRoot('accent') } },
    {
      variants: { appearance: 'subtle', tone: 'success' },
      style: { root: subtleRoot('success') },
    },
    {
      variants: { appearance: 'subtle', tone: 'warning' },
      style: { root: subtleRoot('warning') },
    },
    {
      variants: { appearance: 'subtle', tone: 'danger' },
      style: { root: subtleRoot('danger') },
    },
    { variants: { appearance: 'subtle', tone: 'tip' }, style: { root: subtleRoot('info') } },
    {
      variants: { appearance: 'solid', tone: 'info' },
      style: {
        root: {
          backgroundColor: t.color.accent.default,
          border: `1px solid ${t.color.accent.default}`,
          color: t.color.text.onAccent,
        },
      },
    },
    {
      variants: { appearance: 'solid', tone: 'success' },
      style: {
        root: {
          backgroundColor: t.color.success.solid,
          border: `1px solid ${t.color.success.solid}`,
          color: '#ffffff',
        },
      },
    },
    {
      variants: { appearance: 'solid', tone: 'danger' },
      style: {
        root: {
          backgroundColor: t.color.danger.solid,
          border: `1px solid ${t.color.danger.solid}`,
          color: '#ffffff',
        },
      },
    },
    {
      variants: { appearance: 'solid', tone: 'warning' },
      style: {
        root: {
          backgroundColor: t.color.warning.default,
          border: `1px solid ${t.color.warning.default}`,
          color: t.color.warning.onSolid,
        },
      },
    },
    {
      variants: { appearance: 'solid', tone: 'tip' },
      style: {
        root: {
          backgroundColor: t.color.info.default,
          border: `1px solid ${t.color.info.default}`,
          color: t.color.info.onSolid,
        },
      },
    },
    {
      variants: {
        appearance: 'solid',
        tone: ['info', 'success', 'warning', 'danger', 'tip'],
      },
      style: { title: { color: 'inherit' } },
    },
  ],
});

type ToneToken = 'accent' | 'success' | 'warning' | 'danger' | 'info';

function subtleRoot(kind: ToneToken): CSSProperties {
  const c =
    kind === 'accent'
      ? t.color.accent.default
      : kind === 'success'
        ? t.color.success.default
        : kind === 'warning'
          ? t.color.warning.default
          : kind === 'danger'
            ? t.color.danger.default
            : t.color.info.default;
  const mixBg = kind === 'warning' ? '16%' : kind === 'success' ? '14%' : '12%';
  const mixBorder = kind === 'warning' ? '42%' : kind === 'success' ? '40%' : '38%';
  return {
    backgroundColor: `color-mix(in srgb, ${c} ${mixBg}, ${t.color.background.surface})`,
    border: `1px solid color-mix(in srgb, ${c} ${mixBorder}, ${t.color.border.default})`,
    color: t.color.text.primary,
  };
}
