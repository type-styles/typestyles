import type { PropertyRegistration } from './types';

const color = {
  syntax: '<color>',
  inherits: false,
  initial: 'transparent',
} as const satisfies PropertyRegistration;

const number = {
  syntax: '<number>',
  inherits: false,
  initial: 0,
} as const satisfies PropertyRegistration;

const integer = {
  syntax: '<integer>',
  inherits: false,
  initial: 0,
} as const satisfies PropertyRegistration;

const length = {
  syntax: '<length>',
  inherits: false,
  initial: '0px',
} as const satisfies PropertyRegistration;

const percentage = {
  syntax: '<percentage>',
  inherits: false,
  initial: '0%',
} as const satisfies PropertyRegistration;

const lengthPercentage = {
  syntax: '<length-percentage>',
  inherits: false,
  initial: '0px',
} as const satisfies PropertyRegistration;

const angle = {
  syntax: '<angle>',
  inherits: false,
  initial: '0deg',
} as const satisfies PropertyRegistration;

const time = {
  syntax: '<time>',
  inherits: false,
  initial: '0s',
} as const satisfies PropertyRegistration;

const resolution = {
  syntax: '<resolution>',
  inherits: false,
  initial: '0dpi',
} as const satisfies PropertyRegistration;

/** Built-in `@property` presets keyed by common syntax names. */
export const atPropertyPresets = {
  color,
  number,
  integer,
  length,
  percentage,
  lengthPercentage,
  angle,
  time,
  resolution,
} as const;

export type AtPropertyPresetName = keyof typeof atPropertyPresets;
export type AtPropertyPreset = (typeof atPropertyPresets)[AtPropertyPresetName];

function stripSyntaxMultiplier(syntax: string): string {
  return syntax.trim().replace(/[+#]$/, '');
}

/**
 * Placeholder `initial-value` for a single-component `syntax` string (after stripping list multipliers).
 * Shared by {@link atProperty} presets and runtime `@property` registration.
 */
export function syntaxPlaceholderFor(syntax: string): string | undefined {
  const preset = Object.values(atPropertyPresets).find((p) => p.syntax === syntax);
  if (preset) {
    return String(preset.initial);
  }
  return undefined;
}

/** Apply a CSS Values list multiplier (`+` or `#`) to a preset. */
export function atPropertyList(
  preset: PropertyRegistration,
  multiplier: '+' | '#' = '+',
): PropertyRegistration {
  return {
    ...preset,
    syntax: `${stripSyntaxMultiplier(preset.syntax)}${multiplier}`,
  };
}

/** Combine syntaxes into a union registration (`<length> | <percentage>`, etc.). */
export function atPropertyUnion(...presets: PropertyRegistration[]): PropertyRegistration {
  return {
    syntax: presets.map((p) => stripSyntaxMultiplier(p.syntax)).join(' | '),
    inherits: presets.some((p) => p.inherits) ? true : false,
  };
}

/**
 * Named `@property` registration presets — spread, override, or pass to `tokens.declare`,
 * `ctx.vars.declare`, `styles.property.declare`, and `css.atProperty`.
 *
 * @example
 * ```ts
 * tokens.declare('color', {
 *   accent: { default: atProperty.color },
 *   border: { ...atProperty.color, inherits: true },
 *   hue: { syntax: atProperty.angle.syntax },
 * });
 * ```
 */
export const atProperty = {
  ...atPropertyPresets,
  list: atPropertyList,
  union: atPropertyUnion,
} as const;
