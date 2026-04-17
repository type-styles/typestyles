import { global, tokens } from './runtime';

/** Apply on a root section to flip slate + brand for dark UI (tokens cascade). */
export const darkShell = tokens.createTheme('typewind-dark', {
  base: {
    slate: {
      '50': '#0f172a',
      '100': '#1e293b',
      '200': '#334155',
      '300': '#475569',
      '400': '#64748b',
      '500': '#94a3b8',
      '600': '#cbd5e1',
      '700': '#e2e8f0',
      '800': '#f1f5f9',
      '900': '#f8fafc',
    },
    brand: {
      '500': '#60a5fa',
      '600': '#3b82f6',
    },
  },
});

/**
 * Spacing scale aligned with Tailwind’s default rem steps (subset).
 * Use via `var(--space-4)` in generated utilities.
 */
export const space = tokens.create('space', {
  px: '1px',
  '0': '0px',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '16': '4rem',
});

/** Slate palette (Tailwind v3 defaults, subset). */
export const slate = tokens.create('slate', {
  '50': '#f8fafc',
  '100': '#f1f5f9',
  '200': '#e2e8f0',
  '300': '#cbd5e1',
  '400': '#94a3b8',
  '500': '#64748b',
  '600': '#475569',
  '700': '#334155',
  '800': '#1e293b',
  '900': '#0f172a',
});

/** Brand accent for CTAs (not in default Tailwind; useful for demos). */
export const brand = tokens.create('brand', {
  '500': '#3b82f6',
  '600': '#2563eb',
});

global.style('body', {
  margin: 0,
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  lineHeight: 1.5,
  WebkitFontSmoothing: 'antialiased',
});
