import { styles } from '../runtime';

/**
 * Example: one readable `container-name` from `styles.containerRef` (here: `{scopeId}-product-shell`),
 * applied on the root and reused in `@container name (…) { … }` via `styles.container(name, …)`.
 */
const productShell = styles.containerRef('product-shell');

export const namedContainerQuery = {
  /** Pass to DevTools / documentation — the actual `container-name` value. */
  containerName: productShell,
  /** Establishes the named size container (`container-type: inline-size` + `container-name`). */
  root: styles.class('ds-named-cq-root', {
    containerType: 'inline-size',
    containerName: productShell,
    maxWidth: '40rem',
    margin: '0 auto',
    padding: '1rem',
    border: '1px solid color-mix(in srgb, currentColor 12%, transparent)',
    borderRadius: '12px',
  }),
  /** Descendant layout that responds to **this** shell, not the viewport. */
  body: styles.class('ds-named-cq-body', {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    ...styles.atRuleBlock(styles.container(productShell, { minWidth: 480 }), {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: '20px',
    }),
  }),
};
