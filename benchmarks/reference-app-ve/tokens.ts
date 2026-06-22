import { createThemeContract, createGlobalTheme } from '@vanilla-extract/css';

export function createVeTokens() {
  const color = createThemeContract({
    primary: '',
    primaryHover: '',
    secondary: '',
    secondaryHover: '',
    surface: '',
    surfaceRaised: '',
    surfaceOverlay: '',
    background: '',
    backgroundSubtle: '',
    text: '',
    textSecondary: '',
    textMuted: '',
    textOnAccent: '',
    border: '',
    borderStrong: '',
    borderFocus: '',
    danger: '',
    dangerHover: '',
    dangerSubtle: '',
    success: '',
    successSubtle: '',
    warning: '',
    warningSubtle: '',
    info: '',
    infoSubtle: '',
    overlay: '',
  });

  const space = createThemeContract({
    px: '',
    '0_5': '',
    '1': '',
    '1_5': '',
    '2': '',
    '2_5': '',
    '3': '',
    '4': '',
    '5': '',
    '6': '',
    '8': '',
    '10': '',
    '12': '',
    '16': '',
    '20': '',
  });

  const radius = createThemeContract({
    none: '',
    sm: '',
    md: '',
    lg: '',
    xl: '',
    '2xl': '',
    full: '',
  });

  const typography = createThemeContract({
    fontFamily: { sans: '', mono: '' },
    fontSize: { xs: '', sm: '', md: '', lg: '', xl: '', '2xl': '', '3xl': '', '4xl': '' },
    fontWeight: { normal: '', medium: '', semibold: '', bold: '' },
    lineHeight: { tight: '', normal: '', relaxed: '' },
  });

  const shadow = createThemeContract({ sm: '', md: '', lg: '', xl: '' });
  const duration = createThemeContract({ fast: '', normal: '', slow: '' });
  const easing = createThemeContract({ standard: '', emphasized: '', decelerate: '' });
  const zIndex = createThemeContract({
    dropdown: '',
    sticky: '',
    modal: '',
    popover: '',
    tooltip: '',
  });

  createGlobalTheme(':root', color, {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    secondary: '#6b7280',
    secondaryHover: '#4b5563',
    surface: '#ffffff',
    surfaceRaised: '#f9fafb',
    surfaceOverlay: '#f3f4f6',
    background: '#ffffff',
    backgroundSubtle: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    textOnAccent: '#ffffff',
    border: '#e5e7eb',
    borderStrong: '#d1d5db',
    borderFocus: '#2563eb',
    danger: '#dc2626',
    dangerHover: '#b91c1c',
    dangerSubtle: '#fef2f2',
    success: '#16a34a',
    successSubtle: '#f0fdf4',
    warning: '#d97706',
    warningSubtle: '#fffbeb',
    info: '#0891b2',
    infoSubtle: '#ecfeff',
    overlay: 'rgba(0,0,0,0.5)',
  });

  createGlobalTheme(':root', space, {
    px: '1px',
    '0_5': '2px',
    '1': '4px',
    '1_5': '6px',
    '2': '8px',
    '2_5': '10px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
    '10': '40px',
    '12': '48px',
    '16': '64px',
    '20': '80px',
  });

  createGlobalTheme(':root', radius, {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  });

  createGlobalTheme(':root', typography, {
    fontFamily: {
      sans: 'system-ui, -apple-system, sans-serif',
      mono: '"JetBrains Mono", ui-monospace, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
    lineHeight: { tight: '1.25', normal: '1.5', relaxed: '1.625' },
  });

  createGlobalTheme(':root', shadow, {
    sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.1)',
  });

  createGlobalTheme(':root', duration, { fast: '100ms', normal: '200ms', slow: '300ms' });
  createGlobalTheme(':root', easing, {
    standard: 'ease',
    emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  });
  createGlobalTheme(':root', zIndex, {
    dropdown: '1000',
    sticky: '1100',
    modal: '1300',
    popover: '1400',
    tooltip: '1500',
  });

  return { color, space, radius, typography, shadow, duration, easing, zIndex };
}

export type VeTokens = ReturnType<typeof createVeTokens>;
