/**
 * Compile-only fixtures (included in `tsc --noEmit`, not shipped in the bundle entry).
 * Ensures `[container(…)]`, `[has(…)]`, etc. mix with longhands without `as CSSProperties`.
 */
import type { CSSProperties } from './types.js';
import { container, createStyles, has, is, where } from './index.js';

const styles = createStyles();

export function _containerAndLonghands(): CSSProperties {
  return {
    color: 'red',
    [container({ minWidth: 400 })]: { display: 'grid' },
    [styles.container({ maxWidth: 800 })]: { display: 'block' },
  };
}

export function _pseudoAndLonghands(): CSSProperties {
  return {
    color: 'blue',
    [has('.active')]: { borderBottomWidth: 2 },
    [is(':hover', ':focus-visible')]: { outline: '2px solid' },
    [where('.nav')]: { gap: 8 },
  };
}

export function _rawContainerLiteral(): CSSProperties {
  return {
    padding: 8,
    [container('(min-width: 1px)')]: { display: 'flex' },
  };
}
