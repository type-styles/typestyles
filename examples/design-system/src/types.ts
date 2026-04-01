import type { DesignComponentValues } from './tokens/component';
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

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K];
};

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

export type DesignThemeConfig = {
  name: string;
  light: DesignSemanticValues;
  dark: DeepPartial<DesignSemanticValues>;
  primitives?: DesignPrimitiveOverrides;
  components?: Partial<DesignComponentValues>;
};

export type DesignTheme = {
  className: string;
  name: string;
  lightValues: DesignSemanticValues;
  darkValues: DeepPartial<DesignSemanticValues>;
  primitiveOverrides?: DesignPrimitiveOverrides;
};

export type { DesignColorValues, DesignSyntaxValues };
