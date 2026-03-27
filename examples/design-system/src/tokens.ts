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
  warning: '#d97706',
  /** Text on solid warning surfaces (amber) — dark for contrast. */
  warningForeground: '#422006',
  tip: '#7c3aed',
  tipForeground: '#ffffff',
  /** Filled alert surfaces — dark enough for white labels in light and dark UI. */
  alertSuccessFill: '#15803d',
  alertDangerFill: '#b91c1c',
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

/** Semantic colors for syntax highlighting (oklch ramps). */
export const codeSyntaxLightValues = {
  base: 'oklch(24.8% 0.008 264)',
  keyword: 'oklch(54.5% 0.24 301)',
  title: 'oklch(58.5% 0.22 248)',
  attr: 'oklch(50% 0.18 68)',
  string: 'oklch(53.2% 0.18 178)',
  builtIn: 'oklch(56.5% 0.22 48)',
  comment: 'oklch(66.4% 0.014 264)',
  name: 'oklch(57.5% 0.18 29)',
  section: 'oklch(55.2% 0.24 271)',
  bullet: 'oklch(55.5% 0.22 66)',
  addition: 'oklch(58.8% 0.22 176)',
  additionBg: 'oklch(99.3% 0.01 160)',
  deletion: 'oklch(57.5% 0.18 29)',
  deletionBg: 'oklch(99.7% 0.008 25)',
} as const;

export const codeSyntaxDarkValues = {
  base: 'oklch(90% 0.002 264)',
  keyword: 'oklch(79.5% 0.17 295)',
  title: 'oklch(82.5% 0.16 245)',
  attr: 'oklch(77.2% 0.24 60)',
  string: 'oklch(81.5% 0.2 170)',
  builtIn: 'oklch(79.5% 0.22 45)',
  comment: 'oklch(77.5% 0.012 264)',
  name: 'oklch(80.3% 0.22 27.5)',
  section: 'oklch(79% 0.17 265)',
  bullet: 'oklch(67.5% 0.28 62)',
  addition: 'oklch(81.5% 0.2 170)',
  additionBg: 'oklch(18% 0.04 170)',
  deletion: 'oklch(80.3% 0.22 27.5)',
  deletionBg: 'oklch(18% 0.04 30)',
} as const;

/** Convenience export for apps that need plain colors (not CSS vars), e.g. charts or legacy prose. */
export const codeSyntaxBrandPalettes = {
  light: codeSyntaxLightValues,
  dark: codeSyntaxDarkValues,
} as const;

export type DesignColorValues = typeof colorValues;
export type DesignSpaceValues = typeof spaceValues;
export type DesignRadiusValues = typeof radiusValues;
export type DesignFontValues = typeof fontValues;
export type DesignShadowValues = typeof shadowValues;
export type DesignCodeSyntaxValues = typeof codeSyntaxLightValues;
type DesignColorOverrides = Partial<Record<keyof DesignColorValues, string>>;
type DesignSpaceOverrides = Partial<Record<keyof DesignSpaceValues, string>>;
type DesignRadiusOverrides = Partial<Record<keyof DesignRadiusValues, string>>;
type DesignFontOverrides = Partial<Record<keyof DesignFontValues, string>>;
type DesignShadowOverrides = Partial<Record<keyof DesignShadowValues, string>>;
type DesignCodeSyntaxOverrides = Partial<Record<keyof DesignCodeSyntaxValues, string>>;

export const designTokens = {
  color: tokens.create('ds-color', colorValues),
  space: tokens.create('ds-space', spaceValues),
  radius: tokens.create('ds-radius', radiusValues),
  font: tokens.create('ds-font', fontValues),
  shadow: tokens.create('ds-shadow', shadowValues),
  codeSyntax: tokens.create('ds-code-syntax', codeSyntaxLightValues),
} as const;

export type DesignThemeOverrides = Partial<{
  color: DesignColorOverrides;
  space: DesignSpaceOverrides;
  radius: DesignRadiusOverrides;
  font: DesignFontOverrides;
  shadow: DesignShadowOverrides;
  codeSyntax: DesignCodeSyntaxOverrides;
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
  if (overrides.codeSyntax) {
    themeOverrides['ds-code-syntax'] = overrides.codeSyntax as Record<string, string>;
  }

  return tokens.createTheme(`ds-${name}`, themeOverrides);
}

/** Dark `ds-color` overrides — re-use in apps (e.g. docs `theme-docs-dark`) so recipes stay in sync. */
export const designColorDarkValues = {
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
  warning: '#fbbf24',
  warningForeground: '#1c1917',
  tip: '#a78bfa',
  tipForeground: '#1e1b4b',
  alertSuccessFill: '#166534',
  alertDangerFill: '#991b1b',
  focusRing: '#93c5fd',
  overlay: 'rgb(2 6 23 / 0.65)',
} as const satisfies Partial<Record<keyof typeof colorValues, string>>;

const forestLight = {
  bg: '#f4faf7',
  surface: '#ffffff',
  surfaceMuted: '#e8f5ef',
  text: '#0f1f17',
  textMuted: '#3f5d4f',
  border: '#b8d4c4',
  borderStrong: '#6b9a82',
  accent: '#059669',
  accentHover: '#047857',
  accentForeground: '#ffffff',
  danger: '#dc2626',
  success: '#15803d',
  warning: '#ca8a04',
  warningForeground: '#422006',
  tip: '#7c3aed',
  tipForeground: '#ffffff',
  alertSuccessFill: '#15803d',
  alertDangerFill: '#b91c1c',
  focusRing: '#34d399',
  overlay: 'rgb(15 31 23 / 0.55)',
} as const satisfies Record<keyof typeof colorValues, string>;

const forestDark = {
  bg: '#051c14',
  surface: '#0d281c',
  surfaceMuted: '#143d2c',
  text: '#ecfdf5',
  textMuted: '#86efac',
  border: '#166534',
  borderStrong: '#22c55e',
  accent: '#34d399',
  accentHover: '#6ee7b7',
  accentForeground: '#022c22',
  danger: '#fca5a5',
  success: '#4ade80',
  warning: '#fbbf24',
  warningForeground: '#1c1917',
  tip: '#c4b5fd',
  tipForeground: '#1e1b4b',
  alertSuccessFill: '#166534',
  alertDangerFill: '#991b1b',
  focusRing: '#6ee7b7',
  overlay: 'rgb(5 28 20 / 0.65)',
} as const satisfies Record<keyof typeof colorValues, string>;

const roseLight = {
  bg: '#fff5f6',
  surface: '#ffffff',
  surfaceMuted: '#ffe4e9',
  text: '#1c0a0f',
  textMuted: '#6b3d4a',
  border: '#f0b6c4',
  borderStrong: '#e17a8f',
  accent: '#e11d48',
  accentHover: '#be123c',
  accentForeground: '#ffffff',
  danger: '#b91c1c',
  success: '#15803d',
  warning: '#ca8a04',
  warningForeground: '#422006',
  tip: '#7c3aed',
  tipForeground: '#ffffff',
  alertSuccessFill: '#15803d',
  alertDangerFill: '#991b1b',
  focusRing: '#fb7185',
  overlay: 'rgb(28 10 15 / 0.5)',
} as const satisfies Record<keyof typeof colorValues, string>;

const roseDark = {
  bg: '#14080d',
  surface: '#2a121c',
  surfaceMuted: '#3d1d2a',
  text: '#fff1f2',
  textMuted: '#fda4af',
  border: '#831843',
  borderStrong: '#a21caf',
  accent: '#fb7185',
  accentHover: '#fda4af',
  accentForeground: '#4c0519',
  danger: '#fca5a5',
  success: '#4ade80',
  warning: '#fbbf24',
  warningForeground: '#1c1917',
  tip: '#ddd6fe',
  tipForeground: '#1e1b4b',
  alertSuccessFill: '#166534',
  alertDangerFill: '#991b1b',
  focusRing: '#fb7185',
  overlay: 'rgb(20 8 13 / 0.65)',
} as const satisfies Record<keyof typeof colorValues, string>;

const amberLight = {
  bg: '#fffbeb',
  surface: '#ffffff',
  surfaceMuted: '#fef3c7',
  text: '#1c1410',
  textMuted: '#57534e',
  border: '#e7d4b8',
  borderStrong: '#bfa27a',
  accent: '#d97706',
  accentHover: '#b45309',
  accentForeground: '#ffffff',
  danger: '#dc2626',
  success: '#15803d',
  warning: '#b45309',
  warningForeground: '#422006',
  tip: '#7c3aed',
  tipForeground: '#ffffff',
  alertSuccessFill: '#15803d',
  alertDangerFill: '#b91c1c',
  focusRing: '#f59e0b',
  overlay: 'rgb(28 20 16 / 0.55)',
} as const satisfies Record<keyof typeof colorValues, string>;

const amberDark = {
  bg: '#0f0a06',
  surface: '#1c1410',
  surfaceMuted: '#29221c',
  text: '#fffbeb',
  textMuted: '#d6d3d1',
  border: '#57534e',
  borderStrong: '#78716c',
  accent: '#fbbf24',
  accentHover: '#fcd34d',
  accentForeground: '#422006',
  danger: '#fca5a5',
  success: '#4ade80',
  warning: '#fcd34d',
  warningForeground: '#1c1917',
  tip: '#c4b5fd',
  tipForeground: '#1e1b4b',
  alertSuccessFill: '#166534',
  alertDangerFill: '#991b1b',
  focusRing: '#fbbf24',
  overlay: 'rgb(15 10 6 / 0.65)',
} as const satisfies Record<keyof typeof colorValues, string>;

/**
 * Named color modes for demos / docs — each entry is a full `ds-color` map for light and dark UI.
 */
export const designColorPalettes = {
  default: {
    light: colorValues,
    dark: designColorDarkValues,
  },
  forest: { light: forestLight, dark: forestDark },
  rose: { light: roseLight, dark: roseDark },
  amber: { light: amberLight, dark: amberDark },
} as const;

export type DesignPaletteId = keyof typeof designColorPalettes;

export const designPaletteList = [
  { id: 'default' as const, label: 'Slate' },
  { id: 'forest' as const, label: 'Forest' },
  { id: 'rose' as const, label: 'Rose' },
  { id: 'amber' as const, label: 'Amber' },
] satisfies ReadonlyArray<{ id: DesignPaletteId; label: string }>;

export const darkThemeClass = createDesignSystemTheme('dark', {
  color: designColorDarkValues,
  codeSyntax: codeSyntaxDarkValues,
});
