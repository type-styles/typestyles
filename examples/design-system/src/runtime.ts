import { createStyles, createTokens } from 'typestyles';

/**
 * Dedicated TypeStyles instances for this package (no global class-naming mutation).
 * When this library may share a page with another TypeStyles bundle, pass
 * `{ scopeId: 'your-package' }` to both factories so variables and theme classes stay unique.
 */
export const styles = createStyles();
export const tokens = createTokens();
