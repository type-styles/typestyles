import { createTokens } from 'typestyles';

const tokens = createTokens({ scopeId: 'app' });

export const color = tokens.create('color', {
  primary: '#0066ff',
  primaryHover: '#0052cc',
  surface: '#ffffff',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
});

export const space = tokens.create('space', {
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
});
