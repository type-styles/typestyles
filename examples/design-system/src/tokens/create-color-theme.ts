import { color } from 'typestyles/color';
import { contrastRatio, generateRamp, parseColor } from 'typestyles/color-scale';
import type { DesignColorValues } from './semantic';
import { FAMILY_SPECS } from './palette';
import {
  neoBrutalistShadowOffsetDark,
  neoBrutalistShadowOffsetLight,
} from '../themes/neo-brutalist-shadows';

export type NeutralStyle = 'neutral' | 'cool' | 'warm';
export type ColorContrast = 'standard' | 'high';

export type CreateColorThemeInput = {
  accent: string;
  neutralStyle?: NeutralStyle;
  contrast?: ColorContrast;
};

export type CreateColorThemeResult = {
  light: DesignColorValues;
  dark: DesignColorValues;
};

/**
 * Calibration notes (`#0064E0`, standard contrast, neutral style):
 * - Light `accent.default` lands near palette `sky-7`; dark accent mirrors to ~`blue-4`.
 * - Hand-authored `default.ts` uses custom paper backgrounds (`#F5F1E9`) and ink borders
 *   (`#000`) — generated neutrals are ramp-based OKLCH, so surfaces read cooler/flatter.
 * - Dark `danger.solid` / `success.solid` use ramp step 7 (not mirrored step 3) to keep
 *   white `text.onDanger` above 4.5:1 — matches forest/rose/default dark themes.
 * - `ACCENT_CHROMA_MIN = 0.08` keeps near-gray accents visible without oversaturating hues.
 */
const ACCENT_CHROMA_MIN = 0.08;

const NEUTRAL_CHROMA = 0.015;
const WHITE = color.oklch('100%', 0, 0);

type Ramp = readonly string[];

type LightSlotMap = {
  background: { app: number; surface: number; subtle: number; elevated: number };
  text: { primary: number; secondary: number };
  accent: { default: number; hover: number };
  border: { default: number; strong: number; focus: number };
  danger: { default: number; solid: number };
  success: { default: number; solid: number };
  warning: { default: number };
  info: { default: number };
};

/**
 * Light-mode ramp step indices (1 = lightest). Tuned against the hand-authored default
 * theme accent `#0064E0` / sky-7 family. Dark mode mirrors via `mirrorStep`, except
 * `danger.solid` / `success.solid` which use step 7 (matches default/forest/rose themes).
 */
const LIGHT_SLOTS: LightSlotMap = {
  background: { app: 1, surface: 1, subtle: 2, elevated: 1 },
  text: { primary: 10, secondary: 7 },
  accent: { default: 7, hover: 8 },
  border: { default: 4, strong: 6, focus: 5 },
  danger: { default: 7, solid: 8 },
  success: { default: 7, solid: 8 },
  warning: { default: 7 },
  info: { default: 7 },
};

function rampAt(ramp: Ramp, step: number): string {
  return ramp[step - 1];
}

function mirrorStep(step: number): number {
  return 11 - step;
}

function resolveNeutralHue(style: NeutralStyle, accentHue: number): number {
  if (style === 'cool') return 250;
  if (style === 'warm') return 70;
  return accentHue;
}

function resolveLightnessRange(contrast: ColorContrast): [number, number] {
  return contrast === 'high' ? [12, 99] : [22, 97];
}

function resolveOnAccent(accentDefault: string, neutralRamp: Ramp): string {
  if (contrastRatio(WHITE, accentDefault) < 4.5) {
    return rampAt(neutralRamp, 10);
  }
  return WHITE;
}

function mapLightColors(
  neutral: Ramp,
  accent: Ramp,
  danger: Ramp,
  success: Ramp,
  warning: Ramp,
  info: Ramp,
): DesignColorValues {
  const slots = LIGHT_SLOTS;
  const background = {
    app: rampAt(neutral, slots.background.app),
    surface: rampAt(neutral, slots.background.surface),
    subtle: rampAt(neutral, slots.background.subtle),
    elevated: rampAt(neutral, slots.background.elevated),
  };

  const accentDefault = rampAt(accent, slots.accent.default);

  return {
    background,
    text: {
      primary: rampAt(neutral, slots.text.primary),
      secondary: rampAt(neutral, slots.text.secondary),
      onAccent: resolveOnAccent(accentDefault, neutral),
      onDanger: WHITE,
    },
    accent: {
      default: accentDefault,
      hover: rampAt(accent, slots.accent.hover),
    },
    border: {
      default: rampAt(neutral, slots.border.default),
      strong: rampAt(neutral, slots.border.strong),
      focus: rampAt(accent, slots.border.focus),
    },
    shadow: { offset: neoBrutalistShadowOffsetLight(background.subtle) },
    danger: {
      default: rampAt(danger, slots.danger.default),
      solid: rampAt(danger, slots.danger.solid),
    },
    success: {
      default: rampAt(success, slots.success.default),
      solid: rampAt(success, slots.success.solid),
    },
    warning: {
      default: rampAt(warning, slots.warning.default),
      onSolid: rampAt(neutral, 10),
    },
    info: {
      default: rampAt(info, slots.info.default),
      onSolid: WHITE,
    },
    overlay: { default: color.alpha(rampAt(neutral, 10), 0.55, 'oklch') },
  };
}

function mapDarkColors(
  neutral: Ramp,
  accent: Ramp,
  danger: Ramp,
  success: Ramp,
  warning: Ramp,
  info: Ramp,
  neutralHue: number,
): DesignColorValues {
  const m = mirrorStep;
  const slots = LIGHT_SLOTS;
  const background = {
    app: rampAt(neutral, m(slots.background.app)),
    surface: rampAt(neutral, m(slots.background.surface)),
    subtle: rampAt(neutral, m(slots.background.subtle)),
    elevated: rampAt(neutral, m(slots.background.elevated)),
  };

  const accentDefault = rampAt(accent, m(slots.accent.default));

  return {
    background,
    text: {
      primary: rampAt(neutral, m(slots.text.primary)),
      secondary: rampAt(neutral, m(slots.text.secondary)),
      onAccent: resolveOnAccent(accentDefault, neutral),
      onDanger: WHITE,
    },
    accent: {
      default: accentDefault,
      hover: rampAt(accent, m(slots.accent.hover)),
    },
    border: {
      default: rampAt(neutral, m(slots.border.default)),
      strong: rampAt(neutral, m(slots.border.strong)),
      focus: rampAt(accent, m(slots.border.focus)),
    },
    shadow: { offset: neoBrutalistShadowOffsetDark(neutralHue) },
    danger: {
      default: rampAt(danger, m(slots.danger.default)),
      solid: rampAt(danger, 7),
    },
    success: {
      default: rampAt(success, m(slots.success.default)),
      solid: rampAt(success, 7),
    },
    warning: {
      default: rampAt(warning, m(slots.warning.default)),
      onSolid: rampAt(neutral, m(10)),
    },
    info: {
      default: rampAt(info, m(slots.info.default)),
      onSolid: WHITE,
    },
    overlay: { default: color.alpha(rampAt(neutral, m(10)), 0.7, 'oklch') },
  };
}

type ContrastPair = readonly [label: string, foreground: string, background: string];

function validateContrast(
  mode: 'light' | 'dark',
  colors: DesignColorValues,
  threshold: number,
): void {
  if (process.env.NODE_ENV === 'production') return;

  const pairs: ContrastPair[] = [
    ['text.primary / background.app', colors.text.primary, colors.background.app],
    ['text.secondary / background.app', colors.text.secondary, colors.background.app],
    ['text.onAccent / accent.default', colors.text.onAccent, colors.accent.default],
    ['text.onDanger / danger.solid', colors.text.onDanger, colors.danger.solid],
  ];

  for (const [label, foreground, background] of pairs) {
    if (contrastRatio(foreground, background) < threshold) {
      console.warn(
        `[design-system] createColorTheme (${mode}): contrast below ${threshold} for ${label}.`,
      );
    }
  }
}

export function createColorTheme(input: CreateColorThemeInput): CreateColorThemeResult {
  const neutralStyle = input.neutralStyle ?? 'neutral';
  const contrast = input.contrast ?? 'standard';
  const lightnessRange = resolveLightnessRange(contrast);
  const contrastThreshold = contrast === 'high' ? 7 : 4.5;

  const accentOklch = parseColor(input.accent);
  const neutralHue = resolveNeutralHue(neutralStyle, accentOklch.h);
  const accentChroma = Math.max(accentOklch.c, ACCENT_CHROMA_MIN);

  const rampOpts = { lightnessRange } as const;
  const neutralRamp = generateRamp({ hue: neutralHue, chroma: NEUTRAL_CHROMA, ...rampOpts });
  const accentRamp = generateRamp({ hue: accentOklch.h, chroma: accentChroma, ...rampOpts });
  const dangerRamp = generateRamp({
    hue: FAMILY_SPECS.red.h,
    chroma: FAMILY_SPECS.red.cMax,
    ...rampOpts,
  });
  const successRamp = generateRamp({
    hue: FAMILY_SPECS.green.h,
    chroma: FAMILY_SPECS.green.cMax,
    ...rampOpts,
  });
  const warningRamp = generateRamp({
    hue: FAMILY_SPECS.amber.h,
    chroma: FAMILY_SPECS.amber.cMax,
    ...rampOpts,
  });
  const infoRamp = generateRamp({
    hue: FAMILY_SPECS.violet.h,
    chroma: FAMILY_SPECS.violet.cMax,
    ...rampOpts,
  });

  const light = mapLightColors(
    neutralRamp,
    accentRamp,
    dangerRamp,
    successRamp,
    warningRamp,
    infoRamp,
  );
  const dark = mapDarkColors(
    neutralRamp,
    accentRamp,
    dangerRamp,
    successRamp,
    warningRamp,
    infoRamp,
    neutralHue,
  );

  validateContrast('light', light, contrastThreshold);
  validateContrast('dark', dark, contrastThreshold);

  return { light, dark };
}
