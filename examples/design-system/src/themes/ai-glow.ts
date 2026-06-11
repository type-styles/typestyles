import { color } from 'typestyles';
import { createDesignTheme } from '../create-theme';
import { designPrimitiveTokens as p } from '../tokens';
import {
  defaultDarkSyntaxValues,
  defaultLightSyntaxValues,
  type DesignColorValues,
} from '../tokens/semantic';

const aiGlowLightColorValues: DesignColorValues = {
  background: {
    app: '#F8F5FF',
    surface: '#FFFCFF',
    subtle: '#E8F7FF',
    elevated: '#FFFFFF',
  },
  text: {
    primary: '#201A3D',
    secondary: '#5B527B',
    onAccent: '#FFFFFF',
    onDanger: '#FFFFFF',
  },
  accent: { default: '#0EA5E9', hover: '#7C3AED' },
  border: {
    default: 'color-mix(in oklch, #0EA5E9 28%, #FFFFFF)',
    strong: 'color-mix(in oklch, #F59E0B 38%, #FFFFFF)',
    focus: '#DB2777',
  },
  shadow: { offset: 'color-mix(in oklch, #0EA5E9 24%, transparent)' },
  danger: { default: p.palette['red-7'], solid: p.palette['red-8'] },
  success: { default: '#0F9F6E', solid: '#047857' },
  warning: { default: '#B45309', onSolid: '#FFFFFF' },
  info: { default: '#2563EB', onSolid: '#FFFFFF' },
  overlay: { default: color.alpha('#201A3D', 0.42, 'oklch') },
};

const aiGlowDarkColorValues: DesignColorValues = {
  background: {
    app: '#111025',
    surface: '#1A1733',
    subtle: '#272143',
    elevated: '#211B3B',
  },
  text: {
    primary: '#FAF7FF',
    secondary: '#C9C0EA',
    onAccent: '#FFFFFF',
    onDanger: '#FFFFFF',
  },
  accent: { default: '#67E8F9', hover: '#F0ABFC' },
  border: {
    default: 'color-mix(in oklch, #67E8F9 34%, #111025)',
    strong: 'color-mix(in oklch, #FDE68A 42%, #111025)',
    focus: '#F0ABFC',
  },
  shadow: { offset: 'color-mix(in oklch, #67E8F9 30%, transparent)' },
  danger: { default: p.palette['red-4'], solid: p.palette['red-7'] },
  success: { default: '#6EE7B7', solid: '#047857' },
  warning: { default: '#FCD34D', onSolid: '#211400' },
  info: { default: '#67E8F9', onSolid: '#08111A' },
  overlay: { default: color.alpha('#05040F', 0.76, 'oklch') },
};

const aiGlowLightSyntaxValues = {
  ...defaultLightSyntaxValues,
  keyword: '#7C3AED',
  title: '#2563EB',
  attr: '#B45309',
  string: '#047857',
  builtIn: '#DB2777',
  comment: '#786D98',
  section: '#0891B2',
};

const aiGlowDarkSyntaxValues = {
  ...defaultDarkSyntaxValues,
  keyword: '#C4B5FD',
  title: '#93C5FD',
  attr: '#FCD34D',
  string: '#6EE7B7',
  builtIn: '#F0ABFC',
  comment: '#AFA5CF',
  section: '#67E8F9',
};

const aiGlowPrimitiveValues = {
  fontFamily: {
    display:
      '"Fraunces", "Iowan Old Style", "Apple Garamond", Baskerville, "Palatino Linotype", Palatino, Georgia, serif',
    sans: '"Space Grotesk", "Avenir Next", Avenir, ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", Monaco, Consolas, monospace',
  },
  fontSize: {
    xs: '11px',
    sm: '13px',
    md: '15px',
    lg: '17px',
    xl: '22px',
    '2xl': '28px',
    '3xl': '36px',
  },
  fontWeight: {
    normal: '400',
    medium: '520',
    semibold: '650',
    bold: '760',
  },
  radius: {
    none: '0',
    sm: '3px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    full: '999px',
  },
  borderWidth: {
    thin: '1px',
    default: '1px',
    thick: '1px',
  },
  shadow: {
    xs: '0 4px 14px color-mix(in oklch, #0EA5E9 12%, transparent)',
    sm: '0 8px 24px color-mix(in oklch, #DB2777 12%, transparent)',
    md: '0 16px 48px color-mix(in oklch, #0EA5E9 16%, transparent), 0 4px 24px color-mix(in oklch, #F59E0B 10%, transparent)',
    lg: '0 24px 72px color-mix(in oklch, #DB2777 18%, transparent), 0 8px 42px color-mix(in oklch, #10B981 12%, transparent)',
    xl: '0 32px 96px color-mix(in oklch, #0EA5E9 18%, transparent), 0 12px 56px color-mix(in oklch, #F59E0B 14%, transparent)',
  },
  duration: {
    fast: '120ms',
    medium: '220ms',
    slow: '360ms',
  },
  transition: {
    overlayFade: 'opacity 260ms ease, visibility 260ms ease',
    panelEnter: 'opacity 320ms cubic-bezier(0.16, 1, 0.3, 1)',
    backdrop: 'opacity 260ms ease',
    surfaceFast: 'background-color 160ms ease',
    colorShift: 'color 180ms ease, text-decoration-color 180ms ease',
    controlSurface: 'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
  },
};

const aiGlowDarkPrimitiveValues = {
  ...aiGlowPrimitiveValues,
  shadow: {
    xs: '0 4px 18px color-mix(in oklch, #67E8F9 18%, transparent)',
    sm: '0 8px 30px color-mix(in oklch, #F0ABFC 18%, transparent)',
    md: '0 18px 56px color-mix(in oklch, #67E8F9 22%, transparent), 0 6px 32px color-mix(in oklch, #FDE68A 12%, transparent)',
    lg: '0 28px 84px color-mix(in oklch, #F0ABFC 22%, transparent), 0 10px 50px color-mix(in oklch, #6EE7B7 16%, transparent)',
    xl: '0 36px 110px color-mix(in oklch, #67E8F9 22%, transparent), 0 16px 64px color-mix(in oklch, #FDE68A 18%, transparent)',
  },
};

export const aiGlowTheme = createDesignTheme({
  name: 'ai-glow',
  light: {
    ...aiGlowPrimitiveValues,
    color: aiGlowLightColorValues,
    syntax: aiGlowLightSyntaxValues,
  },
  dark: {
    ...aiGlowDarkPrimitiveValues,
    color: aiGlowDarkColorValues,
    syntax: aiGlowDarkSyntaxValues,
  },
});
