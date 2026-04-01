import type { JSX, ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { defaultTheme as baseTheme } from './tokens';

type ThemeName = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(' ');
}

export type DesignSystemProviderProps = {
  children: ReactNode;
  defaultTheme?: ThemeName;
  theme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
  customThemeClassName?: string;
};

export function DesignSystemProvider({
  children,
  defaultTheme = 'light',
  theme: controlledTheme,
  onThemeChange,
  customThemeClassName,
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

  return (
    <ThemeContext.Provider value={value}>
      <div
        className={cx(baseTheme.className, customThemeClassName)}
        data-mode={dataMode}
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
