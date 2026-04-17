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

/** Matches `background.app` hue in {@link defaultDarkColorValues}. */
const defaultDarkHue = 260;

const defaultLightSubtle = p.palette['slate-2'];

export const defaultLightColorValues: DesignColorValues = {
  background: {
    app: p.palette['neutral-1'],
    surface: p.palette['neutral-1'],
    subtle: defaultLightSubtle,
    elevated: p.palette['neutral-1'],
  },
  text: {
    primary: p.palette['slate-10'],
    secondary: p.palette['slate-7'],
    onAccent: '#000',
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['blue-6'], hover: p.palette['blue-7'] },
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
    app: color.oklch('12%', 0.028, 260),
    surface: p.palette['slate-9'],
    subtle: p.palette['slate-8'],
    elevated: p.palette['slate-9'],
  },
  text: {
    primary: p.palette['slate-1'],
    secondary: p.palette['slate-3'],
    onAccent: '#000',
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
