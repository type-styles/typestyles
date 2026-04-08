import { createStyles } from 'typestyles';

/**
 * Application-level typestyles: page chrome only. Shared components and tokens
 * come from `@examples/react-design-system` (pulled in via `typestyles-entry.ts`).
 */
const styles = createStyles({ scopeId: 'example-app', mode: 'semantic' });

export const site = {
  page: styles.class('app-site-page', {
    maxWidth: '920px',
    margin: '0 auto',
    padding: '32px 20px',
  }),
  header: styles.class('app-site-header', {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  }),
} as const;
