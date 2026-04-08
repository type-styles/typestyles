import { designTokens as t } from '../tokens';

/** Shared semantic keys: alert `info` maps to `accent`; badge `accent` / `tip` map here directly. */
export type SemanticToneKey = 'accent' | 'success' | 'warning' | 'danger' | 'info';

/** Tint amounts for subtle surfaces (badge + alert `appearance: subtle`). */
export const subtleMix = {
  surface: '12%',
  border: '38%',
} as const;

export function subtleBackgroundColor(driver: string): string {
  return `color-mix(in srgb, ${driver} ${subtleMix.surface}, ${t.color.background.surface})`;
}

export function subtleBorderColor(driver: string): string {
  return `color-mix(in srgb, ${driver} ${subtleMix.border}, ${t.color.border.default})`;
}

export const semanticTone = {
  accent: {
    semantic: t.color.accent.default,
    solidBg: t.color.accent.default,
    solidFg: t.color.text.onAccent,
  },
  success: {
    semantic: t.color.success.default,
    solidBg: t.color.success.solid,
    solidFg: '#ffffff',
  },
  warning: {
    semantic: t.color.warning.default,
    solidBg: t.color.warning.default,
    solidFg: t.color.warning.onSolid,
  },
  danger: {
    semantic: t.color.danger.default,
    solidBg: t.color.danger.solid,
    solidFg: '#ffffff',
  },
  info: {
    semantic: t.color.info.default,
    solidBg: t.color.info.default,
    solidFg: t.color.info.onSolid,
  },
} as const satisfies Record<
  SemanticToneKey,
  { semantic: string; solidBg: string; solidFg: string }
>;

type SemanticChannelRefs = {
  semantic: { name: string };
  solidBg: { name: string };
  solidFg: { name: string };
};

type BadgePaintRefs = {
  borderColor: { name: string };
  backgroundColor: { name: string };
  textColor: { name: string };
};

/** Root custom properties for alert `tone` (solid + inherited semantic for subtle / title). */
export function semanticChannelAssignments(v: SemanticChannelRefs, key: SemanticToneKey) {
  const ch = semanticTone[key];
  return {
    [v.semantic.name]: ch.semantic,
    [v.solidBg.name]: ch.solidBg,
    [v.solidFg.name]: ch.solidFg,
  };
}

/** Flat badge `tone` paint: mixed border/background + label color from the same semantic driver. */
export function badgeTonePaint(v: BadgePaintRefs, key: SemanticToneKey) {
  const ch = semanticTone[key];
  return {
    [v.borderColor.name]: subtleBorderColor(ch.semantic),
    [v.backgroundColor.name]: subtleBackgroundColor(ch.semantic),
    [v.textColor.name]: ch.semantic,
  };
}
