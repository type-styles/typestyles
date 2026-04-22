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

const forestDarkHue = 165;

const forestLightSubtle = p.palette['sage-2'];

const forestLightColorValues: DesignColorValues = {
  background: {
    app: p.palette['sage-1'],
    surface: p.palette['neutral-1'],
    subtle: forestLightSubtle,
    elevated: p.palette['neutral-1'],
  },
  text: {
    primary: p.palette['sage-10'],
    secondary: p.palette['sage-7'],
    onAccent: '#000',
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['green-6'], hover: p.palette['green-7'] },
  border: {
    default: '#000',
    strong: '#000',
    focus: p.palette['green-5'],
  },
  shadow: { offset: neoBrutalistShadowOffsetLight(forestLightSubtle) },
  danger: { default: p.palette['red-7'], solid: p.palette['red-8'] },
  success: { default: p.palette['green-7'], solid: p.palette['green-8'] },
  warning: { default: p.palette['amber-7'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['jade-7'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['sage-10'], 0.55, 'oklch') },
};

const forestDarkColorValues: DesignColorValues = {
  background: {
    app: color.oklch('23%', 0.022, 165),
    surface: color.oklch('27%', 0.02, 165),
    subtle: color.oklch('31%', 0.018, 165),
    elevated: color.oklch('27%', 0.02, 165),
  },
  text: {
    primary: p.palette['sage-1'],
    secondary: p.palette['sage-3'],
    onAccent: '#000',
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['green-3'], hover: p.palette['green-2'] },
  border: {
    default: neoBrutalistBorderDarkDefault(forestDarkHue),
    strong: neoBrutalistBorderDarkStrong(forestDarkHue),
    focus: p.palette['green-4'],
  },
  shadow: { offset: neoBrutalistShadowOffsetDark(forestDarkHue) },
  danger: { default: p.palette['red-4'], solid: p.palette['red-7'] },
  success: { default: p.palette['green-4'], solid: p.palette['green-7'] },
  warning: { default: p.palette['amber-4'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['jade-4'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['sage-10'], 0.7, 'oklch') },
};

export const forestTheme = createDesignTheme({
  name: 'forest',
  light: {
    color: forestLightColorValues,
    syntax: defaultLightSyntaxValues,
    shadow: neoBrutalistShadow,
  },
  dark: {
    color: forestDarkColorValues,
    syntax: defaultDarkSyntaxValues,
    shadow: neoBrutalistShadow,
  },
});
