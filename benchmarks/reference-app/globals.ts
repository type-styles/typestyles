import { createGlobal } from 'typestyles';
import type { ReferenceTokens } from './tokens';

export function createReferenceGlobals(t: ReferenceTokens) {
  const global = createGlobal();
  global.rule('*, *::before, *::after', { boxSizing: 'border-box' });
  global.rule('body', {
    margin: '0',
    fontFamily: t.typography.fontFamily.sans,
    fontSize: t.typography.fontSize.md,
    lineHeight: t.typography.lineHeight.normal,
    color: t.color.text,
    backgroundColor: t.color.background,
  });
  global.rule('a', { color: t.color.primary, textDecoration: 'none' });
  global.rule('img, video', { maxWidth: '100%', height: 'auto' });
}
