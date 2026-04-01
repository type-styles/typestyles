/**
 * Type-safe helpers for CSS color functions.
 *
 * Each function returns a plain CSS string — no runtime color math.
 * Works naturally with token references since tokens are strings too.
 */

type ColorValue = string | number;

/** Color spaces supported by color-mix(). */
export type ColorMixSpace =
  | 'srgb'
  | 'srgb-linear'
  | 'display-p3'
  | 'a98-rgb'
  | 'prophoto-rgb'
  | 'rec2020'
  | 'lab'
  | 'oklab'
  | 'xyz'
  | 'xyz-d50'
  | 'xyz-d65'
  | 'hsl'
  | 'hwb'
  | 'lch'
  | 'oklch';

/**
 * `rgb(r g b)` or `rgb(r g b / a)`
 *
 * @example
 * ```ts
 * color.rgb(0, 102, 255)        // "rgb(0 102 255)"
 * color.rgb(0, 102, 255, 0.5)   // "rgb(0 102 255 / 0.5)"
 * ```
 */
export function rgb(r: ColorValue, g: ColorValue, b: ColorValue, alpha?: ColorValue): string {
  if (alpha != null) return `rgb(${r} ${g} ${b} / ${alpha})`;
  return `rgb(${r} ${g} ${b})`;
}

/**
 * `hsl(h s l)` or `hsl(h s l / a)`
 *
 * @example
 * ```ts
 * color.hsl(220, '100%', '50%')       // "hsl(220 100% 50%)"
 * color.hsl(220, '100%', '50%', 0.8)  // "hsl(220 100% 50% / 0.8)"
 * ```
 */
export function hsl(h: ColorValue, s: ColorValue, l: ColorValue, alpha?: ColorValue): string {
  if (alpha != null) return `hsl(${h} ${s} ${l} / ${alpha})`;
  return `hsl(${h} ${s} ${l})`;
}

/**
 * `oklch(L C h)` or `oklch(L C h / a)`
 *
 * @example
 * ```ts
 * color.oklch(0.7, 0.15, 250)       // "oklch(0.7 0.15 250)"
 * color.oklch(0.7, 0.15, 250, 0.5)  // "oklch(0.7 0.15 250 / 0.5)"
 * ```
 */
export function oklch(l: ColorValue, c: ColorValue, h: ColorValue, alpha?: ColorValue): string {
  if (alpha != null) return `oklch(${l} ${c} ${h} / ${alpha})`;
  return `oklch(${l} ${c} ${h})`;
}

/**
 * `oklab(L a b)` or `oklab(L a b / alpha)`
 *
 * @example
 * ```ts
 * color.oklab(0.7, -0.1, -0.1)       // "oklab(0.7 -0.1 -0.1)"
 * color.oklab(0.7, -0.1, -0.1, 0.5)  // "oklab(0.7 -0.1 -0.1 / 0.5)"
 * ```
 */
export function oklab(l: ColorValue, a: ColorValue, b: ColorValue, alpha?: ColorValue): string {
  if (alpha != null) return `oklab(${l} ${a} ${b} / ${alpha})`;
  return `oklab(${l} ${a} ${b})`;
}

/**
 * `lab(L a b)` or `lab(L a b / alpha)`
 *
 * @example
 * ```ts
 * color.lab('50%', 40, -20)  // "lab(50% 40 -20)"
 * ```
 */
export function lab(l: ColorValue, a: ColorValue, b: ColorValue, alpha?: ColorValue): string {
  if (alpha != null) return `lab(${l} ${a} ${b} / ${alpha})`;
  return `lab(${l} ${a} ${b})`;
}

/**
 * `lch(L C h)` or `lch(L C h / alpha)`
 *
 * @example
 * ```ts
 * color.lch('50%', 80, 250)  // "lch(50% 80 250)"
 * ```
 */
export function lch(l: ColorValue, c: ColorValue, h: ColorValue, alpha?: ColorValue): string {
  if (alpha != null) return `lch(${l} ${c} ${h} / ${alpha})`;
  return `lch(${l} ${c} ${h})`;
}

/**
 * `hwb(h w b)` or `hwb(h w b / alpha)`
 *
 * @example
 * ```ts
 * color.hwb(220, '10%', '0%')  // "hwb(220 10% 0%)"
 * ```
 */
export function hwb(h: ColorValue, w: ColorValue, b: ColorValue, alpha?: ColorValue): string {
  if (alpha != null) return `hwb(${h} ${w} ${b} / ${alpha})`;
  return `hwb(${h} ${w} ${b})`;
}

/**
 * `color-mix(in colorspace, color1 p1%, color2 p2%)`
 *
 * Mixes two colors in the given color space. Percentages are optional.
 *
 * @example
 * ```ts
 * color.mix('red', 'blue')                      // "color-mix(in srgb, red, blue)"
 * color.mix('red', 'blue', 30)                   // "color-mix(in srgb, red 30%, blue)"
 * color.mix(theme.primary, 'white', 20)          // "color-mix(in srgb, var(--theme-primary) 20%, white)"
 * color.mix('red', 'blue', 50, 'oklch')          // "color-mix(in oklch, red 50%, blue)"
 * ```
 */
export function mix(
  color1: string,
  color2: string,
  percentage?: number,
  colorSpace: ColorMixSpace = 'srgb',
): string {
  const c1 = percentage != null ? `${color1} ${percentage}%` : color1;
  return `color-mix(in ${colorSpace}, ${c1}, ${color2})`;
}

/**
 * `light-dark(lightColor, darkColor)`
 *
 * Uses the `light-dark()` CSS function that resolves based on
 * the computed `color-scheme` of the element.
 *
 * @example
 * ```ts
 * color.lightDark('#111', '#eee')                     // "light-dark(#111, #eee)"
 * color.lightDark(theme.textLight, theme.textDark)     // "light-dark(var(--theme-textLight), var(--theme-textDark))"
 * ```
 */
export function lightDark(lightColor: string, darkColor: string): string {
  return `light-dark(${lightColor}, ${darkColor})`;
}

/**
 * Adjust the alpha/opacity of any color using `color-mix()`.
 *
 * This is a common pattern: mixing a color with transparent to change opacity.
 * Works with any color value including token references.
 *
 * @example
 * ```ts
 * color.alpha('red', 0.5)              // "color-mix(in srgb, red 50%, transparent)"
 * color.alpha(theme.primary, 0.2)      // "color-mix(in srgb, var(--theme-primary) 20%, transparent)"
 * color.alpha('#0066ff', 0.8, 'oklch') // "color-mix(in oklch, #0066ff 80%, transparent)"
 * ```
 */
export function alpha(
  colorValue: string,
  opacity: number,
  colorSpace: ColorMixSpace = 'srgb',
): string {
  const percentage = Math.round(opacity * 100);
  return `color-mix(in ${colorSpace}, ${colorValue} ${percentage}%, transparent)`;
}
