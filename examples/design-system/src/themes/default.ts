import { color } from 'typestyles';
import { createDesignTheme } from '../create-theme';
import { designPrimitiveTokens as p } from '../tokens';
import { defaultDarkSyntaxValues, defaultLightSyntaxValues, type DesignColorValues } from '../tokens/semantic';

export const defaultLightColorValues: DesignColorValues = {
  background: { app: p.palette['neutral-1'], surface: p.palette['neutral-1'], subtle: p.palette['slate-2'], elevated: p.palette['neutral-1'] },
  text: { primary: p.palette['slate-10'], secondary: p.palette['slate-6'], onAccent: p.palette['neutral-1'], onDanger: p.palette['neutral-1'] },
  accent: { default: p.palette['blue-7'], hover: p.palette['blue-8'] },
  border: { default: p.palette['slate-4'], strong: p.palette['slate-6'], focus: p.palette['blue-5'] },
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
  text: { primary: p.palette['slate-1'], secondary: p.palette['slate-3'], onAccent: p.palette['neutral-1'], onDanger: p.palette['neutral-1'] },
  accent: { default: p.palette['blue-5'], hover: p.palette['blue-4'] },
  border: { default: p.palette['slate-7'], strong: p.palette['slate-6'], focus: p.palette['blue-4'] },
  danger: { default: p.palette['red-4'], solid: p.palette['red-7'] },
  success: { default: p.palette['green-4'], solid: p.palette['green-7'] },
  warning: { default: p.palette['amber-4'], onSolid: p.palette['stone-10'] },
  info: { default: p.palette['violet-4'], onSolid: p.palette['neutral-1'] },
  overlay: { default: color.alpha(p.palette['slate-10'], 0.7, 'oklch') },
};

export const defaultLightValues = { color: defaultLightColorValues, syntax: defaultLightSyntaxValues };
export const defaultDarkValues = { color: defaultDarkColorValues, syntax: defaultDarkSyntaxValues };

export const defaultTheme = createDesignTheme({
  name: 'default',
  light: defaultLightValues,
  dark: defaultDarkValues,
});
