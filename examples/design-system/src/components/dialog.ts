import { styles } from 'typestyles';
import { designTokens as t } from '../tokens';

export const dialog = styles.create('dialog', {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: t.color.overlay.default,
    display: 'grid',
    placeItems: 'center',
    padding: t.space[4],
  },
  modal: {
    width: 'min(480px, 100%)',
    backgroundColor: t.color.background.surface,
    borderRadius: t.radius.lg,
    border: `1px solid ${t.color.border.default}`,
    boxShadow: t.shadow.md,
    padding: t.space[4],
  },
  content: {
    display: 'grid',
    gap: t.space[3],
  },
  heading: {
    fontSize: '18px',
    fontWeight: t.fontWeight.semibold,
    margin: 0,
  },
  description: {
    margin: 0,
    fontSize: t.fontSize.sm,
    color: t.color.text.secondary,
  },
});

