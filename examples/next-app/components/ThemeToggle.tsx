'use client';

import type { JSX } from 'react';
import { styles } from 'typestyles';
import { useTheme } from './ThemeProvider';

const toggle = styles.component('theme-toggle', {
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
});

const option = styles.component('theme-option', {
  base: {
    padding: '4px 16px',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 200ms ease',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-textMuted)',
    cursor: 'pointer',
  },

  active: {
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
  },
});

export function ThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className={toggle()} onClick={toggleTheme}>
      <span className={option({ active: theme === 'light' })}>Light</span>
      <span className={option({ active: theme === 'dark' })}>Dark</span>
    </button>
  );
}
