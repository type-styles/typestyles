import type { CSSProperties } from 'typestyles';
import { cx } from 'typestyles';
import type { CssPropValue } from './types';

export function resolveCssPropClass(
  hashClass: (properties: CSSProperties, label?: string) => string,
  css: CssPropValue | undefined,
  className?: string,
): string {
  if (css && typeof css === 'object') {
    return cx(hashClass(css), className);
  }
  return cx(className);
}
