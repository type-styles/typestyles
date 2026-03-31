import { styles } from 'typestyles';
import { designTokens as t } from '../tokens';

export const alert = styles.create('alert', {
  root: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: t.space[3],
    padding: t.space[4],
    borderRadius: t.radius.md,
    lineHeight: 1.55,
  },
  subtleInfo: {
    backgroundColor: `color-mix(in srgb, ${t.color.accent.default} 12%, ${t.color.background.surface})`,
    border: `1px solid color-mix(in srgb, ${t.color.accent.default} 38%, ${t.color.border.default})`,
    color: t.color.text.primary,
  },
  subtleSuccess: {
    backgroundColor: `color-mix(in srgb, ${t.color.success.default} 14%, ${t.color.background.surface})`,
    border: `1px solid color-mix(in srgb, ${t.color.success.default} 40%, ${t.color.border.default})`,
    color: t.color.text.primary,
  },
  subtleWarning: {
    backgroundColor: `color-mix(in srgb, ${t.color.warning.default} 16%, ${t.color.background.surface})`,
    border: `1px solid color-mix(in srgb, ${t.color.warning.default} 42%, ${t.color.border.default})`,
    color: t.color.text.primary,
  },
  subtleDanger: {
    backgroundColor: `color-mix(in srgb, ${t.color.danger.default} 12%, ${t.color.background.surface})`,
    border: `1px solid color-mix(in srgb, ${t.color.danger.default} 38%, ${t.color.border.default})`,
    color: t.color.text.primary,
  },
  subtleTip: {
    backgroundColor: `color-mix(in srgb, ${t.color.info.default} 12%, ${t.color.background.surface})`,
    border: `1px solid color-mix(in srgb, ${t.color.info.default} 38%, ${t.color.border.default})`,
    color: t.color.text.primary,
  },
  solidInfo: {
    backgroundColor: t.color.accent.default,
    border: `1px solid ${t.color.accent.default}`,
    color: t.color.text.onAccent,
  },
  solidSuccess: {
    backgroundColor: t.color.success.solid,
    border: `1px solid ${t.color.success.solid}`,
    color: '#ffffff',
  },
  solidDanger: {
    backgroundColor: t.color.danger.solid,
    border: `1px solid ${t.color.danger.solid}`,
    color: '#ffffff',
  },
  solidWarning: {
    backgroundColor: t.color.warning.default,
    border: `1px solid ${t.color.warning.default}`,
    color: t.color.warning.onSolid,
  },
  solidTip: {
    backgroundColor: t.color.info.default,
    border: `1px solid ${t.color.info.default}`,
    color: t.color.info.onSolid,
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
  titleAccentInfo: { color: t.color.accent.default },
  titleAccentSuccess: { color: t.color.success.default },
  titleAccentWarning: { color: t.color.warning.default },
  titleAccentDanger: { color: t.color.danger.default },
  titleAccentTip: { color: t.color.info.default },
  content: {
    fontSize: t.fontSize.md,
    margin: 0,
    marginTop: t.space[1],
    color: 'inherit',
  },
  contentFlush: {
    marginTop: 0,
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
});
