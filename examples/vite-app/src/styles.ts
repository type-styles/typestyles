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
    transition: 'background-color 200ms ease, color 200ms ease',
  },
  header: {
    marginBottom: space.xl,
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: space.sm,
  },
  subtitle: {
    fontSize: '14px',
    color: color.textMuted,
  },
  section: {
    marginBottom: space.xl,
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: space.md,
    paddingBottom: space.sm,
    borderBottom: `1px solid ${color.border}`,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: space.sm,
    alignItems: 'center',
  },
});

export const button = styles.component('button', {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${space.sm} ${space.md}`,
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 150ms ease, transform 100ms ease',
    '&:active': {
      transform: 'scale(0.97)',
    },
  },
  primary: {
    backgroundColor: color.primary,
    color: '#fff',
    '&:hover': {
      backgroundColor: color.primaryHover,
    },
  },
  secondary: {
    backgroundColor: color.secondary,
    color: '#fff',
    '&:hover': {
      backgroundColor: color.secondaryHover,
    },
  },
  outline: {
    backgroundColor: 'transparent',
    border: `1px solid ${color.border}`,
    color: color.text,
    '&:hover': {
      backgroundColor: color.surfaceRaised,
    },
  },
  large: {
    padding: `${space.md} ${space.lg}`,
    fontSize: '16px',
  },
});

export const card = styles.component('card', {
  base: {
    padding: space.lg,
    borderRadius: '8px',
    border: `1px solid ${color.border}`,
    backgroundColor: color.surfaceRaised,
    animation: `${fadeIn} 400ms ease`,
  },
  highlighted: {
    borderColor: color.primary,
    boxShadow: `0 0 0 1px ${color.primary}`,
  },
});

export const spinner = styles.component('spinner', {
  base: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    border: `3px solid ${color.border}`,
    borderTopColor: color.primary,
    borderRadius: '50%',
    animation: `${spin} 800ms linear infinite`,
  },
});

export const badge = styles.component('badge', {
  base: {
    display: 'inline-block',
    padding: `${space.xs} ${space.sm}`,
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
  },
  success: {
    backgroundColor: color.success,
    color: '#fff',
  },
  danger: {
    backgroundColor: color.danger,
    color: '#fff',
  },
});

export const hint = styles.component('hint', {
  base: {
    marginTop: space.xl,
    padding: space.md,
    borderRadius: '6px',
    backgroundColor: color.surfaceRaised,
    border: `1px dashed ${color.border}`,
    fontSize: '13px',
    color: color.textMuted,
    lineHeight: 1.6,
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: color.border,
    padding: `2px ${space.xs}`,
    borderRadius: '3px',
    fontSize: '12px',
  },
});
