/**
 * Type-safe helpers for CSS color functions.
 *
 * Each function returns a plain CSS string — no runtime color math.
 * Works naturally with token references since tokens are strings too.
 */

type ColorValue = string | number;

/** Relative-color function names — intentionally not the same union as `ColorMixSpace` (`srgb`, `display-p3`, …). */
export type RelativeColorSpace = 'rgb' | 'hsl' | 'hwb' | 'lab' | 'lch' | 'oklab' | 'oklch';

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

/**
 * Relative color syntax — manipulate channels from a source color.
 *
 * Blends two colors with {@link mix}; changes opacity only with {@link alpha}.
 * Use `from` when you need the same hue/chroma with different lightness, or
 * other single-source channel tweaks.
 *
 * @example
 * ```ts
 * color.from('oklch', theme.primary, 'l c h');
 * // "oklch(from var(--theme-primary) l c h)"
 *
 * color.from('oklch', theme.primary, 'calc(l - 0.1) c h');
 * // "oklch(from var(--theme-primary) calc(l - 0.1) c h)"
 *
 * color.from('rgb', '#0066ff', 'r g b', 0.5);
 * // "rgb(from #0066ff r g b / 0.5)"
 * ```
 */
export function from(
  space: RelativeColorSpace,
  source: string,
  components: string,
  alpha?: ColorValue,
): string {
  if (alpha != null) return `${space}(from ${source} ${components} / ${alpha})`;
  return `${space}(from ${source} ${components})`;
}

/**
 * `rgb(from source r g b)` relative color syntax.
 *
 * @example
 * ```ts
 * rgbFrom(theme.primary, 'r', 'g', 'b', 0.5);
 * // "rgb(from var(--theme-primary) r g b / 0.5)"
 * ```
 */
export function rgbFrom(
  source: string,
  r: ColorValue | 'r',
  g: ColorValue | 'g',
  b: ColorValue | 'b',
  alpha?: ColorValue | 'alpha',
): string {
  if (alpha != null) return `rgb(from ${source} ${r} ${g} ${b} / ${alpha})`;
  return `rgb(from ${source} ${r} ${g} ${b})`;
}

/**
 * `oklch(from source l c h)` relative color syntax.
 *
 * @example
 * ```ts
 * oklchFrom(theme.primary, 'calc(l - 0.1)', 'c', 'h');
 * // "oklch(from var(--theme-primary) calc(l - 0.1) c h)"
 * ```
 */
export function oklchFrom(
  source: string,
  l: ColorValue | 'l',
  c: ColorValue | 'c',
  h: ColorValue | 'h',
  alpha?: ColorValue | 'alpha',
): string {
  if (alpha != null) return `oklch(from ${source} ${l} ${c} ${h} / ${alpha})`;
  return `oklch(from ${source} ${l} ${c} ${h})`;
}

/**
 * Lighten a color by adding to its OKLCH lightness channel.
 *
 * Not Sass-compatible — this is an OKLCH channel delta, not HSL `lighten()`.
 *
 * @example
 * ```ts
 * lighten(theme.primary, 0.1);
 * // "oklch(from var(--theme-primary) calc(l + 0.1) c h)"
 * ```
 */
export function lighten(source: string, amount: ColorValue): string {
  return oklchFrom(source, `calc(l + ${amount})`, 'c', 'h');
}

/**
 * Darken a color by subtracting from its OKLCH lightness channel.
 *
 * @example
 * ```ts
 * darken(theme.primary, '10%');
 * // "oklch(from var(--theme-primary) calc(l - 10%) c h)"
 * ```
 */
export function darken(source: string, amount: ColorValue): string {
  return oklchFrom(source, `calc(l - ${amount})`, 'c', 'h');
}

/**
 * Increase chroma multiplicatively in OKLCH.
 *
 * @example
 * ```ts
 * saturate(theme.primary, 1.2);
 * // "oklch(from var(--theme-primary) l calc(c * 1.2) h)"
 * ```
 */
export function saturate(source: string, factor: ColorValue): string {
  return oklchFrom(source, 'l', `calc(c * ${factor})`, 'h');
}

/**
 * Decrease chroma multiplicatively in OKLCH (symmetrical with {@link saturate}).
 *
 * @example
 * ```ts
 * desaturate(theme.primary, 0.5);
 * // "oklch(from var(--theme-primary) l calc(c * 0.5) h)"
 * ```
 */
export function desaturate(source: string, factor: ColorValue): string {
  return oklchFrom(source, 'l', `calc(c * ${factor})`, 'h');
}

/**
 * Rotate hue in OKLCH (browser normalizes the result).
 *
 * @example
 * ```ts
 * rotate(theme.primary, 30);
 * // "oklch(from var(--theme-primary) l c calc(h + 30))"
 * ```
 */
export function rotate(source: string, degrees: ColorValue): string {
  return oklchFrom(source, 'l', 'c', `calc(h + ${degrees})`);
}

/**
 * Zero chroma while preserving OKLCH lightness and hue.
 *
 * @example
 * ```ts
 * grayscale(theme.primary);
 * // "oklch(from var(--theme-primary) l 0 h)"
 * ```
 */
export function grayscale(source: string): string {
  return oklchFrom(source, 'l', 0, 'h');
}
