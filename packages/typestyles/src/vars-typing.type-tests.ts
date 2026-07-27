/**
 * Compile-time assertions for c.vars() custom-property assignments.
 * Issue #167 — failures here fail `pnpm typecheck`.
 */
import { createStyles } from './styles';
import type { CSSProperties, VariantOptionStyle } from './types';

const styles = createStyles();

function makeSelectedBlock(v: {
  background: { name: string; var: string };
  border: { name: string; var: string };
  foreground: { name: string; var: string };
  selectedBackground: { name: string; var: string };
  selectedForeground: { name: string; var: string };
}): VariantOptionStyle {
  return {
    [v.background.name]: v.selectedBackground.var,
    [v.border.name]: v.selectedBackground.var,
    [v.foreground.name]: v.selectedForeground.var,
    '&:hover': {
      [v.background.name]: '#0055cc',
    },
  };
}

function setVar(name: string, value: string): VariantOptionStyle {
  return { [name]: value };
}

// --- base with nested computed var keys ---
const baseVars = styles.component('vars-base', (ctx) => {
  const v = ctx.vars({
    background: { value: '#fff', syntax: '<color>', inherits: false },
  });
  return {
    base: {
      color: 'black',
      '&[data-expanded]': {
        [v.background.name]: '#eee',
        display: 'block',
      },
    },
  };
});

// --- dimensioned variants ---
const flatVars = styles.component('vars-flat', (ctx) => {
  const v = ctx.vars({
    background: { value: '#fff', syntax: '<color>', inherits: false },
    foreground: { value: '#000', syntax: '<color>', inherits: false },
  });
  return {
    base: { color: v.foreground.var },
    variants: {
      intent: {
        primary: {
          [v.background.name]: '#00f',
          [v.foreground.name]: '#fff',
          color: 'red',
        },
        secondary: {
          [v.background.name]: '#eee',
          '&:hover': {
            [v.background.name]: '#ddd',
            opacity: 0.9,
          },
        },
      },
    },
  };
});
flatVars({ intent: 'primary' });

// --- nested state selector with computed var keys ---
const stateVars = styles.component('vars-state', (ctx) => {
  const v = ctx.vars({
    background: { value: '#fff', syntax: '<color>', inherits: false },
    border: { value: '#ccc', syntax: '<color>', inherits: false },
    foreground: { value: '#000', syntax: '<color>', inherits: false },
    selectedBackground: { value: '#00f', syntax: '<color>', inherits: false },
    selectedForeground: { value: '#fff', syntax: '<color>', inherits: false },
  });
  return {
    variants: {
      selected: {
        true: {
          '&[data-selected]': makeSelectedBlock(v),
        },
        false: {},
      },
    },
  };
});
stateVars({ selected: true });

// --- slot variants with computed var keys ---
const slotVars = styles.component('vars-slot', (ctx) => {
  const v = ctx.vars({
    background: { value: '#fff', syntax: '<color>', inherits: false },
    foreground: { value: '#000', syntax: '<color>', inherits: false },
  });
  return {
    slots: ['root', 'icon'] as const,
    base: { root: { display: 'flex' } },
    variants: {
      tone: {
        danger: {
          root: {
            [v.background.name]: '#fee',
            [v.foreground.name]: '#900',
            '&:hover': {
              [v.background.name]: '#fcc',
            },
          },
          icon: { opacity: 1 },
        },
      },
    },
  };
});
slotVars({ tone: 'danger' });

// --- flat variant keys (CVA-style) ---
const cvaVars = styles.component('vars-cva', (ctx) => {
  const v = ctx.vars({
    background: { value: '#fff', syntax: '<color>', inherits: false },
  });
  return {
    base: { color: 'black' },
    primary: {
      [v.background.name]: '#00f',
      '&:hover': {
        [v.background.name]: '#00e',
      },
    },
  };
});

// --- multi-slot without variants ---
const multiSlot = styles.component('vars-multi', (ctx) => {
  const v = ctx.vars({
    background: { value: '#fff', syntax: '<color>', inherits: false },
  });
  return {
    slots: ['root'] as const,
    root: {
      [v.background.name]: '#eee',
      '&:hover': {
        [v.background.name]: '#ddd',
      },
    },
  };
});

function setCssVar(name: string, value: string): CSSProperties {
  return { [name]: value };
}

// --- direct assignability ---
const directAssign: VariantOptionStyle = {
  color: 'red',
  '&[data-selected]': setVar('--test-bg', 'blue'),
};

const directCssProperties: CSSProperties = {
  color: 'red',
  '&[data-selected]': setCssVar('--test-bg', 'blue'),
};

// --- withUtils + computed var keys ---
const utils = styles.withUtils({
  padded: (size: number) => ({ padding: size }),
});

function withUtilsVars(v: { background: { name: string } }): string {
  return utils.class('vars-utils', {
    [v.background.name]: '#eee',
    '&:hover': {
      [v.background.name]: '#ddd',
    },
    padded: 8,
  });
}

void baseVars;
void flatVars;
void stateVars;
void slotVars;
void cvaVars;
void multiSlot;
void directAssign;
void directCssProperties;
void withUtilsVars;
