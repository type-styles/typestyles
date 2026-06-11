import { color } from 'typestyles';
import { createDesignTheme } from '../create-theme';
import { designPrimitiveTokens as p } from '../tokens';
import {
  defaultDarkSyntaxValues,
  defaultLightSyntaxValues,
  type DesignColorValues,
} from '../tokens/semantic';

const win95LightColorValues: DesignColorValues = {
  background: {
    app: '#C0C0C0',
    surface: '#C0C0C0',
    subtle: '#E0E0E0',
    elevated: '#F0F0F0',
  },
  text: {
    primary: '#000000',
    secondary: '#202020',
    onAccent: '#FFFFFF',
    onDanger: '#FFFFFF',
  },
  accent: { default: '#000080', hover: '#1084D0' },
  border: {
    default: '#808080',
    strong: '#000000',
    focus: '#000080',
  },
  shadow: { offset: '#404040' },
  danger: { default: '#800000', solid: '#800000' },
  success: { default: '#008000', solid: '#008000' },
  warning: { default: '#808000', onSolid: '#000000' },
  info: { default: '#000080', onSolid: '#FFFFFF' },
  overlay: { default: color.alpha('#000000', 0.5, 'srgb') },
};

const win95DarkColorValues: DesignColorValues = {
  background: {
    app: '#000040',
    surface: '#303030',
    subtle: '#454545',
    elevated: '#555555',
  },
  text: {
    primary: '#F2F2F2',
    secondary: '#CFCFCF',
    onAccent: '#FFFFFF',
    onDanger: '#FFFFFF',
  },
  accent: { default: '#1084D0', hover: '#38A8F0' },
  border: {
    default: '#808080',
    strong: '#FFFFFF',
    focus: '#38A8F0',
  },
  shadow: { offset: '#000000' },
  danger: { default: p.palette['red-4'], solid: '#800000' },
  success: { default: p.palette['green-4'], solid: '#008000' },
  warning: { default: p.palette['amber-4'], onSolid: '#000000' },
  info: { default: '#38A8F0', onSolid: '#000000' },
  overlay: { default: color.alpha('#000000', 0.7, 'srgb') },
};

const win95PrimitiveValues = {
  fontFamily: {
    display: '"MS Sans Serif", "Microsoft Sans Serif", Arial, system-ui, sans-serif',
    sans: '"MS Sans Serif", "Microsoft Sans Serif", Arial, system-ui, sans-serif',
    mono: '"Lucida Console", "Courier New", ui-monospace, monospace',
  },
  fontSize: {
    xs: '11px',
    sm: '12px',
    md: '13px',
    lg: '15px',
    xl: '18px',
    '2xl': '22px',
    '3xl': '26px',
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
    full: '0',
  },
  borderWidth: {
    thin: '1px',
    default: '2px',
    thick: '2px',
  },
  shadow: {
    xs: 'inset 1px 1px 0 #FFFFFF, inset -1px -1px 0 #404040',
    sm: 'inset 1px 1px 0 #FFFFFF, inset -1px -1px 0 #404040',
    md: 'inset 2px 2px 0 #FFFFFF, inset -2px -2px 0 #404040',
    lg: 'inset 2px 2px 0 #FFFFFF, inset -2px -2px 0 #404040',
    xl: 'inset 2px 2px 0 #FFFFFF, inset -2px -2px 0 #404040',
  },
  duration: {
    fast: '0ms',
    medium: '0ms',
    slow: '0ms',
  },
  transition: {
    overlayFade: 'none',
    panelEnter: 'none',
    backdrop: 'none',
    surfaceFast: 'none',
    colorShift: 'none',
    controlSurface: 'none',
  },
};

const win95DarkPrimitiveValues = {
  ...win95PrimitiveValues,
  shadow: {
    xs: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #000000',
    sm: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #000000',
    md: 'inset 2px 2px 0 #808080, inset -2px -2px 0 #000000',
    lg: 'inset 2px 2px 0 #808080, inset -2px -2px 0 #000000',
    xl: 'inset 2px 2px 0 #808080, inset -2px -2px 0 #000000',
  },
};

const win95LightSyntaxValues = {
  ...defaultLightSyntaxValues,
  keyword: '#000080',
  title: '#800080',
  attr: '#5F4F00',
  string: '#004F00',
  builtIn: '#800000',
  comment: '#303030',
};

const win95DarkSyntaxValues = {
  ...defaultDarkSyntaxValues,
  keyword: '#38A8F0',
  title: '#F0F0F0',
  attr: '#FFFF80',
  string: '#80FF80',
  builtIn: '#FF8080',
  comment: '#B0B0B0',
};

export const windows95Theme = createDesignTheme({
  name: 'windows-95',
  light: {
    ...win95PrimitiveValues,
    color: win95LightColorValues,
    syntax: win95LightSyntaxValues,
  },
  dark: {
    ...win95DarkPrimitiveValues,
    color: win95DarkColorValues,
    syntax: win95DarkSyntaxValues,
  },
});
