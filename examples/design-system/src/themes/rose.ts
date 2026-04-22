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

const roseDarkHue = 355;

const roseLightSubtle = p.palette['rose-2'];

const roseLightColorValues: DesignColorValues = {
  background: {
    app: p.palette['rose-1'],
    surface: p.palette['neutral-1'],
    subtle: roseLightSubtle,
    elevated: p.palette['neutral-1'],
  },
  text: {
    primary: p.palette['rose-10'],
    secondary: p.palette['rose-7'],
    onAccent: '#000',
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['crimson-7'], hover: p.palette['crimson-8'] },
  border: {
    default: '#000',
    strong: '#000',
    focus: p.palette['crimson-5'],
  },
  shadow: { offset: neoBrutalistShadowOffsetLight(roseLightSubtle) },
  danger: { default: p.palette['red-7'], solid: p.palette['red-8'] },
  success: { default: p.palette['green-7'], solid: p.palette['green-8'] },
  warning: { default: p.palette['amber-7'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['plum-7'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['rose-10'], 0.55, 'oklch') },
};

const roseDarkColorValues: DesignColorValues = {
  background: {
    app: color.oklch('23%', 0.024, 355),
    surface: color.oklch('27%', 0.022, 355),
    subtle: color.oklch('31%', 0.02, 355),
    elevated: color.oklch('27%', 0.022, 355),
  },
  text: {
    primary: p.palette['rose-1'],
    secondary: p.palette['rose-3'],
    onAccent: '#000',
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['rose-3'], hover: p.palette['rose-2'] },
  border: {
    default: neoBrutalistBorderDarkDefault(roseDarkHue),
    strong: neoBrutalistBorderDarkStrong(roseDarkHue),
    focus: p.palette['rose-4'],
  },
  shadow: { offset: neoBrutalistShadowOffsetDark(roseDarkHue) },
  danger: { default: p.palette['red-4'], solid: p.palette['red-7'] },
  success: { default: p.palette['green-4'], solid: p.palette['green-7'] },
  warning: { default: p.palette['amber-4'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['plum-4'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['rose-10'], 0.7, 'oklch') },
};

export const roseTheme = createDesignTheme({
  name: 'rose',
  light: {
    color: roseLightColorValues,
    syntax: defaultLightSyntaxValues,
    shadow: neoBrutalistShadow,
  },
  dark: { color: roseDarkColorValues, syntax: defaultDarkSyntaxValues, shadow: neoBrutalistShadow },
});
