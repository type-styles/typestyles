import type { TokensApi } from 'typestyles';

export function createReferenceThemes(tokensApi: TokensApi) {
  const dark = tokensApi.createTheme('dark', {
    base: {
      color: {
        primary: '#3b82f6',
        primaryHover: '#60a5fa',
        secondary: '#9ca3af',
        secondaryHover: '#d1d5db',
        surface: '#1f2937',
        surfaceRaised: '#374151',
        surfaceOverlay: '#374151',
        background: '#111827',
        backgroundSubtle: '#1f2937',
        text: '#f9fafb',
        textSecondary: '#d1d5db',
        textMuted: '#9ca3af',
        textOnAccent: '#ffffff',
        border: '#374151',
        borderStrong: '#4b5563',
        borderFocus: '#3b82f6',
        danger: '#ef4444',
        dangerHover: '#f87171',
        dangerSubtle: 'rgba(239,68,68,0.15)',
        success: '#22c55e',
        successSubtle: 'rgba(34,197,94,0.15)',
        warning: '#f59e0b',
        warningSubtle: 'rgba(245,158,11,0.15)',
        info: '#06b6d4',
        infoSubtle: 'rgba(6,182,212,0.15)',
        overlay: 'rgba(0,0,0,0.7)',
      },
    },
  });

  const highContrast = tokensApi.createTheme('high-contrast', {
    base: {
      color: {
        primary: '#1d4ed8',
        primaryHover: '#1e40af',
        text: '#000000',
        textSecondary: '#1f2937',
        textMuted: '#374151',
        border: '#000000',
        borderStrong: '#000000',
      },
    },
  });

  const warm = tokensApi.createTheme('warm', {
    base: {
      color: {
        primary: '#d97706',
        primaryHover: '#b45309',
        surface: '#fffbeb',
        surfaceRaised: '#fef3c7',
        surfaceOverlay: '#fde68a',
        background: '#fffbeb',
        backgroundSubtle: '#fef3c7',
        border: '#fbbf24',
        borderStrong: '#f59e0b',
      },
    },
  });

  return { dark, highContrast, warm };
}

export type ReferenceThemes = ReturnType<typeof createReferenceThemes>;
