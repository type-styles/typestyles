import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const dsLayout = styles.create(
  'ds-layout',
  {
    fontFamily: t.font.family,
    color: t.color.text,
  },
  {
    stack: {
      display: 'grid',
      gap: t.space.xl,
    },
    section: {
      display: 'grid',
      gap: t.space.md,
      padding: t.space.lg,
      border: `1px solid ${t.color.border}`,
      borderRadius: t.radius.lg,
      backgroundColor: t.color.surface,
      boxShadow: t.shadow.sm,
    },
    row: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: t.space.md,
      alignItems: 'center',
    },
  },
);

export const dsText = styles.create(
  'ds-text',
  {
    margin: 0,
    color: t.color.text,
  },
  {
    title: {
      fontSize: '28px',
      fontWeight: t.font.weightSemibold,
      letterSpacing: '-0.02em',
    },
    subtitle: {
      fontSize: t.font.sizeLg,
      color: t.color.textMuted,
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: t.font.weightSemibold,
    },
    label: {
      fontSize: t.font.sizeMd,
      fontWeight: t.font.weightMedium,
    },
    caption: {
      fontSize: t.font.sizeSm,
      color: t.color.textMuted,
    },
  },
);
