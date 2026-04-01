'use client';

import { styles } from 'typestyles';
import { colors, spacing, borderRadius } from '../styles/tokens';

export const navStyles = {
  nav: styles.class('nav', {
    display: 'flex',
    height: '3.5rem',
    borderBottom: `1px solid ${colors.border}`,
    alignItems: 'center',
    padding: `0 ${spacing[6]}`,
    backgroundColor: colors.background,
    position: 'sticky',
    top: 0,
    zIndex: 50,
  }),

  navInner: styles.class('nav-inner', {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    gap: spacing[6],
  }),

  navLeft: styles.class('nav-left', {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[6],
    flexShrink: 0,
  }),

  navCenter: styles.class('nav-center', {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '400px',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  }),

  navRight: styles.class('nav-right', {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    flexShrink: 0,
  }),

  logo: styles.class('logo', {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    fontWeight: '600',
    fontSize: '0.9375rem',
    color: colors.foreground,
    textDecoration: 'none',
    transition: 'opacity 0.15s ease',
    '&:hover': {
      opacity: 0.85,
    },
  }),

  logoIcon: styles.class('logo-icon', {
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '0.375rem',
    backgroundColor: colors.foreground,
    color: colors.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: '700',
  }),

  navLink: styles.class('nav-link', {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: colors.mutedForeground,
    textDecoration: 'none',
    padding: `${spacing[1.5]} ${spacing[2]}`,
    borderRadius: borderRadius.md,
    transition: 'color 0.15s ease, background-color 0.15s ease',
    '&:hover': {
      color: colors.foreground,
      backgroundColor: colors.muted,
    },
  }),

  searchInput: styles.class('search-input', {
    width: '100%',
    height: '2.25rem',
    padding: `0 ${spacing[3]}`,
    fontSize: '0.875rem',
    color: colors.foreground,
    backgroundColor: colors.muted,
    border: '1px solid transparent',
    borderRadius: borderRadius.md,
    outline: 'none',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    '&::placeholder': {
      color: colors.mutedForeground,
    },
    '&:focus': {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
  }),

  iconButton: styles.class('icon-button', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.25rem',
    height: '2.25rem',
    padding: 0,
    fontSize: '0.875rem',
    color: colors.mutedForeground,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'color 0.15s ease, background-color 0.15s ease',
    '&:hover': {
      color: colors.foreground,
      backgroundColor: colors.muted,
    },
  }),

  primaryButton: styles.class('nav-primary-btn', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '2.25rem',
    padding: `0 ${spacing[4]}`,
    fontSize: '0.875rem',
    fontWeight: '500',
    color: colors.primaryForeground,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: 'hsl(222.2 47.4% 16.2%)',
    },
  }),

  badge: styles.create(
    'badge',
    {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '9999px',
      border: `1px solid ${colors.border}`,
      padding: `${spacing[1]} ${spacing[2]}`,
      fontSize: '0.75rem',
      fontWeight: '500',
      color: colors.mutedForeground,
      backgroundColor: 'transparent',
      transition: 'color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease',
    },
    {
      secondary: {
        backgroundColor: colors.muted,
        color: colors.mutedForeground,
        borderColor: 'transparent',
      },
      outline: {
        color: colors.foreground,
      },
    },
  ),
};
