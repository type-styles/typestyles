import type { CSSVarRef } from './types';

let counter = 0;

/** Reset the counter. Used in tests only. */
export function __resetVarCounter(): void {
  counter = 0;
}

/**
 * Create a unique CSS custom property reference.
 *
 * Returns a `var(--ts-N)` string that can be used anywhere a CSS value is
 * accepted. Use assignVars() to set its value per element via inline styles.
 *
 * @example
 * ```ts
 * const cardBg = createVar();
 *
 * const card = styles.component('card', {
 *   base: { background: cardBg, padding: '16px' },
 * });
 *
 * // Consumer sets the variable per instance:
 * <div className={card('base')} style={assignVars({ [cardBg]: '#ff0099' })} />
 * ```
 */
export function createVar(): CSSVarRef {
  const name = `--ts-${++counter}`;
  return `var(${name})` as CSSVarRef;
}

/**
 * Build a CSS custom property assignment map from var refs to values.
 *
 * The returned object is safe to spread into a React (or any framework)
 * inline `style` prop.
 *
 * @example
 * ```ts
 * assignVars({ [cardBg]: '#ff0099' })
 * // → { '--ts-1': '#ff0099' }
 * ```
 */
export function assignVars(vars: Partial<Record<CSSVarRef, string>>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [varRef, value] of Object.entries(vars)) {
    if (value == null) continue;
    // Strip "var(" prefix and ")" suffix to get the raw property name
    const match = varRef.match(/^var\((--[^)]+)\)$/);
    if (match) result[match[1]] = value;
  }
  return result;
}
