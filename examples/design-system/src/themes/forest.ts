import { color } from 'typestyles';
import { createDesignTheme } from '../create-theme';
import { designPrimitiveTokens as p } from '../tokens';
import {
  defaultDarkSyntaxValues,
  defaultLightSyntaxValues,
  type DesignColorValues,
} from '../tokens/semantic';

const forestLightColorValues: DesignColorValues = {
  background: {
    app: p.palette['sage-1'],
    surface: p.palette['neutral-1'],
    subtle: p.palette['sage-2'],
    elevated: p.palette['neutral-1'],
  },
  text: {
    primary: p.palette['sage-10'],
    secondary: p.palette['sage-7'],
    onAccent: p.palette['neutral-1'],
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['green-7'], hover: p.palette['green-8'] },
  border: {
    default: p.palette['sage-4'],
    strong: p.palette['sage-6'],
    focus: p.palette['green-5'],
  },
  danger: { default: p.palette['red-7'], solid: p.palette['red-8'] },
  success: { default: p.palette['green-7'], solid: p.palette['green-8'] },
  warning: { default: p.palette['amber-7'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['jade-7'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['sage-10'], 0.55, 'oklch') },
};

const forestDarkColorValues: DesignColorValues = {
  background: {
    app: color.oklch('12%', 0.03, 165),
    surface: p.palette['sage-9'],
    subtle: p.palette['sage-8'],
    elevated: p.palette['sage-9'],
  },
  text: {
    primary: p.palette['sage-1'],
    secondary: p.palette['sage-3'],
    onAccent: p.palette['neutral-1'],
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['green-4'], hover: p.palette['green-3'] },
  border: {
    default: p.palette['sage-7'],
    strong: p.palette['sage-6'],
    focus: p.palette['green-4'],
  },
  danger: { default: p.palette['red-4'], solid: p.palette['red-7'] },
  success: { default: p.palette['green-4'], solid: p.palette['green-7'] },
  warning: { default: p.palette['amber-4'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['jade-4'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['sage-10'], 0.7, 'oklch') },
};

export const forestTheme = createDesignTheme({
  name: 'forest',
  light: { color: forestLightColorValues, syntax: defaultLightSyntaxValues },
  dark: { color: forestDarkColorValues, syntax: defaultDarkSyntaxValues },
});
