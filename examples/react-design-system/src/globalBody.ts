import { designTokens } from '@examples/design-system';
import { global } from 'typestyles';

global.style('body', {
  margin: 0,
  minHeight: '100%',
  fontFamily: designTokens.fontFamily.sans,
  lineHeight: designTokens.lineHeight.normal,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
});
