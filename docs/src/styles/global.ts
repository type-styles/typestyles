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

global.style('html[data-style="new-wave"] body', {
  backgroundColor: t.color.background.app,
  backgroundImage: `linear-gradient(135deg, transparent 0 72%, ${t.color.accent.subtle} 72% 78%, transparent 78%),
    radial-gradient(circle at 8% 12%, ${t.color.accent.default} 0 5px, transparent 6px)`,
  backgroundAttachment: 'fixed',
});

global.style('html[data-style="ai-glow"] body', {
  backgroundColor: t.color.background.app,
  backgroundImage: `radial-gradient(circle at 12% 10%, color-mix(in oklch, #F0ABFC 34%, transparent) 0 12rem, transparent 24rem),
    radial-gradient(circle at 88% 14%, color-mix(in oklch, #67E8F9 36%, transparent) 0 11rem, transparent 25rem),
    radial-gradient(circle at 74% 76%, color-mix(in oklch, #6EE7B7 28%, transparent) 0 10rem, transparent 23rem),
    radial-gradient(circle at 22% 82%, color-mix(in oklch, #FDE68A 32%, transparent) 0 10rem, transparent 24rem),
    linear-gradient(135deg, color-mix(in oklch, ${t.color.background.app} 86%, #FFFFFF), ${t.color.background.app})`,
  backgroundAttachment: 'fixed',
});

global.style('html[data-style="windows-95"] body', {
  backgroundColor: t.color.background.app,
  backgroundImage: 'none',
});

global.style('html[data-style="classic-system"] body', {
  backgroundColor: t.color.background.app,
  backgroundImage: `repeating-linear-gradient(45deg, transparent 0 2px, ${t.color.background.subtle} 2px 4px)`,
  backgroundAttachment: 'fixed',
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
