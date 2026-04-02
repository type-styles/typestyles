import { styles } from 'typestyles';
import { designTokens as t } from '../tokens';

export const badge = styles.component('badge', {
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    lineHeight: 1,
    padding: `${t.space[1]} ${t.space[2]}`,
    borderRadius: t.radius.full,
    border: `1px solid ${t.color.border.default}`,
    backgroundColor: t.color.background.subtle,
    color: t.color.text.secondary,
  },
  neutral: {
    borderColor: t.color.border.default,
    backgroundColor: t.color.background.subtle,
    color: t.color.text.secondary,
  },
  accent: {
    borderColor: `color-mix(in srgb, ${t.color.accent.default} 45%, ${t.color.border.default})`,
    backgroundColor: `color-mix(in srgb, ${t.color.accent.default} 14%, ${t.color.background.surface})`,
    color: t.color.accent.default,
  },
  success: {
    borderColor: `color-mix(in srgb, ${t.color.success.default} 40%, ${t.color.border.default})`,
    backgroundColor: `color-mix(in srgb, ${t.color.success.default} 12%, ${t.color.background.surface})`,
    color: t.color.success.default,
  },
  warning: {
    borderColor: `color-mix(in srgb, ${t.color.warning.default} 40%, ${t.color.border.default})`,
    backgroundColor: `color-mix(in srgb, ${t.color.warning.default} 14%, ${t.color.background.surface})`,
    color: t.color.warning.default,
  },
  danger: {
    borderColor: `color-mix(in srgb, ${t.color.danger.default} 40%, ${t.color.border.default})`,
    backgroundColor: `color-mix(in srgb, ${t.color.danger.default} 12%, ${t.color.background.surface})`,
    color: t.color.danger.default,
  },
  tip: {
    borderColor: `color-mix(in srgb, ${t.color.info.default} 40%, ${t.color.border.default})`,
    backgroundColor: `color-mix(in srgb, ${t.color.info.default} 12%, ${t.color.background.surface})`,
    color: t.color.info.default,
  },
});
