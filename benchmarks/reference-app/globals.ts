import { createGlobal } from 'typestyles';
import type { ReferenceTokens } from './tokens';

export function createReferenceGlobals(t: ReferenceTokens) {
  const global = createGlobal();
  global.style('*, *::before, *::after', { boxSizing: 'border-box' });
  global.style('body', {
    margin: '0',
    fontFamily: t.typography.fontFamily.sans,
    fontSize: t.typography.fontSize.md,
    lineHeight: t.typography.lineHeight.normal,
    color: t.color.text,
    backgroundColor: t.color.background,
  });
  global.style('a', { color: t.color.primary, textDecoration: 'none' });
  global.style('img, video', { maxWidth: '100%', height: 'auto' });
}
