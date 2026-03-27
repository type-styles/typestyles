import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const badge = styles.create('badge', {
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: t.font.sizeSm,
    fontWeight: t.font.weightSemibold,
    lineHeight: 1,
    padding: `${t.space.xs} ${t.space.sm}`,
    borderRadius: t.radius.full,
    border: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surfaceMuted,
    color: t.color.textMuted,
  },
  neutral: {
    borderColor: t.color.border,
    backgroundColor: t.color.surfaceMuted,
    color: t.color.textMuted,
  },
  accent: {
    borderColor: `color-mix(in srgb, ${t.color.accent} 45%, ${t.color.border})`,
    backgroundColor: `color-mix(in srgb, ${t.color.accent} 14%, ${t.color.surface})`,
    color: t.color.accent,
  },
  success: {
    borderColor: `color-mix(in srgb, ${t.color.success} 40%, ${t.color.border})`,
    backgroundColor: `color-mix(in srgb, ${t.color.success} 12%, ${t.color.surface})`,
    color: t.color.success,
  },
  warning: {
    borderColor: `color-mix(in srgb, ${t.color.warning} 40%, ${t.color.border})`,
    backgroundColor: `color-mix(in srgb, ${t.color.warning} 14%, ${t.color.surface})`,
    color: t.color.warning,
  },
  danger: {
    borderColor: `color-mix(in srgb, ${t.color.danger} 40%, ${t.color.border})`,
    backgroundColor: `color-mix(in srgb, ${t.color.danger} 12%, ${t.color.surface})`,
    color: t.color.danger,
  },
  tip: {
    borderColor: `color-mix(in srgb, ${t.color.tip} 40%, ${t.color.border})`,
    backgroundColor: `color-mix(in srgb, ${t.color.tip} 12%, ${t.color.surface})`,
    color: t.color.tip,
  },
});
