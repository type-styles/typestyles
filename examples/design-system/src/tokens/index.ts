import { scopedTokenNamespace } from 'typestyles';
import { tokens } from '../runtime';
import { basePaletteTokenValues } from './palette';
import { type DesignColorRefs, type DesignColorValues, type DesignSyntaxValues } from './semantic';
import {
  borderWidthValues,
  durationValues,
  easingValues,
  fontFamilyValues,
  fontSizeValues,
  fontWeightValues,
  lineHeightValues,
  radiusValues,
  shadowValues,
  spaceValues,
  transitionValues,
} from './primitive';

export type { DesignCodeBlockValues } from './component';
export type {
  DesignBorderWidthValues,
  DesignFontFamilyValues,
  DesignFontSizeValues,
  DesignFontWeightValues,
  DesignLineHeightValues,
  DesignRadiusValues,
  DesignShadowValues,
  DesignSpaceValues,
} from './primitive';

export const paletteTokens = tokens.create('palette', basePaletteTokenValues);
export const spaceTokens = tokens.create('space', spaceValues);
export const radiusTokens = tokens.create('radius', radiusValues);
export const borderWidthTokens = tokens.create('borderWidth', borderWidthValues);
export const fontFamilyTokens = tokens.create('fontFamily', fontFamilyValues);
export const fontSizeTokens = tokens.create('fontSize', fontSizeValues);
export const fontWeightTokens = tokens.create('fontWeight', fontWeightValues);
export const lineHeightTokens = tokens.create('lineHeight', lineHeightValues);
export const shadowTokens = tokens.create('shadow', shadowValues);
export const durationTokens = tokens.create('duration', durationValues);
export const easingTokens = tokens.create('easing', easingValues);
export const transitionTokens = tokens.create('transition', transitionValues);

const emptyThemeColorValues: DesignColorValues = {
  background: { app: '', surface: '', subtle: '', elevated: '' },
  text: { primary: '', secondary: '', onAccent: '', onDanger: '' },
  accent: { default: '', hover: '' },
  border: { default: '', strong: '', focus: '' },
  danger: { default: '', solid: '' },
  success: { default: '', solid: '' },
  warning: { default: '', onSolid: '' },
  info: { default: '', onSolid: '' },
  overlay: { default: '' },
};

const colorCssNs = scopedTokenNamespace(tokens.scopeId?.trim() || undefined, 'color');
const cref = (path: string) => `var(--${colorCssNs}-${path})`;

const colorRefShape: DesignColorRefs = {
  ...emptyThemeColorValues,
  text: {
    ...emptyThemeColorValues.text,
    disabled: `color-mix(in oklch, ${cref('text-secondary')} 45%, transparent)`,
    placeholder: `color-mix(in oklch, ${cref('text-secondary')} 55%, transparent)`,
  },
  accent: {
    ...emptyThemeColorValues.accent,
    subtle: `color-mix(in oklch, ${cref('accent-default')} 15%, transparent)`,
  },
  danger: {
    ...emptyThemeColorValues.danger,
    subtle: `color-mix(in oklch, ${cref('danger-default')} 12%, transparent)`,
    border: `color-mix(in oklch, ${cref('danger-default')} 40%, transparent)`,
  },
  success: {
    ...emptyThemeColorValues.success,
    subtle: `color-mix(in oklch, ${cref('success-default')} 12%, transparent)`,
    border: `color-mix(in oklch, ${cref('success-default')} 40%, transparent)`,
  },
  warning: {
    ...emptyThemeColorValues.warning,
    subtle: `color-mix(in oklch, ${cref('warning-default')} 12%, transparent)`,
    border: `color-mix(in oklch, ${cref('warning-default')} 40%, transparent)`,
  },
  info: {
    ...emptyThemeColorValues.info,
    subtle: `color-mix(in oklch, ${cref('info-default')} 12%, transparent)`,
    border: `color-mix(in oklch, ${cref('info-default')} 40%, transparent)`,
  },
  overlay: {
    ...emptyThemeColorValues.overlay,
    backdrop: `color-mix(in oklch, ${cref('overlay-default')} 60%, transparent)`,
  },
};

export const colorTokens = tokens.create('color', colorRefShape);

const emptySyntaxValues: DesignSyntaxValues = {
  base: '',
  keyword: '',
  title: '',
  attr: '',
  string: '',
  builtIn: '',
  comment: '',
  name: '',
  section: '',
  bullet: '',
  addition: '',
  additionBackground: '',
  deletion: '',
  deletionBackground: '',
};

export const syntaxTokens = tokens.create('syntax', emptySyntaxValues);

export const codeBlockTokens = tokens.create('codeBlock', {
  background: `${colorTokens.background.surface}`,
  backgroundHeader: `${colorTokens.background.subtle}`,
  backgroundInline: `${colorTokens.background.subtle}`,
  backgroundLineHighlight: `${colorTokens.background.subtle}`,
  border: `${colorTokens.border.default}`,
});

export const designPrimitiveTokens = {
  palette: paletteTokens,
  space: spaceTokens,
  radius: radiusTokens,
  borderWidth: borderWidthTokens,
  fontFamily: fontFamilyTokens,
  fontSize: fontSizeTokens,
  fontWeight: fontWeightTokens,
  lineHeight: lineHeightTokens,
  shadow: shadowTokens,
  duration: durationTokens,
  easing: easingTokens,
  transition: transitionTokens,
} as const;

export const designSemanticTokens = {
  color: colorTokens,
  syntax: syntaxTokens,
} as const;

export const designComponentTokens = {
  codeBlock: codeBlockTokens,
} as const;

export const designTokens = {
  ...designPrimitiveTokens,
  ...designSemanticTokens,
  ...designComponentTokens,
} as const;
