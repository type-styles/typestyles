import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const steps = styles.create('steps', {
  /** Use with `<ol class={steps('root')}><li>…</li></ol>` (see `Steps.astro`). */
  root: {
    listStyle: 'none',
    padding: 0,
    margin: `${t.space.lg} 0`,
    counterReset: 'docs-step',
    '& > li': {
      position: 'relative',
      listStyle: 'none',
      paddingLeft: `calc(${t.space.xl} + ${t.space.md})`,
      marginBottom: t.space.xl,
      counterIncrement: 'docs-step',
      fontSize: t.font.sizeMd,
      color: t.color.text,
      lineHeight: 1.6,
      '&:last-child': {
        marginBottom: 0,
      },
      '&::before': {
        content: 'counter(docs-step)',
        position: 'absolute',
        left: 0,
        top: 0,
        width: t.space.xl,
        height: t.space.xl,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: t.font.sizeSm,
        fontWeight: t.font.weightSemibold,
        color: t.color.accentForeground,
        backgroundColor: t.color.accent,
        borderRadius: t.radius.full,
        lineHeight: 1,
      },
      '& :first-child': {
        marginTop: 0,
      },
      '& :last-child': {
        marginBottom: 0,
      },
    },
  },
});
