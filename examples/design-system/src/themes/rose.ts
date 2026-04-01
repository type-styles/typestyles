import { color } from 'typestyles';
import { createDesignTheme } from '../create-theme';
import { designPrimitiveTokens as p } from '../tokens';
import {
  defaultDarkSyntaxValues,
  defaultLightSyntaxValues,
  type DesignColorValues,
} from '../tokens/semantic';

const roseLightColorValues: DesignColorValues = {
  background: {
    app: p.palette['rose-1'],
    surface: p.palette['neutral-1'],
    subtle: p.palette['rose-2'],
    elevated: p.palette['neutral-1'],
  },
  text: {
    primary: p.palette['rose-10'],
    secondary: p.palette['rose-7'],
    onAccent: p.palette['neutral-1'],
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['rose-7'], hover: p.palette['rose-8'] },
  border: { default: p.palette['rose-4'], strong: p.palette['rose-6'], focus: p.palette['rose-5'] },
  danger: { default: p.palette['red-7'], solid: p.palette['red-8'] },
  success: { default: p.palette['green-7'], solid: p.palette['green-8'] },
  warning: { default: p.palette['amber-7'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['plum-7'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['rose-10'], 0.55, 'oklch') },
};

const roseDarkColorValues: DesignColorValues = {
  background: {
    app: color.oklch('12%', 0.03, 355),
    surface: p.palette['rose-9'],
    subtle: p.palette['rose-8'],
    elevated: p.palette['rose-9'],
  },
  text: {
    primary: p.palette['rose-1'],
    secondary: p.palette['rose-3'],
    onAccent: p.palette['neutral-1'],
    onDanger: p.palette['neutral-1'],
  },
  accent: { default: p.palette['rose-4'], hover: p.palette['rose-3'] },
  border: { default: p.palette['rose-7'], strong: p.palette['rose-6'], focus: p.palette['rose-4'] },
  danger: { default: p.palette['red-4'], solid: p.palette['red-7'] },
  success: { default: p.palette['green-4'], solid: p.palette['green-7'] },
  warning: { default: p.palette['amber-4'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['plum-4'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['rose-10'], 0.7, 'oklch') },
};

export const roseTheme = createDesignTheme({
  name: 'rose',
  light: { color: roseLightColorValues, syntax: defaultLightSyntaxValues },
  dark: { color: roseDarkColorValues, syntax: defaultDarkSyntaxValues },
});
