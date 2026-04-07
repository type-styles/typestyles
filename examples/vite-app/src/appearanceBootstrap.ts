import { amberTheme, defaultTheme, forestTheme, roseTheme } from '@examples/design-system';
import type { AppearanceBootstrap } from './appearanceRuntime';

/** Runtime bootstrap; `vite.config.ts` embeds the same shape for the blocking `<head>` script. */
export const appearanceBootstrap: AppearanceBootstrap = {
  clear: [defaultTheme.className, forestTheme.className, roseTheme.className, amberTheme.className],
  map: {
    default: { className: defaultTheme.className },
    forest: { className: forestTheme.className },
    rose: { className: roseTheme.className },
    amber: { className: amberTheme.className },
  },
};
