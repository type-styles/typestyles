import { content } from 'typestyles';
import { reset, body, selection, html } from 'typestyles/globals';
import { designTokens as t } from '@examples/design-system';

import { global } from './typestyles';

/**
 * Baseline styles: Josh Comeau’s reset via `typestyles/globals`, then docs-specific body, selection,
 * and layout frame on `html`. Scoped `global` comes from `createTypeStyles` in `./typestyles` and emits
 * into the `reset` layer (`globalLayer` in `typestyles.ts`), below `tokens` and `components`.
 *
 * @see https://www.joshwcomeau.com/css/custom-css-reset/
 */
global.apply(...reset({ includeAppRootIsolation: false }));

global.style(
  body({
    background: t.color.background.app,
    fontFamily: t.fontFamily.sans,
    MozOsxFontSmoothing: 'grayscale',
  }),
);

global.style(
  selection({
    backgroundColor: t.color.accent.subtle,
    color: t.color.text.primary,
  }),
);

global.style(
  html({
    scrollBehavior: 'smooth',
    '&::after': {
      content: content(''),
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      border: `${t.borderWidth.thick} solid ${t.color.border.strong}`,
      zIndex: 9999,
      pointerEvents: 'none',
    },
  }),
);
