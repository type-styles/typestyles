import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

const buttonBase = styles.class('ds-button', {
  appearance: 'none',
  border: `1px solid ${t.color.border}`,
  borderRadius: t.radius.md,
  backgroundColor: t.color.surface,
  color: t.color.text,
  fontSize: t.font.sizeMd,
  fontWeight: t.font.weightMedium,
  padding: `${t.space.sm} ${t.space.lg}`,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: t.space.sm,
  transition: 'background-color 140ms ease, border-color 140ms ease, transform 80ms ease',
  '&:hover': {
    borderColor: t.color.borderStrong,
    backgroundColor: t.color.surfaceMuted,
  },
  '&:active': {
    transform: 'translateY(1px)',
  },
  '&:focus-visible': {
    outline: `2px solid ${t.color.focusRing}`,
    outlineOffset: '2px',
  },
});

const buttonPrimary = styles.hashClass(
  {
    borderColor: t.color.accent,
    backgroundColor: t.color.accent,
    color: t.color.accentForeground,
    '&:hover': {
      backgroundColor: t.color.accentHover,
      borderColor: t.color.accentHover,
    },
  },
  'ds-button-primary',
);

const buttonGhost = styles.hashClass(
  {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    '&:hover': {
      backgroundColor: t.color.surfaceMuted,
    },
  },
  'ds-button-ghost',
);

export const dsButton = {
  base: buttonBase,
  primary: buttonPrimary,
  secondary: '',
  ghost: buttonGhost,
} as const;
