import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const dsLink = styles.class('ds-link', {
  color: t.color.accent,
  fontSize: t.font.sizeMd,
  textDecoration: 'none',
  fontWeight: t.font.weightMedium,
  '&:hover': {
    textDecoration: 'underline',
  },
  '&:focus-visible': {
    outline: `2px solid ${t.color.focusRing}`,
    outlineOffset: '2px',
    borderRadius: t.radius.sm,
  },
});

export const dsCheckbox = styles.create('ds-checkbox', {
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space.sm,
    cursor: 'pointer',
  },
  box: {
    width: '18px',
    height: '18px',
    borderRadius: t.radius.sm,
    border: `1px solid ${t.color.borderStrong}`,
    backgroundColor: t.color.surface,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: t.font.weightSemibold,
    color: t.color.accentForeground,
    '&[data-selected]': {
      backgroundColor: t.color.accent,
      borderColor: t.color.accent,
    },
  },
  label: {
    fontSize: t.font.sizeMd,
  },
});

export const dsSwitch = styles.create('ds-switch', {
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space.sm,
    cursor: 'pointer',
  },
  track: {
    position: 'relative',
    width: '40px',
    height: '24px',
    borderRadius: t.radius.full,
    backgroundColor: t.color.border,
    transition: 'background-color 140ms ease',
    '&[data-selected]': {
      backgroundColor: t.color.accent,
    },
  },
  thumb: {
    position: 'absolute',
    top: '3px',
    left: '3px',
    width: '18px',
    height: '18px',
    borderRadius: t.radius.full,
    backgroundColor: t.color.surface,
    transition: 'transform 140ms ease',
    '&[data-selected]': {
      transform: 'translateX(16px)',
    },
  },
  label: {
    fontSize: t.font.sizeMd,
  },
});

export const dsRadio = styles.create('ds-radio', {
  group: {
    display: 'grid',
    gap: t.space.xs,
  },
  item: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space.sm,
    cursor: 'pointer',
  },
  control: {
    width: '18px',
    height: '18px',
    borderRadius: t.radius.full,
    border: `1px solid ${t.color.borderStrong}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&::before': {
      content: '""',
      width: '8px',
      height: '8px',
      borderRadius: t.radius.full,
      backgroundColor: 'transparent',
      transition: 'background-color 120ms ease',
    },
    '&[data-selected]::before': {
      backgroundColor: t.color.accent,
    },
  },
  label: {
    fontSize: t.font.sizeMd,
  },
  groupLabel: {
    fontSize: t.font.sizeMd,
    fontWeight: t.font.weightMedium,
    color: t.color.text,
  },
});

export const dsSelect = styles.create('ds-select', {
  root: {
    display: 'grid',
    gap: t.space.xs,
    minWidth: '240px',
  },
  label: {
    fontSize: t.font.sizeMd,
    fontWeight: t.font.weightMedium,
    color: t.color.text,
  },
  trigger: {
    textAlign: 'left',
    border: `1px solid ${t.color.border}`,
    borderRadius: t.radius.md,
    padding: `${t.space.sm} ${t.space.md}`,
    backgroundColor: t.color.surface,
    color: t.color.text,
    fontSize: t.font.sizeMd,
    cursor: 'pointer',
    '&:focus-visible': {
      outline: `2px solid ${t.color.focusRing}`,
      outlineOffset: '1px',
      borderColor: t.color.focusRing,
    },
  },
  popover: {
    border: `1px solid ${t.color.border}`,
    borderRadius: t.radius.md,
    backgroundColor: t.color.surface,
    boxShadow: t.shadow.md,
    padding: t.space.xs,
  },
  item: {
    fontSize: t.font.sizeMd,
    padding: `${t.space.sm} ${t.space.md}`,
    borderRadius: t.radius.sm,
    cursor: 'pointer',
    '&[data-focused]': {
      backgroundColor: t.color.surfaceMuted,
    },
    '&[data-selected]': {
      color: t.color.accent,
      fontWeight: t.font.weightSemibold,
    },
  },
});

export const dsTabs = styles.create('ds-tabs', {
  root: {
    display: 'grid',
    gap: t.space.md,
  },
  list: {
    display: 'inline-flex',
    gap: t.space.xs,
    borderBottom: `1px solid ${t.color.border}`,
  },
  tab: {
    border: 'none',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
    padding: `${t.space.sm} ${t.space.md}`,
    color: t.color.textMuted,
    cursor: 'pointer',
    fontSize: t.font.sizeMd,
    '&[data-selected]': {
      color: t.color.text,
      borderBottomColor: t.color.accent,
      fontWeight: t.font.weightSemibold,
    },
  },
  panel: {
    padding: t.space.md,
    backgroundColor: t.color.surfaceMuted,
    borderRadius: t.radius.md,
    border: `1px solid ${t.color.border}`,
  },
});

export const dsDialog = styles.create('ds-dialog', {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: t.color.overlay,
    display: 'grid',
    placeItems: 'center',
    padding: t.space.lg,
  },
  modal: {
    width: 'min(480px, 100%)',
    backgroundColor: t.color.surface,
    borderRadius: t.radius.lg,
    border: `1px solid ${t.color.border}`,
    boxShadow: t.shadow.md,
    padding: t.space.lg,
  },
  content: {
    display: 'grid',
    gap: t.space.md,
  },
  heading: {
    fontSize: '18px',
    fontWeight: t.font.weightSemibold,
    margin: 0,
  },
  description: {
    margin: 0,
    fontSize: t.font.sizeSm,
    color: t.color.textMuted,
  },
});

export const dsTextField = styles.create('ds-text-field', {
  root: {
    display: 'grid',
    gap: t.space.xs,
    minWidth: '240px',
  },
  label: {
    fontSize: t.font.sizeMd,
    fontWeight: t.font.weightMedium,
    color: t.color.text,
  },
  input: {
    border: `1px solid ${t.color.border}`,
    borderRadius: t.radius.md,
    padding: `${t.space.sm} ${t.space.md}`,
    fontSize: t.font.sizeMd,
    backgroundColor: t.color.surface,
    color: t.color.text,
    '&:focus': {
      outline: `2px solid ${t.color.focusRing}`,
      outlineOffset: '1px',
      borderColor: t.color.focusRing,
    },
    '&::placeholder': {
      color: t.color.textMuted,
    },
  },
  description: {
    fontSize: t.font.sizeSm,
    color: t.color.textMuted,
  },
  error: {
    fontSize: t.font.sizeSm,
    color: t.color.danger,
  },
});

export const dsTextAreaField = styles.create('ds-text-area-field', {
  root: {
    display: 'grid',
    gap: t.space.xs,
  },
  label: {
    fontSize: t.font.sizeMd,
    fontWeight: t.font.weightMedium,
    color: t.color.text,
  },
  input: {
    border: `1px solid ${t.color.border}`,
    borderRadius: t.radius.md,
    padding: `${t.space.sm} ${t.space.md}`,
    fontSize: t.font.sizeMd,
    backgroundColor: t.color.surface,
    color: t.color.text,
    minHeight: '88px',
    resize: 'vertical',
    '&:focus': {
      outline: `2px solid ${t.color.focusRing}`,
      outlineOffset: '1px',
      borderColor: t.color.focusRing,
    },
    '&::placeholder': {
      color: t.color.textMuted,
    },
  },
  description: {
    fontSize: t.font.sizeSm,
    color: t.color.textMuted,
  },
  error: {
    fontSize: t.font.sizeSm,
    color: t.color.danger,
  },
});
