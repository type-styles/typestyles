/**
 * Compile-time assertions for `styles.override()` — included in `tsc --noEmit`
 * (unlike `*.test.ts`). Failures here fail `pnpm typecheck`.
 */
import { createStyles } from './styles';
import type { VariantOptionStyle } from './types';

const styles = createStyles();
const button = styles.component('ov-type-btn', {
  base: { color: 'black' },
  variants: {
    intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
    size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } },
    disabled: { true: { opacity: 0.5 }, false: { opacity: 1 } },
  },
});

// Valid dimensioned overrides
styles.override(button, {
  base: { color: 'red' },
  variants: { intent: { primary: { textTransform: 'uppercase' } } },
  compoundVariants: [
    {
      variants: { intent: 'primary', size: 'lg' },
      style: { letterSpacing: '0.05em' },
    },
    {
      variants: { intent: ['primary', 'ghost'], size: 'sm' },
      style: { fontWeight: 700 },
    },
    {
      variants: { disabled: true, intent: 'primary' },
      style: { outline: 'none' },
    },
  ],
});

// @ts-expect-error — unknown variant dimension
styles.override(button, {
  variants: { missing: { primary: { color: 'red' } } },
});

// @ts-expect-error — unknown variant option
styles.override(button, {
  variants: { intent: { xl: { color: 'red' } } },
});

// @ts-expect-error — unknown compound option (must match VariantOptionKey)
styles.override(button, {
  compoundVariants: [
    {
      variants: { intent: 'nonexistent', size: 'lg' },
      style: { fontWeight: 700 },
    },
  ],
});

// @ts-expect-error — unknown compound dimension
styles.override(button, {
  compoundVariants: [
    {
      variants: { nope: 'primary' },
      style: { fontWeight: 700 },
    },
  ],
});

const layered = createStyles({
  layers: ['components', 'overrides'] as const,
});
const layeredBtn = layered.component(
  'ov-type-layer',
  { base: { color: 'black' }, variants: { intent: { primary: { color: 'blue' } } } },
  { layer: 'components' },
);

layered.override(layeredBtn, { base: { color: 'red' } }, { layer: 'overrides' });
layered.override(layeredBtn, { base: { color: 'red' } }); // defaults to overrides

// @ts-expect-error — layer not on this instance's stack
layered.override(layeredBtn, { base: { color: 'red' } }, { layer: 'not-a-real-layer' });

const alert = styles.component('ov-type-slot', {
  slots: ['root', 'icon'] as const,
  base: { root: { display: 'flex' }, icon: { width: '16px' } },
  variants: {
    tone: {
      danger: { root: { color: 'red' }, icon: { opacity: 1 } },
      info: { root: { color: 'blue' }, icon: { opacity: 1 } },
    },
  },
});

styles.override(alert, {
  base: { root: { gap: '8px' } },
  compoundVariants: [
    {
      variants: { tone: 'danger' },
      style: { root: { outline: '1px solid red' } },
    },
  ],
});

styles.override(alert, {
  compoundVariants: [
    {
      // @ts-expect-error — unknown slot compound option
      variants: { tone: 'warning' },
      style: { root: { outline: '1px solid orange' } },
    },
  ],
});

const multi = styles.component('ov-type-multi', {
  slots: ['root', 'title'] as const,
  root: { display: 'grid' },
  title: { fontWeight: 600 },
});

styles.override(multi, { base: { root: { gap: '4px' }, title: { fontSize: '14px' } } });

// @ts-expect-error — multi-slot has no variants key
styles.override(multi, {
  base: { root: { gap: '4px' } },
  variants: { tone: { danger: { root: { color: 'red' } } } },
});

// Custom-property keys + nested selectors remain assignable (Issue #146)
const themed = styles.component('ov-type-vars', (ctx) => {
  const ink = ctx.var('ink');
  return {
    base: { color: 'black' },
    variants: {
      intent: {
        danger: { [ink.name]: '#900', color: 'red', '&:hover': { opacity: 0.9 } },
        primary: { borderRadius: '8px', display: 'flex' },
      },
    },
  };
});

styles.override(themed, {
  base: { borderRadius: '4px', '--theme-pad': '8px' },
  variants: {
    intent: {
      primary: { textTransform: 'uppercase', '&:focus-visible': { outline: '2px solid' } },
    },
  },
});

// Layered callback recipes must keep the dimensioned overload (not fall through to flat)
const layeredVars = createStyles({
  layers: ['components', 'overrides'] as const,
});
const layeredThemed = layeredVars.component(
  'ov-type-layer-vars',
  (ctx) => {
    const ink = ctx.var('ink');
    return {
      base: { color: 'black' },
      variants: {
        intent: {
          danger: { [ink.name]: '#900', '&:hover': { opacity: 0.9 } },
          primary: { color: 'blue' },
        },
      },
    };
  },
  { layer: 'components' },
);
layeredThemed({ intent: 'primary' });
// @ts-expect-error — unknown option
layeredThemed({ intent: 'nope' });

// Widened CSS keywords + token strings remain assignable (Issue #149)
declare const gapToken: string;
const widenedLeaf = { flexWrap: 'wrap', columnGap: gapToken };
const widenedOk: VariantOptionStyle = widenedLeaf;

function makeWidenedSlotConfig() {
  return {
    slots: ['root'] as const,
    base: { root: { display: 'flex' as const } },
    variants: {
      size: { md: { root: { flexWrap: 'wrap', columnGap: gapToken } } },
    },
  };
}
const widenedRecipe = styles.component('ov-type-widen', makeWidenedSlotConfig());
widenedRecipe({ size: 'md' });
// @ts-expect-error — unknown option (must stay on slot-with-variants overload, not multi-slot)
widenedRecipe({ size: 'nope' });

void widenedOk;
