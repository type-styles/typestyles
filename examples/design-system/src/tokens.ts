import { tokens } from 'typestyles';

const colorValues = {
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  text: '#0f172a',
  textMuted: '#475569',
  border: '#cbd5e1',
  borderStrong: '#94a3b8',
  accent: '#2563eb',
  accentHover: '#1d4ed8',
  accentForeground: '#ffffff',
  danger: '#dc2626',
  success: '#16a34a',
  focusRing: '#60a5fa',
  overlay: 'rgb(15 23 42 / 0.55)',
} as const;

const spaceValues = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
} as const;

const radiusValues = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  full: '9999px',
} as const;

const fontValues = {
  family: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  sizeSm: '13px',
  sizeMd: '14px',
  sizeLg: '16px',
  weightRegular: '400',
  weightMedium: '500',
  weightSemibold: '600',
} as const;

const shadowValues = {
  sm: '0 1px 2px rgb(15 23 42 / 0.08)',
  md: '0 8px 30px rgb(15 23 42 / 0.16)',
} as const;

export type DesignColorValues = typeof colorValues;
export type DesignSpaceValues = typeof spaceValues;
export type DesignRadiusValues = typeof radiusValues;
export type DesignFontValues = typeof fontValues;
export type DesignShadowValues = typeof shadowValues;
type DesignColorOverrides = Partial<Record<keyof DesignColorValues, string>>;
type DesignSpaceOverrides = Partial<Record<keyof DesignSpaceValues, string>>;
type DesignRadiusOverrides = Partial<Record<keyof DesignRadiusValues, string>>;
type DesignFontOverrides = Partial<Record<keyof DesignFontValues, string>>;
type DesignShadowOverrides = Partial<Record<keyof DesignShadowValues, string>>;

export const designTokens = {
  color: tokens.create('ds-color', colorValues),
  space: tokens.create('ds-space', spaceValues),
  radius: tokens.create('ds-radius', radiusValues),
  font: tokens.create('ds-font', fontValues),
  shadow: tokens.create('ds-shadow', shadowValues),
} as const;

export type DesignThemeOverrides = Partial<{
  color: DesignColorOverrides;
  space: DesignSpaceOverrides;
  radius: DesignRadiusOverrides;
  font: DesignFontOverrides;
  shadow: DesignShadowOverrides;
}>;

export function createDesignSystemTheme(name: string, overrides: DesignThemeOverrides): string {
  const themeOverrides: Record<string, Record<string, string>> = {};

  if (overrides.color) {
    themeOverrides['ds-color'] = overrides.color as Record<string, string>;
  }
  if (overrides.space) {
    themeOverrides['ds-space'] = overrides.space as Record<string, string>;
  }
  if (overrides.radius) {
    themeOverrides['ds-radius'] = overrides.radius as Record<string, string>;
  }
  if (overrides.font) {
    themeOverrides['ds-font'] = overrides.font as Record<string, string>;
  }
  if (overrides.shadow) {
    themeOverrides['ds-shadow'] = overrides.shadow as Record<string, string>;
  }

  return tokens.createTheme(`ds-${name}`, themeOverrides);
}

export const darkThemeClass = createDesignSystemTheme('dark', {
  color: {
    bg: '#020617',
    surface: '#0f172a',
    surfaceMuted: '#1e293b',
    text: '#f8fafc',
    textMuted: '#cbd5e1',
    border: '#334155',
    borderStrong: '#475569',
    accent: '#3b82f6',
    accentHover: '#60a5fa',
    accentForeground: '#eff6ff',
    danger: '#f87171',
    success: '#34d399',
    focusRing: '#93c5fd',
    overlay: 'rgb(2 6 23 / 0.65)',
  },
});
