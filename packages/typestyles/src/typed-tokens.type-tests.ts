/**
 * Compile-time assertions for syntax-typed design tokens.
 * Failures here fail `pnpm typecheck`.
 */
import { createTokens } from './index';
import type { CreateValueForSyntax, CSSProperties, InferFromSchema, SyntaxRef } from './types';

const tokens = createTokens({ colorModes: ['light', 'dark'] });

const color = tokens.declare('color', {
  bg: { syntax: '<color>', inherits: false },
  text: { syntax: '<color>', inherits: false },
  accent: { syntax: '<color>', inherits: false },
});

const space = tokens.declare('space', {
  sm: { syntax: '<length>' },
  md: { syntax: '<length>' },
});

const semantic = tokens.declare('semantic', {
  buttonBg: { syntax: '<color>', inherits: false },
  buttonPad: { syntax: '<length>' },
});

// --- InferFromSchema ---
type ColorBg = InferFromSchema<typeof color>['bg'];
type _ColorBgIsSyntaxRef = ColorBg extends SyntaxRef<'<color>'> ? true : false;
const _colorBgCheck: _ColorBgIsSyntaxRef = true;
void _colorBgCheck;

type SpaceMd = InferFromSchema<typeof space>['md'];
type _SpaceMdIsSyntaxRef = SpaceMd extends SyntaxRef<'<length>'> ? true : false;
const _spaceMdCheck: _SpaceMdIsSyntaxRef = true;
void _spaceMdCheck;

// --- create({ decl }) positive ---
tokens.create(
  'color',
  {
    bg: '#0a0a0a',
    text: '#fafafa',
    accent: color.bg,
  },
  { decl: color },
);

tokens.create(
  'semantic',
  {
    buttonBg: color.accent,
    buttonPad: space.md,
  },
  { decl: semantic },
);

// --- create({ decl }) negative ---
// @ts-expect-error — length ref on <color> path
tokens.create('color', { bg: space.md }, { decl: color });

// --- styles() positive ---
const _card: CSSProperties = {
  backgroundColor: color.bg,
  color: color.text,
  padding: space.md,
  borderRadius: space.sm,
  width: space.md,
};

// --- styles() negative ---
// @ts-expect-error — color ref on width
const _badWidth: CSSProperties = { width: color.bg };

// @ts-expect-error — length ref on color
const _badColor: CSSProperties = { color: space.md };

// plain strings always OK
const _plain: CSSProperties = {
  color: '#ff0000',
  width: '100%',
};

// --- undeclared create stays loose ---
const loose = tokens.create('loose', { sm: '8px' });
const _looseStyles: CSSProperties = {
  padding: loose.sm,
  color: loose.sm,
};

// --- tokens.use preserves brand ---
const usedColor = tokens.use(color);
const _used: CSSProperties = { color: usedColor.bg };

// --- compatibility: <length> on <length-percentage> property ---
const _lengthOnWidth: CSSProperties = { width: space.sm };

void _card;
void _plain;
void _looseStyles;
void _used;
void _lengthOnWidth;

// CreateValueForSyntax accepts plain strings
type _CreateColor = CreateValueForSyntax<'<color>'>;
const _createVal: _CreateColor = '#0066ff';
void _createVal;
