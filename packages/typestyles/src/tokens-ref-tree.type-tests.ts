/**
 * Compile-time assertions for tokens.create ref-tree inference.
 * Issue #172 — failures here fail `pnpm typecheck`.
 */
import { createTokens } from './tokens';
import type { ModeAwareTokenLeaf, TokenRefTree } from './types';

const tokens = createTokens({ colorModes: ['light', 'dark'] });

// --- plain string leaves ---
const space = tokens.create('space', {
  sm: '8px',
  md: '16px',
});

type SpaceRef = typeof space;
type _SpaceSm = SpaceRef['sm'];
const _spaceSm: _SpaceSm = space.sm;
void _spaceSm;

// --- nested namespace ---
const brand = tokens.create('brand', {
  primary: { light: '#0064E0', dark: '#4d9fff' },
  spacing: { hero: '4rem' },
});

type BrandRef = typeof brand;
type _BrandPrimary = BrandRef['primary'];
type _BrandSpacingHero = BrandRef['spacing']['hero'];

const _brandPrimary: _BrandPrimary = brand.primary;
const _brandHero: _BrandSpacingHero = brand.spacing.hero;
void _brandPrimary;
void _brandHero;

// Mode-aware leaves are a single var() ref, not { light, dark } sub-keys.
// @ts-expect-error — primary is a string ref, not a nested object
const _brandPrimaryLight = brand.primary.light;

// --- root-level light/dark keys are separate token paths, not one mode-aware leaf ---
const modeKeys = tokens.create('modes', {
  light: '#fff',
  dark: '#000',
});

type ModeKeysRef = typeof modeKeys;
type _ModeKeysLight = ModeKeysRef['light'];
type _ModeKeysDark = ModeKeysRef['dark'];
const _modeLight: _ModeKeysLight = modeKeys.light;
const _modeDark: _ModeKeysDark = modeKeys.dark;
void _modeLight;
void _modeDark;

// --- exported helper types ---
type Leaf = ModeAwareTokenLeaf;
const _leaf: Leaf = { light: '#fff', dark: '#000' };
void _leaf;

type RefFromValues = TokenRefTree<{
  primary: { light: string; dark: string };
  spacing: { hero: string };
}>;

const _refShape: RefFromValues = brand;
void _refShape;
