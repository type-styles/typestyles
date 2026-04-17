export const spaceValues = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  8: '48px',
  12: '64px',
} as const;

export const radiusValues = {
  none: '0',
  sm: '0',
  md: '0',
  lg: '0',
  xl: '0',
  full: '0',
} as const;

export const fontFamilyValues = {
  sans: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  mono: "ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, monospace",
} as const;

export const fontSizeValues = {
  xs: '11px',
  sm: '13px',
  md: '14px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
} as const;

export const fontWeightValues = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeightValues = {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.625',
} as const;

export type DesignShadowKeys = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type DesignShadowValues = Record<DesignShadowKeys, string>;

export const shadowValues: DesignShadowValues = {
  xs: '2px 2px 0 0 #000',
  sm: '3px 3px 0 0 #000',
  md: '4px 4px 0 0 #000',
  lg: '6px 6px 0 0 #000',
  xl: '8px 8px 0 0 #000',
};

export const durationValues = {
  fast: '80ms',
  medium: '140ms',
  slow: '220ms',
} as const;

export const easingValues = {
  standard: 'ease',
  emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const transitionValues = {
  overlayFade:
    'opacity var(--duration-slow) var(--easing-standard), visibility var(--duration-slow) var(--easing-standard)',
  panelEnter: 'opacity var(--duration-slow) var(--easing-emphasized)',
  backdrop: 'opacity var(--duration-slow) var(--easing-standard)',
  surfaceFast: 'background-color var(--duration-fast) var(--easing-standard)',
  colorShift:
    'color var(--duration-medium) var(--easing-standard), text-decoration-color var(--duration-medium) var(--easing-standard)',
  controlSurface:
    'background-color var(--duration-medium) var(--easing-standard), border-color var(--duration-medium) var(--easing-standard)',
} as const;

export const borderWidthValues = {
  thin: '2px',
  default: '3px',
  thick: '4px',
} as const;

export type DesignSpaceValues = typeof spaceValues;
export type DesignRadiusValues = typeof radiusValues;
export type DesignBorderWidthValues = typeof borderWidthValues;
export type DesignFontFamilyValues = typeof fontFamilyValues;
export type DesignFontSizeValues = typeof fontSizeValues;
export type DesignFontWeightValues = typeof fontWeightValues;
export type DesignLineHeightValues = typeof lineHeightValues;
export type DesignDurationValues = typeof durationValues;
export type DesignEasingValues = typeof easingValues;
export type DesignTransitionValues = typeof transitionValues;

export type DesignPrimitiveValues = {
  space: DesignSpaceValues;
  radius: DesignRadiusValues;
  borderWidth: DesignBorderWidthValues;
  fontFamily: DesignFontFamilyValues;
  fontSize: DesignFontSizeValues;
  fontWeight: DesignFontWeightValues;
  lineHeight: DesignLineHeightValues;
  shadow: DesignShadowValues;
  duration: DesignDurationValues;
  easing: DesignEasingValues;
  transition: DesignTransitionValues;
};
