import { styles } from 'typestyles';
import { designTokens as t } from './tokens';

export const fileTree = styles.create('fileTree', {
  root: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: t.font.sizeSm,
    lineHeight: 1.5,
    color: t.color.text,
    margin: `${t.space.md} 0`,
    padding: t.space.md,
    borderRadius: t.radius.md,
    border: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surfaceMuted,
    overflowX: 'auto',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  listNested: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    marginTop: t.space.xs,
    paddingLeft: t.space.lg,
    borderLeft: `1px solid ${t.color.border}`,
  },
  row: {
    display: 'block',
    padding: `${t.space.xs} 0`,
    color: t.color.text,
  },
  folder: {
    fontWeight: t.font.weightSemibold,
    color: t.color.text,
  },
  file: {
    color: t.color.textMuted,
  },
});
