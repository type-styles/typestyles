import { oklch as formatOklch } from './color';

/** Hand-tuned chroma envelope for the default 10-step ramp (see design-system palette). */
const CHROMA_ENVELOPE_10 = [0.14, 0.34, 0.62, 0.86, 1, 1, 0.9, 0.68, 0.48, 0.32] as const;

const DEFAULT_STEPS = 10;
const DEFAULT_LIGHTNESS_RANGE: [number, number] = [22, 97];

const SRGB_TO_LMS = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
] as const;

const LMS_TO_OKLAB = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
] as const;

const OKLAB_TO_LMS = [
  [1.0, 0.3963377774, 0.2158037573],
  [1.0, -0.1055613458, -0.0638541728],
  [1.0, -0.0894841775, -1.291485548],
] as const;

const LMS_TO_SRGB = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
] as const;

export type OklchColor = { l: number; c: number; h: number };

export type GenerateRampOptions = {
  hue: number;
  chroma: number;
  steps?: number;
  lightnessRange?: [number, number];
};

function linearizeSrgb(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function gammaEncodeSrgb(channel: number): number {
  const abs = Math.abs(channel);
  const encoded =
    abs <= 0.0031308 ? 12.92 * channel : Math.sign(channel) * (1.055 * abs ** (1 / 2.4) - 0.055);
  return Math.min(1, Math.max(0, encoded));
}

function multiplyMatrix(
  matrix: readonly (readonly number[])[],
  vector: readonly [number, number, number],
): [number, number, number] {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
  ];
}

function srgbToOklab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const linear: [number, number, number] = [linearizeSrgb(r), linearizeSrgb(g), linearizeSrgb(b)];
  const lms = multiplyMatrix(SRGB_TO_LMS, linear);
  const lmsPrime: [number, number, number] = [
    Math.cbrt(lms[0]),
    Math.cbrt(lms[1]),
    Math.cbrt(lms[2]),
  ];
  const lab = multiplyMatrix(LMS_TO_OKLAB, lmsPrime);
  return { L: lab[0], a: lab[1], b: lab[2] };
}

function oklabToSrgb(L: number, a: number, b: number): [number, number, number] {
  const lmsPrime = multiplyMatrix(OKLAB_TO_LMS, [L, a, b]);
  const lms: [number, number, number] = [lmsPrime[0] ** 3, lmsPrime[1] ** 3, lmsPrime[2] ** 3];
  const linear = multiplyMatrix(LMS_TO_SRGB, lms);
  return [gammaEncodeSrgb(linear[0]), gammaEncodeSrgb(linear[1]), gammaEncodeSrgb(linear[2])];
}

/** Below this, a/b are floating-point noise (matrix constants don't sum to exactly 1),
 *  so atan2 produces a hue that's arbitrary and unstable across JS engines. */
const ACHROMATIC_CHROMA_EPSILON = 1e-4;

function oklabToOklch(L: number, a: number, b: number): OklchColor {
  const c = Math.sqrt(a * a + b * b);
  if (c < ACHROMATIC_CHROMA_EPSILON) {
    return { l: L * 100, c, h: 0 };
  }
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L * 100, c, h };
}

function oklchToOklab(l: number, c: number, h: number): { L: number; a: number; b: number } {
  const hr = (h * Math.PI) / 180;
  return { L: l / 100, a: c * Math.cos(hr), b: c * Math.sin(hr) };
}

function parseHexColor(input: string): [number, number, number] {
  const hex = input.trim();
  const match = /^#([0-9a-f]{3,8})$/i.exec(hex);
  if (!match) {
    throw new Error(
      `[typestyles] parseColor: unsupported color format "${input}". Only hex colors are supported today.`,
    );
  }

  let digits = match[1];
  if (digits.length === 3 || digits.length === 4) {
    digits = digits
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }

  if (digits.length !== 6 && digits.length !== 8) {
    throw new Error(
      `[typestyles] parseColor: unsupported color format "${input}". Only hex colors are supported today.`,
    );
  }

  const r = Number.parseInt(digits.slice(0, 2), 16) / 255;
  const g = Number.parseInt(digits.slice(2, 4), 16) / 255;
  const b = Number.parseInt(digits.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function parseOklchString(input: string): OklchColor {
  const trimmed = input.trim();
  const match = /^oklch\(([^)]+)\)$/i.exec(trimmed);
  if (!match) {
    throw new Error(`[typestyles] contrastRatio: expected hex or oklch() color, got "${input}".`);
  }

  const parts = match[1]
    .split(/\s*\/\s*/)
    .flatMap((segment, index) => (index === 0 ? segment.trim().split(/\s+/) : []))
    .filter(Boolean);

  if (parts.length < 3) {
    throw new Error(`[typestyles] contrastRatio: invalid oklch() color "${input}".`);
  }

  const lRaw = parts[0];
  const l = lRaw.endsWith('%') ? Number.parseFloat(lRaw) : Number.parseFloat(lRaw) * 100;
  const c = Number.parseFloat(parts[1]);
  const h = Number.parseFloat(parts[2]);
  return { l, c, h };
}

function colorToSrgb(input: string): [number, number, number] {
  const trimmed = input.trim();
  if (trimmed.startsWith('#')) {
    return parseHexColor(trimmed);
  }
  if (trimmed.startsWith('oklch(')) {
    const { l, c, h } = parseOklchString(trimmed);
    const { L, a, b } = oklchToOklab(l, c, h);
    return oklabToSrgb(L, a, b);
  }
  throw new Error(`[typestyles] contrastRatio: expected hex or oklch() color, got "${input}".`);
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [lr, lg, lb] = [linearizeSrgb(r), linearizeSrgb(g), linearizeSrgb(b)];
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function lightnessStops(steps: number, range: [number, number]): number[] {
  const [lo, hi] = range;
  return Array.from({ length: steps }, (_, i) => hi - (i / (steps - 1)) * (hi - lo));
}

/** Best-effort chroma envelope for non-default step counts (un-tuned; prefer `steps: 10`). */
function genericChromaEnvelope(steps: number): number[] {
  return Array.from({ length: steps }, (_, i) => {
    const t = steps === 1 ? 0.5 : i / (steps - 1);
    const x = (t - 0.55) / 0.45;
    return Math.max(0.14, 1 - x * x);
  });
}

function chromaEnvelope(steps: number): readonly number[] {
  if (steps === DEFAULT_STEPS) return CHROMA_ENVELOPE_10;
  return genericChromaEnvelope(steps);
}

/**
 * Parse a hex color into OKLCH components (`l` as 0–100%, `c` and `h` as CSS oklch units).
 */
export function parseColor(input: string): OklchColor {
  const [r, g, b] = parseHexColor(input);
  const lab = srgbToOklab(r, g, b);
  return oklabToOklch(lab.L, lab.a, lab.b);
}

/**
 * Build a perceptual OKLCH ramp (lightest → darkest).
 * `steps: 10` uses the hand-tuned chroma envelope from the design-system palette.
 */
export function generateRamp(opts: GenerateRampOptions): string[] {
  const steps = opts.steps ?? DEFAULT_STEPS;
  const lightnessRange = opts.lightnessRange ?? DEFAULT_LIGHTNESS_RANGE;
  const envelope = chromaEnvelope(steps);
  const lightness = lightnessStops(steps, lightnessRange);

  return lightness.map((l, i) => {
    const c = opts.chroma * envelope[i];
    return formatOklch(`${l.toFixed(2)}%`, Number(c.toFixed(3)), opts.hue);
  });
}

/**
 * WCAG 2.x relative luminance contrast ratio between two colors (hex or oklch() strings).
 */
export function contrastRatio(colorA: string, colorB: string): number {
  const [r1, g1, b1] = colorToSrgb(colorA);
  const [r2, g2, b2] = colorToSrgb(colorB);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
