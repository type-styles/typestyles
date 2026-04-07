import type { JSX, ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { cx } from 'typestyles';
import { defaultTheme as baseTheme } from './tokens';

type ThemeName = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export type DesignSystemProviderProps = {
  children: ReactNode;
  defaultTheme?: ThemeName;
  theme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
  customThemeClassName?: string;
  /**
   * When true, skip applying `defaultTheme` / `data-mode` on the wrapper — use when the theme
   * surface already lives on `document.documentElement` (docs-style appearance bootstrap).
   */
  omitWrapperThemeSurface?: boolean;
};

export function DesignSystemProvider({
  children,
  defaultTheme = 'light',
  theme: controlledTheme,
  onThemeChange,
  customThemeClassName,
  omitWrapperThemeSurface = false,
}: DesignSystemProviderProps): JSX.Element {
  const [uncontrolledTheme, setUncontrolledTheme] = useState<ThemeName>(defaultTheme);

  const theme = controlledTheme ?? uncontrolledTheme;
  const setTheme = (nextTheme: ThemeName): void => {
    if (controlledTheme === undefined) {
      setUncontrolledTheme(nextTheme);
    }
    onThemeChange?.(nextTheme);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme],
  );

  const dataMode = theme;

  const surfaceClassName = omitWrapperThemeSurface
    ? customThemeClassName
    : cx(baseTheme.className, customThemeClassName);

  return (
    <ThemeContext.Provider value={value}>
      <div
        className={surfaceClassName}
        data-mode={omitWrapperThemeSurface ? undefined : dataMode}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useDesignSystemTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useDesignSystemTheme must be used inside DesignSystemProvider');
  }
  return context;
}
