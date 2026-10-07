import type { ThemeOverrides, Theme } from 'typestyles';
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
 * Palette config for `createDesignTheme`: separate light/dark trees are zipped into
 * mode-aware `{ light, dark }` leaves for `tokens.createTheme`.
 */
export type DesignThemeConfig = {
  name: string;
  light: ThemeOverrides;
  dark: ThemeOverrides;
};

/** Same as typestyles `Theme` — class name + name for a palette from `createDesignTheme`. */
export type DesignTheme = Theme;

export type { DesignColorValues, DesignSyntaxValues };
