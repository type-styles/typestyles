import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const dialog = styles.create('dialog', {
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

