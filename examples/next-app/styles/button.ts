import { styles } from 'typestyles';
import { colors, borderRadius, spacing, fontSize } from '../styles/tokens';

export const button = styles.create(
  'button',
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    borderRadius: borderRadius.md,
    fontSize: fontSize.sm,
    fontWeight: '500',
    height: '2.25rem',
    padding: `0 ${spacing[4]}`,
    transition:
      'color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease',
    cursor: 'pointer',
    border: '1px solid transparent',
    gap: spacing[2],
  },
  {
    default: {
      backgroundColor: colors.primary,
      color: colors.primaryForeground,
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '&:hover': {
        opacity: 0.9,
      },
    },
    destructive: {
      backgroundColor: colors.destructive,
      color: colors.destructiveForeground,
      '&:hover': {
        backgroundColor: 'hsl(0 62.8% 40.6%)',
      },
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      color: colors.foreground,
      '&:hover': {
        backgroundColor: colors.accent,
        color: colors.accentForeground,
        borderColor: colors.border,
      },
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors.secondaryForeground,
      '&:hover': {
        backgroundColor: colors.accent,
        color: colors.accentForeground,
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.foreground,
      '&:hover': {
        backgroundColor: colors.accent,
        color: colors.accentForeground,
      },
    },
    link: {
      backgroundColor: 'transparent',
      color: colors.primary,
      textDecoration: 'underline',
      '&:hover': {
        color: 'hsl(222.2 47.4% 16.2%)',
      },
    },
    sm: {
      height: '2rem',
      padding: `0 ${spacing[3]}`,
      fontSize: fontSize.xs,
    },
    lg: {
      height: '2.75rem',
      padding: `0 ${spacing[6]}`,
      fontSize: fontSize.lg,
    },
    icon: {
      height: '2.25rem',
      width: '2.25rem',
      padding: '0',
    },
    iconSm: {
      height: '2rem',
      width: '2rem',
      padding: '0',
    },
  }
);
