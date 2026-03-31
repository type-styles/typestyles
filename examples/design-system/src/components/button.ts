import { styles } from 'typestyles';
import { designTokens as t } from '../tokens';

const buttonBase = styles.class('ds-button', {
  appearance: 'none',
  border: `1px solid ${t.color.border.default}`,
  borderRadius: t.radius.md,
  backgroundColor: t.color.background.surface,
  color: t.color.text.primary,
  fontSize: t.fontSize.md,
  fontWeight: t.fontWeight.medium,
  padding: `${t.space[2]} ${t.space[4]}`,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: t.space[2],
  transition: 'background-color 140ms ease, border-color 140ms ease, transform 80ms ease',
  '&:hover': {
    borderColor: t.color.border.strong,
    backgroundColor: t.color.background.subtle,
  },
  '&:active': {
    transform: 'translateY(1px)',
  },
  '&:focus-visible': {
    outline: `2px solid ${t.color.border.focus}`,
    outlineOffset: '2px',
  },
});

const buttonPrimary = styles.hashClass(
  {
    borderColor: t.color.accent.default,
    backgroundColor: t.color.accent.default,
    color: t.color.text.onAccent,
    '&:hover': {
      backgroundColor: t.color.accent.hover,
      borderColor: t.color.accent.hover,
    },
  },
  'ds-button-primary',
);

const buttonGhost = styles.hashClass(
  {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    '&:hover': {
      backgroundColor: t.color.background.subtle,
    },
  },
  'ds-button-ghost',
);

const linkButtonPrimary = styles.hashClass(
  {
    borderColor: t.color.accent.default,
    backgroundColor: t.color.accent.default,
    color: t.color.text.onAccent,
    '&:hover': {
      backgroundColor: t.color.accent.hover,
      borderColor: t.color.accent.hover,
    },
  },
  'ds-link-button-primary',
);

const linkButtonSecondary = styles.hashClass(
  {
    backgroundColor: t.color.background.surface,
    border: `1px solid ${t.color.border.default}`,
    color: t.color.text.primary,
    '&:hover': {
      borderColor: t.color.border.strong,
      backgroundColor: t.color.background.subtle,
    },
  },
  'ds-link-button-secondary',
);

const linkButtonGhost = styles.hashClass(
  {
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    color: t.color.accent.default,
    '&:hover': {
      backgroundColor: t.color.background.subtle,
      borderColor: 'transparent',
    },
  },
  'ds-link-button-ghost',
);

/** `<a>` styled like `button` — Starlight-style `LinkButton`. */
export const linkButton = {
  base: styles.class('ds-link-button', {
    appearance: 'none',
    borderRadius: t.radius.md,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.medium,
    padding: `${t.space[2]} ${t.space[4]}`,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.space[2],
    textDecoration: 'none',
    transition: 'background-color 140ms ease, border-color 140ms ease, transform 80ms ease',
    '&:active': {
      transform: 'translateY(1px)',
    },
    '&:focus-visible': {
      outline: `2px solid ${t.color.border.focus}`,
      outlineOffset: '2px',
    },
  }),
  primary: linkButtonPrimary,
  secondary: linkButtonSecondary,
  ghost: linkButtonGhost,
} as const;

export const button = {
  base: buttonBase,
  primary: buttonPrimary,
  secondary: '',
  ghost: buttonGhost,
} as const;
