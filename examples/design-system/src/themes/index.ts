import { PALETTE_FAMILIES } from '../tokens/palette';
export { defaultTheme } from './default';
export { forestTheme } from './forest';
export { roseTheme } from './rose';
export { amberTheme } from './amber';

export type DesignPaletteId = 'default' | 'forest' | 'rose' | 'amber';

export const designPaletteList = [
  { id: 'default' as const, label: 'Slate' },
  { id: 'forest' as const, label: 'Forest' },
  { id: 'rose' as const, label: 'Rose' },
  { id: 'amber' as const, label: 'Amber' },
];

export { PALETTE_FAMILIES };
