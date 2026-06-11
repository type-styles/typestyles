import { color } from 'typestyles';
import { createDesignTheme } from '../create-theme';
import { designPrimitiveTokens as p } from '../tokens';
import {
  defaultDarkSyntaxValues,
  defaultLightSyntaxValues,
  type DesignColorValues,
} from '../tokens/semantic';

const classicLightColorValues: DesignColorValues = {
  background: {
    app: '#FFFFFF',
    surface: '#FFFFFF',
    subtle: '#EEEEEE',
    elevated: '#FFFFFF',
  },
  text: {
    primary: '#000000',
    secondary: '#333333',
    onAccent: '#FFFFFF',
    onDanger: '#FFFFFF',
  },
  accent: { default: '#000000', hover: '#333333' },
  border: {
    default: '#000000',
    strong: '#000000',
    focus: '#000000',
  },
  shadow: { offset: '#000000' },
  danger: { default: '#000000', solid: '#000000' },
  success: { default: '#000000', solid: '#000000' },
  warning: { default: '#000000', onSolid: '#FFFFFF' },
  info: { default: '#000000', onSolid: '#FFFFFF' },
  overlay: { default: color.alpha('#000000', 0.45, 'srgb') },
};

const classicDarkColorValues: DesignColorValues = {
  background: {
    app: '#101010',
    surface: '#181818',
    subtle: '#252525',
    elevated: '#202020',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#D8D8D8',
    onAccent: '#000000',
    onDanger: '#000000',
  },
  accent: { default: '#FFFFFF', hover: '#E0E0E0' },
  border: {
    default: '#FFFFFF',
    strong: '#FFFFFF',
    focus: '#FFFFFF',
  },
  shadow: { offset: '#FFFFFF' },
  danger: { default: p.palette['red-3'], solid: p.palette['red-3'] },
  success: { default: p.palette['green-3'], solid: p.palette['green-3'] },
  warning: { default: p.palette['amber-3'], onSolid: '#000000' },
  info: { default: '#FFFFFF', onSolid: '#000000' },
  overlay: { default: color.alpha('#000000', 0.72, 'srgb') },
};

const classicPrimitiveValues = {
  fontFamily: {
    display: 'Chicago, "Geneva", Monaco, "Courier New", ui-monospace, monospace',
    sans: 'Chicago, "Geneva", Monaco, "Courier New", ui-monospace, monospace',
    mono: 'Monaco, "Courier New", ui-monospace, monospace',
  },
  fontSize: {
    xs: '10px',
    sm: '12px',
    md: '13px',
    lg: '15px',
    xl: '18px',
    '2xl': '22px',
    '3xl': '28px',
  },
  fontWeight: {
    normal: '400',
    medium: '600',
    semibold: '700',
    bold: '700',
  },
  radius: {
    none: '0',
    sm: '0',
    md: '0',
    lg: '0',
    xl: '0',
    full: '999px',
  },
  borderWidth: {
    thin: '1px',
    default: '1px',
    thick: '2px',
  },
  shadow: {
    xs: '1px 1px 0 0 #000000',
    sm: '1px 1px 0 0 #000000',
    md: '2px 2px 0 0 #000000',
    lg: '3px 3px 0 0 #000000',
    xl: '4px 4px 0 0 #000000',
  },
  duration: {
    fast: '80ms',
    medium: '100ms',
    slow: '140ms',
  },
  transition: {
    overlayFade: 'opacity 100ms steps(2, end), visibility 100ms steps(2, end)',
    panelEnter: 'opacity 100ms steps(2, end)',
    backdrop: 'opacity 100ms steps(2, end)',
    surfaceFast: 'background-color 80ms steps(2, end)',
    colorShift: 'color 80ms steps(2, end), text-decoration-color 80ms steps(2, end)',
    controlSurface: 'background-color 80ms steps(2, end), border-color 80ms steps(2, end)',
  },
};

const classicDarkPrimitiveValues = {
  ...classicPrimitiveValues,
  shadow: {
    xs: '1px 1px 0 0 #FFFFFF',
    sm: '1px 1px 0 0 #FFFFFF',
    md: '2px 2px 0 0 #FFFFFF',
    lg: '3px 3px 0 0 #FFFFFF',
    xl: '4px 4px 0 0 #FFFFFF',
  },
};

export const classicSystemTheme = createDesignTheme({
  name: 'classic-system',
  light: {
    ...classicPrimitiveValues,
    color: classicLightColorValues,
    syntax: defaultLightSyntaxValues,
  },
  dark: {
    ...classicDarkPrimitiveValues,
    color: classicDarkColorValues,
    syntax: defaultDarkSyntaxValues,
  },
});
