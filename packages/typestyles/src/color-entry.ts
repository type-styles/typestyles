export * from './color';
import * as colorFns from './color';

/**
 * Type-safe CSS color function helpers (`rgb`, `oklch`, `mix`, …).
 * Import from `typestyles/color` so the main entry stays lean.
 */
export const color = colorFns;
