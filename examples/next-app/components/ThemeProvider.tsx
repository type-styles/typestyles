'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import type { JSX, ReactNode } from 'react';
import { lightTheme, darkTheme } from '../styles/tokens';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const className = theme === 'dark' ? darkTheme : lightTheme;
    document.documentElement.className = className;
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = (): void => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const themeClass = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={themeClass} style={{ display: 'contents' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
