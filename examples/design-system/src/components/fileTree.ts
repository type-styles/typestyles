import { styles } from '../runtime';
import { designTokens as t } from '../tokens';

export const fileTree = styles.component('fileTree', {
  root: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: t.fontSize.sm,
    lineHeight: 1.5,
    color: t.color.text.primary,
    margin: `${t.space[3]} 0`,
    padding: t.space[3],
    borderRadius: t.radius.md,
    border: `1px solid ${t.color.border.default}`,
    backgroundColor: t.color.background.subtle,
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
    marginTop: t.space[1],
    paddingLeft: t.space[4],
    borderLeft: `1px solid ${t.color.border.default}`,
  },
  row: {
    display: 'block',
    padding: `${t.space[1]} 0`,
    color: t.color.text.primary,
  },
  folder: {
    fontWeight: t.fontWeight.semibold,
    color: t.color.text.primary,
  },
  file: {
    color: t.color.text.secondary,
  },
});
