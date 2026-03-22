---
title: Recipes
description: Build typed variant APIs with styles.component
---

# Recipes

`styles.component()` is the first-class API for variant-driven component styling.

If you need flat named variants (without dimensioned recipe config), see [Styles](/docs/styles).

Use it when you want a typed interface with:

- `base` styles
- `variants` dimensions
- `compoundVariants` for combinations
- `defaultVariants`

## Basic recipe

```ts
import { styles } from 'typestyles';

export const button = styles.component('button', {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    borderRadius: '8px',
    fontWeight: 500,
  },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb', color: 'white' },
      ghost: { backgroundColor: 'transparent', color: '#1f2937' },
    },
    size: {
      sm: { padding: '6px 10px', fontSize: '14px' },
      lg: { padding: '10px 16px', fontSize: '16px' },
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'sm',
  },
});

button(); // "button-base button-intent-primary button-size-sm"
button({ size: 'lg' }); // "button-base button-intent-primary button-size-lg"
button({ intent: 'ghost', size: 'lg' }); // "button-base button-intent-ghost button-size-lg"
```

Class strings follow the global [class naming](/docs/class-naming) configuration (`semantic` by default).

## Compound variants

Use `compoundVariants` for styles that should apply only when multiple variant values match.

```ts
const badge = styles.component('badge', {
  variants: {
    tone: {
      success: { color: '#166534' },
      warning: { color: '#92400e' },
      danger: { color: '#991b1b' },
    },
    size: {
      sm: { fontSize: '12px' },
      lg: { fontSize: '14px' },
    },
  },
  compoundVariants: [
    {
      variants: { tone: ['success', 'warning'], size: 'lg' },
      style: { fontWeight: 700 },
    },
  ],
});

badge({ tone: 'success', size: 'lg' }); // includes "badge-compound-0"
badge({ tone: 'danger', size: 'lg' }); // does not include compound class
```

`compoundVariants` supports:

- single values: `{ size: 'lg' }`
- multi-value arrays: `{ tone: ['success', 'warning'] }`

## Boolean variants

Boolean variant dimensions are represented with `"true"` / `"false"` option keys.

```ts
const input = styles.component('input', {
  base: { border: '1px solid #d1d5db' },
  variants: {
    invalid: {
      true: { borderColor: '#ef4444' },
      false: { borderColor: '#d1d5db' },
    },
  },
  defaultVariants: {
    invalid: false,
  },
});

input(); // "input-base input-invalid-false"
input({ invalid: true }); // "input-base input-invalid-true"
```

## Multipart components (slots)

For components with several styled parts (tabs, accordion, select), pass a `slots` array. The same variant dimensions apply to every part; each variant option maps **slot names** to style objects. The function returns a **record of class strings**—one entry per declared slot. Slots with no matching styles still appear on the object with an empty string.

This is the TypeStyles equivalent of Panda’s [slot recipes](https://panda-css.com/docs/concepts/slot-recipes) (`sva`).

### Tabs

Typical parts: `root`, `list`, `trigger`, `content`.

```ts
import { styles, slotClass } from 'typestyles';

export const tabs = styles.component('tabs', {
  slots: ['root', 'list', 'trigger', 'content'] as const,
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '8px' },
    list: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb' },
    trigger: {
      cursor: 'pointer',
      padding: '8px 12px',
      border: 'none',
      background: 'transparent',
    },
    content: { padding: '12px 0' },
  },
  variants: {
    size: {
      sm: {
        trigger: { fontSize: '13px' },
        content: { fontSize: '13px' },
      },
      md: {
        trigger: { fontSize: '15px' },
        content: { fontSize: '15px' },
      },
    },
  },
  compoundVariants: [
    {
      variants: { size: 'md' },
      style: {
        trigger: { fontWeight: 600 },
      },
    },
  ],
  defaultVariants: { size: 'sm' },
});

// In render: resolve once, pass classes to each element
function TabPanel() {
  const cn = tabs({ size: 'md' });
  return (
    <div className={cn.root}>
      <div className={cn.list} role="tablist">
        <button type="button" className={cn.trigger} role="tab">
          One
        </button>
      </div>
      <div className={cn.content} role="tabpanel">
        …
      </div>
    </div>
  );
}

// Or pull a single slot (e.g. for a child component prop)
slotClass(tabs, 'trigger', { size: 'md' });
```

### Accordion

Parts: `root`, `item`, `trigger`, `content`.

```ts
export const accordion = styles.component('accordion', {
  slots: ['root', 'item', 'trigger', 'content'] as const,
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '4px' },
    item: { border: '1px solid #e5e7eb', borderRadius: '6px' },
    trigger: {
      width: '100%',
      textAlign: 'left',
      padding: '10px 12px',
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
    },
    content: { padding: '0 12px 12px' },
  },
  variants: {
    variant: {
      bordered: {
        item: { borderColor: '#d1d5db' },
      },
      ghost: {
        item: { border: 'none' },
        trigger: { paddingLeft: 0 },
      },
    },
  },
  defaultVariants: { variant: 'bordered' },
});
```

### Select

Parts: `root`, `control`, `icon`, `menu`, `option`.

```ts
export const select = styles.component('select', {
  slots: ['root', 'control', 'icon', 'menu', 'option'] as const,
  base: {
    root: { position: 'relative', display: 'inline-block' },
    control: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '160px',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      cursor: 'pointer',
    },
    icon: { width: '16px', height: '16px', opacity: 0.7 },
    menu: {
      marginTop: '4px',
      padding: '4px 0',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
      background: '#fff',
    },
    option: { padding: '8px 12px', cursor: 'pointer' },
  },
  variants: {
    size: {
      sm: {
        control: { fontSize: '13px', padding: '6px 10px' },
        option: { fontSize: '13px' },
      },
      md: {
        control: { fontSize: '15px' },
        option: { fontSize: '15px' },
      },
    },
  },
  defaultVariants: { size: 'md' },
});
```

### Slot map helper

`slotClass(component, slotName, selections?)` returns the same string as `component(selections)[slotName]`. Use it when you only need one part (for example a `className` prop on a shared primitive).

### Declared slots with no styles

If a name appears in `slots` but is never used in `base`, `variants`, or `compoundVariants`, that part always gets `''`. Whenever **`NODE_ENV` is not `production`** (including `development` and `test`), TypeStyles logs a console warning. Set **`TYPESTYLES_SILENT_UNUSED_SLOTS=1`** to disable those warnings.

## Data and ARIA selectors inside recipes

Recipes use the same selector model as `styles.create`.

```ts
const accordionTrigger = styles.component('accordion-trigger', {
  base: {
    '&[data-state="open"]': { fontWeight: 600 },
    '&[aria-expanded="true"]': { color: '#1d4ed8' },
  },
});
```

## Migration quick-start

### Variant API

`styles.component` uses the `base`, `variants`, `compoundVariants`, and `defaultVariants` config shape.

```ts
// Before
const button = styles.component('button', {
  base: { padding: '8px 12px' },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb' },
      ghost: { backgroundColor: 'transparent' },
    },
  },
  defaultVariants: { intent: 'primary' },
});

// Single API
const button = styles.component('button', {
  base: { padding: '8px 12px' },
  variants: {
    intent: {
      primary: { backgroundColor: '#2563eb' },
      ghost: { backgroundColor: 'transparent' },
    },
  },
  defaultVariants: { intent: 'primary' },
});
```

### From CVA

CVA config maps directly:

- `cva(base, { variants, compoundVariants, defaultVariants })`
- to `styles.component(name, { base, variants, compoundVariants, defaultVariants })`

The main difference is class generation/injection is handled by typestyles.

See the [Migration Guide](/docs/migration) for library-specific examples.

## Related docs

- [Styles](/docs/styles)
- [Migration Guide](/docs/migration)
- [Custom Selectors & At-Rules](/docs/custom-at-rules)
