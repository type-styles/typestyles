import { global } from 'typestyles';
import { designTokens as t } from '@examples/design-system';

global.style('body', {
  background: t.color.background.app,
});

global.style('*, *::before, *::after', {
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
});

global.style('html', {
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  scrollBehavior: 'smooth',
});
