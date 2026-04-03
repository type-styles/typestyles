import { insertRules, tokens } from 'typestyles';
import { codeBlockValues } from './component';
import { basePaletteTokenValues } from './palette';
import {
  DERIVED_COLOR_TOKENS,
  type DesignColorRefs,
  type DesignColorValues,
  type DesignSyntaxValues,
} from './semantic';
import {
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

const colorRefShape: DesignColorRefs = {
  ...emptyThemeColorValues,
  text: { ...emptyThemeColorValues.text, disabled: '', placeholder: '' },
  accent: { ...emptyThemeColorValues.accent, subtle: '' },
  danger: { ...emptyThemeColorValues.danger, subtle: '', border: '' },
  success: { ...emptyThemeColorValues.success, subtle: '', border: '' },
  warning: { ...emptyThemeColorValues.warning, subtle: '', border: '' },
  info: { ...emptyThemeColorValues.info, subtle: '', border: '' },
  overlay: { ...emptyThemeColorValues.overlay, backdrop: '' },
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
export const codeBlockTokens = tokens.create('codeBlock', codeBlockValues);

insertRules([
  {
    key: 'theme:derived-color',
    css: `:root { ${Object.entries(DERIVED_COLOR_TOKENS)
      .map(([key, value]) => `--color-${key}: ${value};`)
      .join(' ')} }`,
  },
]);

export const designPrimitiveTokens = {
  palette: paletteTokens,
  space: spaceTokens,
  radius: radiusTokens,
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
