import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const alert = styles.create('alert', {
  root: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: t.space.md,
    padding: t.space.lg,
    borderRadius: t.radius.md,
    lineHeight: 1.55,
  },
  subtleInfo: {
    backgroundColor: `color-mix(in srgb, ${t.color.accent} 12%, ${t.color.surface})`,
    border: `1px solid color-mix(in srgb, ${t.color.accent} 38%, ${t.color.border})`,
    color: t.color.text,
  },
  subtleSuccess: {
    backgroundColor: `color-mix(in srgb, ${t.color.success} 14%, ${t.color.surface})`,
    border: `1px solid color-mix(in srgb, ${t.color.success} 40%, ${t.color.border})`,
    color: t.color.text,
  },
  subtleWarning: {
    backgroundColor: `color-mix(in srgb, ${t.color.warning} 16%, ${t.color.surface})`,
    border: `1px solid color-mix(in srgb, ${t.color.warning} 42%, ${t.color.border})`,
    color: t.color.text,
  },
  subtleDanger: {
    backgroundColor: `color-mix(in srgb, ${t.color.danger} 12%, ${t.color.surface})`,
    border: `1px solid color-mix(in srgb, ${t.color.danger} 38%, ${t.color.border})`,
    color: t.color.text,
  },
  subtleTip: {
    backgroundColor: `color-mix(in srgb, ${t.color.tip} 12%, ${t.color.surface})`,
    border: `1px solid color-mix(in srgb, ${t.color.tip} 38%, ${t.color.border})`,
    color: t.color.text,
  },
  solidInfo: {
    backgroundColor: t.color.accent,
    border: `1px solid ${t.color.accent}`,
    color: t.color.accentForeground,
  },
  solidSuccess: {
    backgroundColor: t.color.alertSuccessFill,
    border: `1px solid ${t.color.alertSuccessFill}`,
    color: '#ffffff',
  },
  solidDanger: {
    backgroundColor: t.color.alertDangerFill,
    border: `1px solid ${t.color.alertDangerFill}`,
    color: '#ffffff',
  },
  solidWarning: {
    backgroundColor: t.color.warning,
    border: `1px solid ${t.color.warning}`,
    color: t.color.warningForeground,
  },
  solidTip: {
    backgroundColor: t.color.tip,
    border: `1px solid ${t.color.tip}`,
    color: t.color.tipForeground,
  },
  icon: {
    flexShrink: 0,
    display: 'inline-flex',
    marginTop: '2px',
    fontSize: t.font.sizeLg,
    lineHeight: 1,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: t.font.sizeMd,
    fontWeight: t.font.weightSemibold,
    margin: 0,
  },
  titleAccentInfo: { color: t.color.accent },
  titleAccentSuccess: { color: t.color.success },
  titleAccentWarning: { color: t.color.warning },
  titleAccentDanger: { color: t.color.danger },
  titleAccentTip: { color: t.color.tip },
  content: {
    fontSize: t.font.sizeMd,
    margin: 0,
    marginTop: t.space.xs,
    color: 'inherit',
  },
  contentFlush: {
    marginTop: 0,
  },
  action: {
    marginTop: t.space.sm,
  },
  actionLink: {
    fontSize: t.font.sizeMd,
    fontWeight: t.font.weightMedium,
    color: 'inherit',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    '&:hover': {
      textDecoration: 'none',
    },
    '&:focus-visible': {
      outline: `2px solid ${t.color.focusRing}`,
      outlineOffset: '2px',
      borderRadius: t.radius.sm,
    },
  },
});
