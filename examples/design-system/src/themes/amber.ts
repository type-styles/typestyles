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

const amberDarkHue = 65;

const amberLightSubtle = p.palette['sand-2'];

const amberLightColorValues: DesignColorValues = {
  background: {
    app: p.palette['sand-1'],
    surface: p.palette['neutral-1'],
    subtle: amberLightSubtle,
    elevated: p.palette['neutral-1'],
  },
  text: {
    primary: p.palette['sand-10'],
    secondary: p.palette['sand-7'],
    onAccent: '#000',
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['orange-7'], hover: p.palette['orange-8'] },
  border: {
    default: '#000',
    strong: '#000',
    focus: p.palette['orange-5'],
  },
  shadow: { offset: neoBrutalistShadowOffsetLight(amberLightSubtle) },
  danger: { default: p.palette['red-7'], solid: p.palette['red-8'] },
  success: { default: p.palette['green-7'], solid: p.palette['green-8'] },
  warning: { default: p.palette['amber-7'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['orange-7'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['sand-10'], 0.55, 'oklch') },
};

const amberDarkColorValues: DesignColorValues = {
  background: {
    app: color.oklch('12%', 0.02, 65),
    surface: p.palette['sand-9'],
    subtle: p.palette['sand-8'],
    elevated: p.palette['sand-9'],
  },
  text: {
    primary: p.palette['sand-1'],
    secondary: p.palette['sand-3'],
    onAccent: '#000',
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['amber-3'], hover: p.palette['amber-2'] },
  border: {
    default: neoBrutalistBorderDarkDefault(amberDarkHue),
    strong: neoBrutalistBorderDarkStrong(amberDarkHue),
    focus: p.palette['amber-4'],
  },
  shadow: { offset: neoBrutalistShadowOffsetDark(amberDarkHue) },
  danger: { default: p.palette['red-4'], solid: p.palette['red-7'] },
  success: { default: p.palette['green-4'], solid: p.palette['green-7'] },
  warning: { default: p.palette['amber-4'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['orange-4'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['sand-10'], 0.7, 'oklch') },
};

export const amberTheme = createDesignTheme({
  name: 'amber',
  light: {
    color: amberLightColorValues,
    syntax: defaultLightSyntaxValues,
    shadow: neoBrutalistShadow,
  },
  dark: {
    color: amberDarkColorValues,
    syntax: defaultDarkSyntaxValues,
    shadow: neoBrutalistShadow,
  },
});
