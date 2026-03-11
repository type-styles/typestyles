import { styles } from 'typestyles';
import { colors, borderRadius, spacing, fontSize } from '../styles/tokens';

export const card = styles.class('card', {
  borderRadius: borderRadius.lg,
  backgroundColor: colors.card,
  color: colors.cardForeground,
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
  border: `1px solid ${colors.border}`,
});

export const cardHeader = styles.class('card-header', {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  padding: `${spacing[6]} ${spacing[6]} 0`,
});

export const cardTitle = styles.class('card-title', {
  fontSize: fontSize.xl,
  fontWeight: '600',
  lineHeight: '1',
  letterSpacing: '-0.025em',
  color: colors.foreground,
  margin: 0,
});

export const cardDescription = styles.class('card-description', {
  fontSize: fontSize.sm,
  color: colors.mutedForeground,
});

export const cardContent = styles.class('card-content', {
  padding: spacing[6],
});

export const cardFooter = styles.class('card-footer', {
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${spacing[6]} ${spacing[6]}`,
});
