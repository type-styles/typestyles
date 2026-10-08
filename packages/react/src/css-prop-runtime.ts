import type { CSSProperties } from 'typestyles';
import type { CssStylesHost } from './resolve-hash-class';
import { resolveHashClass } from './resolve-hash-class';

/** Runtime helper used by the Babel plugin for static `css` props. */
export function cssProp(api: CssStylesHost, properties: CSSProperties): string {
  return resolveHashClass(api)(properties);
}
