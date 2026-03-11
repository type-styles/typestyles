'use client';

import { useTheme } from './ThemeProvider';
import { navStyles } from '../styles/navbar';

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className={navStyles.nav}>
      <div className={navStyles.navInner}>
        <div className={navStyles.navLeft}>
          <a href="/" className={navStyles.logo}>
            <span className={navStyles.logoIcon}>T</span>
            <span>typestyles</span>
          </a>
          <a href="#" className={navStyles.navLink}>
            Docs
          </a>
          <a href="#" className={navStyles.navLink}>
            Components
          </a>
          <a href="#" className={navStyles.navLink}>
            Blocks
          </a>
        </div>
        <div className={navStyles.navCenter}>
          <input
            type="search"
            placeholder="Search documentation..."
            className={navStyles.searchInput}
            aria-label="Search documentation"
          />
        </div>
        <div className={navStyles.navRight}>
          <span className={navStyles.badge()}>v0.3.0</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className={navStyles.iconButton}
            aria-label="View on GitHub"
          >
            <GithubIcon />
          </a>
          <button
            onClick={toggleTheme}
            className={navStyles.iconButton}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <a href="#" className={navStyles.primaryButton}>
            New
          </a>
        </div>
      </div>
    </nav>
  );
}
