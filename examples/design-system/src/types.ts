import type { ThemeOverrides, ThemeSurface } from 'typestyles';
import type { DesignColorValues, DesignSyntaxValues } from './tokens/semantic';
import type {
  DesignDurationValues,
  DesignEasingValues,
  DesignFontFamilyValues,
  DesignFontSizeValues,
  DesignFontWeightValues,
  DesignLineHeightValues,
  DesignRadiusValues,
  DesignShadowValues,
  DesignSpaceValues,
  DesignTransitionValues,
} from './tokens/primitive';

export type DesignSemanticValues = {
  color: DesignColorValues;
  syntax: DesignSyntaxValues;
};

export type DesignPrimitiveOverrides = {
  space?: Partial<DesignSpaceValues>;
  radius?: Partial<DesignRadiusValues>;
  fontFamily?: Partial<DesignFontFamilyValues>;
  fontSize?: Partial<DesignFontSizeValues>;
  fontWeight?: Partial<DesignFontWeightValues>;
  lineHeight?: Partial<DesignLineHeightValues>;
  shadow?: Partial<DesignShadowValues>;
  duration?: Partial<DesignDurationValues>;
  easing?: Partial<DesignEasingValues>;
  transition?: Partial<DesignTransitionValues>;
};

/**
 * Palette config aligned with `tokens.createTheme`: `base` is the light surface;
 * `dark` is the dark-mode override layer (same shape as `ThemeOverrides`).
 */
export type DesignThemeConfig = {
  name: string;
  light: ThemeOverrides;
  dark: ThemeOverrides;
};

/** Same as typestyles `ThemeSurface` — class name + name for a palette from `createDesignTheme`. */
export type DesignTheme = ThemeSurface;

export type { DesignColorValues, DesignSyntaxValues };
