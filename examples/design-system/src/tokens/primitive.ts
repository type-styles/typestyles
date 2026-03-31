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
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
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

export const shadowValues = {
  xs: '0 1px 2px rgb(0 0 0 / 0.06)',
  sm: '0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

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
  overlayFade: 'opacity var(--duration-slow) var(--easing-standard), visibility var(--duration-slow) var(--easing-standard)',
  panelEnter: 'opacity var(--duration-slow) var(--easing-emphasized)',
  backdrop: 'opacity var(--duration-slow) var(--easing-standard)',
  surfaceFast: 'background-color var(--duration-fast) var(--easing-standard)',
  colorShift:
    'color var(--duration-medium) var(--easing-standard), text-decoration-color var(--duration-medium) var(--easing-standard)',
  controlSurface:
    'background-color var(--duration-medium) var(--easing-standard), border-color var(--duration-medium) var(--easing-standard)',
} as const;

export type DesignSpaceValues = typeof spaceValues;
export type DesignRadiusValues = typeof radiusValues;
export type DesignFontFamilyValues = typeof fontFamilyValues;
export type DesignFontSizeValues = typeof fontSizeValues;
export type DesignFontWeightValues = typeof fontWeightValues;
export type DesignLineHeightValues = typeof lineHeightValues;
export type DesignShadowValues = typeof shadowValues;
export type DesignDurationValues = typeof durationValues;
export type DesignEasingValues = typeof easingValues;
export type DesignTransitionValues = typeof transitionValues;

export type DesignPrimitiveValues = {
  space: DesignSpaceValues;
  radius: DesignRadiusValues;
  fontFamily: DesignFontFamilyValues;
  fontSize: DesignFontSizeValues;
  fontWeight: DesignFontWeightValues;
  lineHeight: DesignLineHeightValues;
  shadow: DesignShadowValues;
  duration: DesignDurationValues;
  easing: DesignEasingValues;
  transition: DesignTransitionValues;
};
