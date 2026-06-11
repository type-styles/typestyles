import { PALETTE_FAMILIES } from '../tokens/palette';
export { defaultTheme } from './default';
export { forestTheme } from './forest';
export { roseTheme } from './rose';
export { amberTheme } from './amber';
export { aiGlowTheme } from './ai-glow';
export { newWaveTheme } from './new-wave';
export { windows95Theme } from './windows-95';
export { classicSystemTheme } from './classic-system';

export type DesignPaletteId = 'default' | 'forest' | 'rose' | 'amber';

export const designPaletteList = [
  { id: 'default' as const, label: 'Slate' },
  { id: 'forest' as const, label: 'Forest' },
  { id: 'rose' as const, label: 'Rose' },
  { id: 'amber' as const, label: 'Amber' },
];

export type DesignStyleId = 'default' | 'ai-glow' | 'new-wave' | 'windows-95' | 'classic-system';

export const designStyleList = [
  { id: 'default' as const, label: 'Neo-Brutalist' },
  { id: 'ai-glow' as const, label: 'AI Glow' },
  { id: 'new-wave' as const, label: 'New Wave' },
  { id: 'windows-95' as const, label: 'Windows 95' },
  { id: 'classic-system' as const, label: 'Classic System' },
];

export { PALETTE_FAMILIES };
