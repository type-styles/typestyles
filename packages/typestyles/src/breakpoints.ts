/**
 * Breakpoint configuration for responsive variant resolution.
 *
 * @example
 * ```ts
 * configureBreakpoints({ sm: '640px', md: '768px', lg: '1024px' });
 * ```
 */
export type BreakpointConfig = Record<string, string>;

let configuredBreakpoints: BreakpointConfig = {};

/**
 * Configure named breakpoints for responsive variant support.
 *
 * Once breakpoints are configured, `styles.component()` variant classes are
 * automatically generated for each breakpoint inside `@media (min-width: ...)`
 * rules. The component selector function then accepts responsive variant
 * selections.
 *
 * Call this once before any component styles are registered.
 *
 * @param breakpoints - A map of breakpoint name → min-width value.
 *
 * @example
 * ```ts
 * import { configureBreakpoints } from 'typestyles';
 *
 * configureBreakpoints({ sm: '640px', md: '768px', lg: '1024px', xl: '1280px' });
 *
 * const button = styles.component('button', {
 *   base: { padding: '8px 16px' },
 *   variants: {
 *     size: {
 *       sm: { fontSize: '12px' },
 *       lg: { fontSize: '18px' },
 *     },
 *   },
 * });
 *
 * // Apply 'sm' by default, switch to 'lg' at the 'md' breakpoint:
 * button({ size: { initial: 'sm', md: 'lg' } });
 * // → "button-base button-size-sm md-button-size-lg"
 * ```
 */
export function configureBreakpoints(breakpoints: BreakpointConfig): void {
  configuredBreakpoints = breakpoints;
}

/**
 * Return the currently configured breakpoints (read-only).
 */
export function getBreakpoints(): Readonly<BreakpointConfig> {
  return configuredBreakpoints;
}

/**
 * Reset breakpoints to an empty map. Primarily for tests.
 */
export function resetBreakpoints(): void {
  configuredBreakpoints = {};
}

/**
 * Return a breakpoint-prefixed class name segment, e.g. `md-btn-size-lg`.
 * The prefix uses a dash separator to stay CSS-safe without escaping.
 */
export function buildBreakpointClassName(bp: string, baseClassName: string): string {
  return `${bp}-${baseClassName}`;
}
