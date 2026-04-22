import { color } from 'typestyles';
import { type DesignShadowValues } from '../tokens/primitive';
import { colorTokens } from '../tokens';

/** Perceptual mix with page background — tune here for all themes. */
const shadowOffsetLightAlpha = 0.5;

export function neoBrutalistShadowOffsetLight(subtleBackground: string): string {
  return color.alpha(subtleBackground, shadowOffsetLightAlpha, 'oklch');
}

/**
 * Dark-mode chrome borders: crisp neo-brutalist edges without mapping accents to full UI outlines
 * (bright palette steps read as neon/“white” on near-black).
 */
export function neoBrutalistBorderDarkDefault(hue: number): string {
  return color.oklch('40%', 0.02, hue);
}

export function neoBrutalistBorderDarkStrong(hue: number): string {
  return color.oklch('54%', 0.026, hue);
}

/**
 * Hard shadow fill, darker than typical `background.app` (~12% L) so offset blocks read as depth
 * instead of a second bright outline.
 */
export function neoBrutalistShadowOffsetDark(hue: number): string {
  return color.oklch('6.5%', 0.035, hue);
}

const offsetColor = colorTokens.shadow.offset;

/**
 * Hard-offset neo-brutalist shadows. Color comes from {@link colorTokens.shadow.offset}
 * (`--…-color-shadow-offset`); themes set this via {@link neoBrutalistShadowOffsetLight} /
 * {@link neoBrutalistShadowOffsetDark} (per-theme hue, aligned with `background.app`).
 */
export const neoBrutalistShadow: DesignShadowValues = {
  xs: `1px 1px 0 0 ${offsetColor}`,
  sm: `2px 2px 0 0 ${offsetColor}`,
  md: `3px 3px 0 0 ${offsetColor}`,
  lg: `4px 4px 0 0 ${offsetColor}`,
  xl: `5px 5px 0 0 ${offsetColor}`,
};
