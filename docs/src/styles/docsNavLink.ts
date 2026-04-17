import { designTokens as t } from '@examples/design-system';

/**
 * Shared hover and current-page treatments for docs TOC and sidebar links.
 * Hover uses accent so the active row (primary + subtle) reads stronger than hover.
 */
export const docsNavLinkInteraction = {
  /** Default link hover */
  hover: {
    color: t.color.accent.default,
    backgroundColor: t.color.accent.subtle,
  },
  /** Current page / in-page location (combine with border/offset rules per surface) */
  current: {
    color: t.color.text.primary,
    backgroundColor: t.color.background.subtle,
  },
} as const;
