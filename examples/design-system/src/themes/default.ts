import { color } from 'typestyles';
import { createDesignTheme } from '../create-theme';
import { designPrimitiveTokens as p } from '../tokens';
import {
  defaultDarkSyntaxValues,
  defaultLightSyntaxValues,
  type DesignColorValues,
} from '../tokens/semantic';
import {
  neoBrutalistBorderDarkDefault,
  neoBrutalistBorderDarkStrong,
  neoBrutalistShadow,
  neoBrutalistShadowOffsetDark,
  neoBrutalistShadowOffsetLight,
} from './neo-brutalist-shadows';

/** Hue for dark chrome borders / shadow offset (aligned with soft dark field). */
const defaultDarkHue = 88;

/** Warm paper field (editorial / technical print). */
const defaultLightSubtle = p.palette['sand-2'];

export const defaultLightColorValues: DesignColorValues = {
  background: {
    app: '#F5F1E9',
    surface: '#FAF8F2',
    subtle: defaultLightSubtle,
    elevated: '#FFFCF6',
  },
  text: {
    primary: '#14110D',
    secondary: p.palette['stone-8'],
    onAccent: p.palette['neutral-1'],
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['sky-7'], hover: p.palette['sky-8'] },
  border: {
    default: '#000',
    strong: '#000',
    focus: p.palette['blue-5'],
  },
  shadow: { offset: neoBrutalistShadowOffsetLight(defaultLightSubtle) },
  danger: { default: p.palette['red-7'], solid: p.palette['red-8'] },
  success: { default: p.palette['green-7'], solid: p.palette['green-8'] },
  warning: { default: p.palette['amber-7'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['violet-7'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['slate-10'], 0.55, 'oklch') },
};

export const defaultDarkColorValues: DesignColorValues = {
  background: {
    /** Soft warm field — not ink-black; pairs with cream light mode. */
    app: color.oklch('23%', 0.012, 88),
    surface: color.oklch('27%', 0.011, 88),
    subtle: color.oklch('31%', 0.01, 88),
    elevated: color.oklch('27%', 0.011, 88),
  },
  text: {
    primary: p.palette['slate-1'],
    secondary: p.palette['slate-3'],
    onAccent: p.palette['neutral-1'],
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['blue-4'], hover: p.palette['blue-3'] },
  border: {
    default: neoBrutalistBorderDarkDefault(defaultDarkHue),
    strong: neoBrutalistBorderDarkStrong(defaultDarkHue),
    focus: p.palette['blue-4'],
  },
  shadow: { offset: neoBrutalistShadowOffsetDark(defaultDarkHue) },
  danger: { default: p.palette['red-4'], solid: p.palette['red-7'] },
  success: { default: p.palette['green-4'], solid: p.palette['green-7'] },
  warning: { default: p.palette['amber-4'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['violet-4'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['slate-10'], 0.7, 'oklch') },
};

export const defaultLightValues = {
  color: defaultLightColorValues,
  syntax: defaultLightSyntaxValues,
  shadow: neoBrutalistShadow,
};
export const defaultDarkValues = {
  color: defaultDarkColorValues,
  syntax: defaultDarkSyntaxValues,
  shadow: neoBrutalistShadow,
};

export const defaultTheme = createDesignTheme({
  name: 'default',
  light: defaultLightValues,
  dark: defaultDarkValues,
});
