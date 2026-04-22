import { content } from 'typestyles';
import { reset, selection } from 'typestyles/globals';
import { designTokens as t } from '@examples/design-system';

import { global } from './typestyles';

/**
 * Baseline styles: Josh Comeau’s reset via `typestyles/globals`, then docs-specific body, selection,
 * and layout frame on `html`. Scoped `global` comes from `createTypeStyles` in `./typestyles` and emits
 * into the `reset` layer (`globalLayer` in `typestyles.ts`), below `tokens` and `components`.
 *
 * Josh Comeau’s reset already registers `body` and `html`; `global.style` dedupes by selector per
 * scope, so follow-up rules must use different selectors (`html body`, `html:root`) or they are
 * dropped and base typography (e.g. `font-family`) never applies.
 *
 * @see https://www.joshwcomeau.com/css/custom-css-reset/
 */
global.apply(...reset({ includeAppRootIsolation: false }));

global.style('html body', {
  background: t.color.background.app,
  fontFamily: t.fontFamily.sans,
  MozOsxFontSmoothing: 'grayscale',
});

global.style(
  selection({
    backgroundColor: t.color.accent.subtle,
    color: t.color.text.primary,
  }),
);

global.style('html:root', {
  scrollBehavior: 'smooth',
});
