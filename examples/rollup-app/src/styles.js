import { styles } from 'typestyles';
import { color, space } from './tokens';
import { fadeIn, spin } from './animations';

export const layout = styles.component('layout', {
  page: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: `${space.xl} ${space.md}`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: color.text,
    backgroundColor: color.surface,
    minHeight: '100vh',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: space.sm,
  },
  subtitle: {
    fontSize: '14px',
    color: color.textMuted,
    marginBottom: space.lg,
  },
  row: {
    display: 'flex',
    gap: space.md,
    alignItems: 'center',
    marginBottom: space.lg,
  },
});

export const button = styles.component('button', {
  base: {
    padding: `${space.sm} ${space.md}`,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    backgroundColor: color.primary,
  },
  hover: {
    '&:hover': {
      backgroundColor: color.primaryHover,
    },
  },
});

export const card = styles.component('card', {
  base: {
    padding: space.lg,
    borderRadius: '8px',
    border: `1px solid ${color.border}`,
    animation: `${fadeIn} 400ms ease`,
  },
});

export const spinner = styles.component('spinner', {
  base: {
    width: '24px',
    height: '24px',
    border: `3px solid ${color.border}`,
    borderTopColor: color.primary,
    borderRadius: '50%',
    animation: `${spin} 800ms linear infinite`,
  },
});
