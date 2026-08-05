/**
 * Compile-time assertions for `styles.override()` — included in `tsc --noEmit`
 * (unlike `*.test.ts`). Failures here fail `pnpm typecheck`.
 */
import { createStyles } from './styles';
import { when } from './theme';
import { conditional } from './override';
import type { OverrideConfigFor } from './override';
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

// `conditions` in styles.override() configs (Issue #169) — must type-check, not just
// run correctly under vitest's untyped transform (see override-conditions.test.ts).
const condBtn = styles.component('ov-type-cond-btn', {
  base: { color: 'black' },
  variants: {
    intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
  },
});

styles.override(condBtn, {
  base: {
    color: 'red',
    conditions: [conditional(when.prefersDark, { color: 'white' })],
  },
  variants: {
    intent: {
      primary: {
        conditions: [conditional(when.prefersDark, { color: 'lightblue' }, 'primary-dark')],
      },
    },
  },
  compoundVariants: [
    {
      variants: { intent: 'primary' },
      style: {
        fontWeight: 700,
        conditions: [conditional(when.prefersDark, { fontWeight: 900 })],
      },
    },
  ],
});

// @ts-expect-error — conditions entry missing required `when`
styles.override(condBtn, {
  base: {
    conditions: [{ style: { color: 'red' } }],
  },
});

// Mode-aware `{ light, dark }` values (Issue #169) — must type-check on override configs.
const modeBtn = styles.component('ov-type-mode-btn', {
  base: { color: 'black' },
  variants: {
    intent: { primary: { color: 'blue' } },
  },
});

styles.override(modeBtn, {
  base: { color: { light: '#111', dark: '#eee' } },
  variants: {
    intent: { primary: { backgroundColor: { light: '#fff', dark: '#000' } } },
  },
});

const modeOk: VariantOptionStyle = { color: { light: '#111', dark: '#eee' } };
void modeOk;

// @ts-expect-error — mode object missing required `dark` key
const modeMissingDark: VariantOptionStyle = { color: { light: '#111' } };
void modeMissingDark;

// Slot overrides also accept mode-aware values
const modeAlert = styles.component('ov-type-mode-slot', {
  slots: ['root'] as const,
  base: { root: { display: 'flex' } },
});
styles.override(modeAlert, {
  base: { root: { color: { light: '#111', dark: '#eee' } } },
});

// OverrideConfigFor<C> — mirrors OverrideFn branches (Issue #160)
const dimOverride: OverrideConfigFor<typeof button> = {
  base: { color: 'red' },
  variants: { intent: { primary: { textTransform: 'uppercase' } } },
};
void dimOverride;

const flatCard = styles.component('ov-type-flat', {
  base: { padding: '8px' },
  elevated: { boxShadow: '0 2px 4px' },
});
void flatCard;
const flatOverride: OverrideConfigFor<typeof flatCard> = {
  base: { padding: '12px' },
  elevated: { boxShadow: '0 4px 8px' },
};
void flatOverride;

const slotOverride: OverrideConfigFor<typeof alert> = {
  base: { root: { gap: '8px' } },
  variants: { tone: { danger: { root: { outline: '1px solid red' } } } },
};
void slotOverride;

const multiOverride: OverrideConfigFor<typeof multi> = {
  base: { root: { gap: '4px' }, title: { fontSize: '14px' } },
};
void multiOverride;

const dimBad: OverrideConfigFor<typeof button> = {
  variants: {
    // @ts-expect-error — dimensioned config rejects unknown variant dimension
    missing: { primary: { color: 'red' } },
  },
};
void dimBad;

const flatBad: OverrideConfigFor<typeof flatCard> = {
  // @ts-expect-error — flat config rejects unknown variant key
  missing: { padding: '0' },
};
void flatBad;

const slotBad: OverrideConfigFor<typeof alert> = {
  variants: {
    // @ts-expect-error — slot config rejects unknown variant dimension
    missing: { danger: { root: { color: 'red' } } },
  },
};
void slotBad;

const multiBad: OverrideConfigFor<typeof multi> = {
  base: { root: { gap: '4px' } },
  // @ts-expect-error — multi-slot config forbids variants
  variants: { tone: { danger: { root: { color: 'red' } } } },
};
void multiBad;

// Typed override vars (Pattern A — explicit var definitions generic)
const sideNavVarDefinitions = {
  border: { value: '1px solid #ccc', syntax: '<color>' as const },
  headingColor: { value: '#111', syntax: '<color>' as const },
} as const;

const sideNav = styles.component('ov-type-vars-nav', (c) => {
  const v = c.vars(sideNavVarDefinitions);
  return {
    slots: ['root'] as const,
    base: { root: { borderColor: v.border.var, color: v.headingColor.var } },
  };
});
void sideNav;

type SideNavOverride = OverrideConfigFor<typeof sideNav, typeof sideNavVarDefinitions>;
const sideNavVarsOk: SideNavOverride = {
  vars: { border: 'transparent', headingColor: 'var(--brand-heading)' },
  base: { root: { margin: '8px' } },
};
void sideNavVarsOk;

const sideNavVarsBad: SideNavOverride = {
  vars: {
    // @ts-expect-error — unknown var key
    missing: 'x',
  },
};
void sideNavVarsBad;

const layoutVarDefinitions = {
  padding: { outer: { x: '8px', y: '8px' } },
} as const;

const layoutRecipe = styles.component('ov-type-vars-layout', (c) => {
  const v = c.vars(layoutVarDefinitions);
  return {
    base: {
      paddingInline: v.padding.outer.x.var,
      paddingBlock: v.padding.outer.y.var,
    },
  };
});
void layoutRecipe;

type LayoutOverride = OverrideConfigFor<typeof layoutRecipe, typeof layoutVarDefinitions>;
const layoutVarsOk: LayoutOverride = {
  vars: { padding: { outer: { x: '24px' } } },
};
void layoutVarsOk;

// Pattern B — varDefinitions option stamps __varDefinitions for inference
const brandedNav = styles.component(
  'ov-type-branded-nav',
  (c) => {
    const v = c.vars(sideNavVarDefinitions);
    return {
      slots: ['root'] as const,
      base: { root: { borderColor: v.border.var } },
    };
  },
  { varDefinitions: sideNavVarDefinitions },
);
void brandedNav;

const brandedVarsOk: OverrideConfigFor<typeof brandedNav> = {
  vars: { border: 'transparent' },
};
void brandedVarsOk;

// Top-level config vars stamp __varDefinitions — OverrideConfigFor infers without a second generic
const configVarsNav = styles.component('ov-config-vars-nav', {
  vars: sideNavVarDefinitions,
  slots: ['root'] as const,
  base: { root: { display: 'flex' } },
});
void configVarsNav;

const configVarsOk: OverrideConfigFor<typeof configVarsNav, typeof sideNavVarDefinitions> = {
  vars: { border: 'transparent' },
};
void configVarsOk;

// Recipes without var schema forbid vars on OverrideConfigFor
const noVarsOverride: OverrideConfigFor<typeof button> = {
  base: { color: 'red' },
  // @ts-expect-error — component has no varDefinitions / __varDefinitions brand
  vars: { background: 'crimson' },
};
void noVarsOverride;
