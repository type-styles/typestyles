import { color } from 'typestyles';

export const PALETTE_STEPS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;
export type PaletteStep = (typeof PALETTE_STEPS)[number];
export type BaseColorPalette = Record<PaletteStep, string>;
type FamilySpec = { readonly h: number; readonly cMax: number };

export const PALETTE_FAMILIES = [
  'amber',
  'blue',
  'bronze',
  'brown',
  'crimson',
  'cyan',
  'emerald',
  'fuchsia',
  'gold',
  'grass',
  'gray',
  'green',
  'indigo',
  'iris',
  'jade',
  'lime',
  'mauve',
  'mint',
  'mist',
  'neutral',
  'olive',
  'orange',
  'pink',
  'plum',
  'purple',
  'red',
  'rose',
  'ruby',
  'sage',
  'sand',
  'slate',
  'sky',
  'stone',
  'taupe',
  'teal',
  'tomato',
  'violet',
  'yellow',
  'zinc',
] as const;

export type PaletteFamily = (typeof PALETTE_FAMILIES)[number];
export type PaletteTokenKey = `${PaletteFamily}-${PaletteStep}`;

const FAMILY_SPECS = {
  amber: { h: 72, cMax: 0.17 },
  blue: { h: 262, cMax: 0.22 },
  bronze: { h: 58, cMax: 0.12 },
  brown: { h: 48, cMax: 0.09 },
  crimson: { h: 5, cMax: 0.21 },
  cyan: { h: 200, cMax: 0.17 },
  emerald: { h: 158, cMax: 0.18 },
  fuchsia: { h: 328, cMax: 0.22 },
  gold: { h: 78, cMax: 0.12 },
  grass: { h: 138, cMax: 0.2 },
  gray: { h: 264, cMax: 0.014 },
  green: { h: 145, cMax: 0.19 },
  indigo: { h: 274, cMax: 0.2 },
  iris: { h: 277, cMax: 0.18 },
  jade: { h: 168, cMax: 0.16 },
  lime: { h: 128, cMax: 0.2 },
  mauve: { h: 285, cMax: 0.025 },
  mint: { h: 188, cMax: 0.14 },
  mist: { h: 215, cMax: 0.022 },
  neutral: { h: 0, cMax: 0 },
  olive: { h: 118, cMax: 0.022 },
  orange: { h: 55, cMax: 0.19 },
  pink: { h: 348, cMax: 0.18 },
  plum: { h: 315, cMax: 0.18 },
  purple: { h: 302, cMax: 0.22 },
  red: { h: 27, cMax: 0.21 },
  rose: { h: 2, cMax: 0.19 },
  ruby: { h: 12, cMax: 0.2 },
  sage: { h: 145, cMax: 0.022 },
  sand: { h: 72, cMax: 0.024 },
  slate: { h: 260, cMax: 0.028 },
  sky: { h: 238, cMax: 0.14 },
  stone: { h: 55, cMax: 0.022 },
  taupe: { h: 42, cMax: 0.022 },
  teal: { h: 182, cMax: 0.16 },
  tomato: { h: 35, cMax: 0.2 },
  violet: { h: 294, cMax: 0.22 },
  yellow: { h: 98, cMax: 0.13 },
  zinc: { h: 268, cMax: 0.015 },
} as const satisfies Record<PaletteFamily, FamilySpec>;

const STEP_COUNT = PALETTE_STEPS.length;
const CHROMA_ENVELOPE = [0.14, 0.34, 0.62, 0.86, 1, 1, 0.9, 0.68, 0.48, 0.32] as const;

function lightnessStops(): readonly number[] {
  const hi = 97;
  const lo = 22;
  return Array.from({ length: STEP_COUNT }, (_, i) => hi - (i / (STEP_COUNT - 1)) * (hi - lo));
}

function buildScale(h: number, cMax: number): BaseColorPalette {
  const L = lightnessStops();
  const out = {} as Record<PaletteStep, string>;
  for (let i = 0; i < STEP_COUNT; i++) {
    const step = PALETTE_STEPS[i];
    const c = cMax * CHROMA_ENVELOPE[i];
    out[step] = color.oklch(`${L[i].toFixed(2)}%`, Number(c.toFixed(3)), h);
  }
  return out;
}

export const baseColorPalettes = Object.fromEntries(
  PALETTE_FAMILIES.map((family) => {
    const { h, cMax } = FAMILY_SPECS[family];
    return [family, buildScale(h, cMax)] as const;
  }),
) as { readonly [K in PaletteFamily]: BaseColorPalette };

export const basePaletteTokenValues = Object.fromEntries(
  PALETTE_FAMILIES.flatMap((family) =>
    PALETTE_STEPS.map((step) => [`${family}-${step}`, baseColorPalettes[family][step]] as const),
  ),
) as Record<PaletteTokenKey, string>;
