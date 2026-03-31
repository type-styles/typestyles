import { color } from 'typestyles';
import { createDesignTheme } from '../create-theme';
import { designPrimitiveTokens as p } from '../tokens';
import {
  defaultDarkSyntaxValues,
  defaultLightSyntaxValues,
  type DesignColorValues,
} from '../tokens/semantic';

const amberLightColorValues: DesignColorValues = {
  background: {
    app: p.palette['sand-1'],
    surface: p.palette['neutral-1'],
    subtle: p.palette['sand-2'],
    elevated: p.palette['neutral-1'],
  },
  text: {
    primary: p.palette['sand-10'],
    secondary: p.palette['sand-7'],
    onAccent: p.palette['neutral-1'],
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['amber-7'], hover: p.palette['amber-8'] },
  border: {
    default: p.palette['sand-4'],
    strong: p.palette['sand-6'],
    focus: p.palette['amber-5'],
  },
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
    onAccent: p.palette['stone-10'],
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['amber-4'], hover: p.palette['amber-3'] },
  border: {
    default: p.palette['sand-7'],
    strong: p.palette['sand-6'],
    focus: p.palette['amber-4'],
  },
  danger: { default: p.palette['red-4'], solid: p.palette['red-7'] },
  success: { default: p.palette['green-4'], solid: p.palette['green-7'] },
  warning: { default: p.palette['amber-4'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['orange-4'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['sand-10'], 0.7, 'oklch') },
};

export const amberTheme = createDesignTheme({
  name: 'amber',
  light: { color: amberLightColorValues, syntax: defaultLightSyntaxValues },
  dark: { color: amberDarkColorValues, syntax: defaultDarkSyntaxValues },
});
