# Unified API: `styles.component`

## Problem

TypeStyles has three ways to create styled things (`styles.create`, `styles.component`, manual `styles.class` + `cx()`), each with different call signatures, different `base` behavior, different return types, and incompatible composition. This forces every user to answer "which API do I use?" and creates real bugs (forgetting `'base'` in `styles.create`), weak IntelliSense, and migration friction from CVA/Stitches.

## Current (3 incompatible paths)

```ts
// styles.create — varargs, base NOT auto-applied, returns function-only
const card = styles.create('card', {
  base: { padding: '16px' },
  elevated: { boxShadow: '...' },
});
card('base', 'elevated');  // must remember 'base'
card('primry');            // typo → silent empty string
card.base;                 // ❌ undefined — can't destructure

// styles.component — object args, base IS auto-applied, returns function-only
const button = styles.component('button', {
  base: { padding: '8px 16px' },
  variants: { intent: { primary: { backgroundColor: '#0066ff' } } },
});
button({ intent: 'primary' }); // base auto-applied ✓
const { primary } = button;    // ❌ doesn't work

// What people actually do (design-system example) — hand-roll everything
const buttonBase = styles.class('ds-button', { ... });
const buttonPrimary = styles.hashClass({ ... }, 'ds-button-primary');
export const button = { base: buttonBase, primary: buttonPrimary } as const;
```

## Desired: One API, CVA-Style Return

`styles.component` becomes the single API. It returns an object that is **both callable as a function AND destructurable as an object** — the CVA pattern.

### Defining a component (with dimensioned variants)

```ts
const button = styles.component('button', {
  base: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' },
  variants: {
    intent: {
      primary: { backgroundColor: '#0066ff', color: '#fff' },
      secondary: { backgroundColor: '#e5e7eb', color: '#111' },
      ghost: { backgroundColor: 'transparent' },
    },
    size: {
      sm: { fontSize: '14px' },
      lg: { fontSize: '18px', padding: '12px 24px' },
    },
  },
  compoundVariants: [
    { variants: { intent: 'primary', size: 'lg' }, style: { fontWeight: 'bold' } },
  ],
  defaultVariants: { intent: 'primary', size: 'sm' },
});
```

### Usage: function call (base always auto-applied, variants typed)

```ts
button(); // defaults → "button button-intent-primary button-size-sm"
button({ intent: 'ghost' }); // "button button-intent-ghost button-size-sm"
button({ intent: 'primary', size: 'lg' }); // "button button-intent-primary button-size-lg"
```

### Usage: destructure individual class strings

```ts
// Dimensioned variants: keys are "{dimension}-{option}" format
const { base, 'intent-primary': primary, 'intent-ghost': ghost, 'size-sm': sm, 'size-lg': lg } = button;

<div className={base} />                        // just base styles
<div className={cx(base, primary)} />           // compose manually
<div className={primary} />                     // single variant class
```

### Simple case (no dimensioned variants, flat keys)

```ts
const card = styles.component('card', {
  base: { padding: '16px', borderRadius: '8px' },
  elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  compact: { padding: '8px' },
});

// Function call — base always auto-applied
card()                    // "card-base"
card({ elevated: true })  // "card-base card-elevated"

// Destructure
const { base, elevated, compact } = card;
className={cx(base, isElevated && elevated)}
```

### Multi-slot components (multiple independent parts, no variants)

For complex components with multiple parts/slots like Checkbox, Dialog, or Card:

```ts
const checkbox = styles.component('checkbox', {
  slots: ['root', 'box', 'label'] as const,
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  box: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: '1px solid currentColor',
  },
  label: {
    fontSize: '14px',
  },
});

// Destructure each slot's class
const { root, box, label } = checkbox;

// Call as function to get all slots at once
const classes = checkbox();
// { root: 'checkbox-root', box: 'checkbox-box', label: 'checkbox-label' }

<Checkbox className={checkbox.root}>
  <span className={checkbox.box} />
  <span className={checkbox.label}>Label</span>
</Checkbox>
```

## Return Type Contract

`styles.component(name, config)` returns an object that:

1. **Is callable** — `button()` or `button({ intent: 'primary' })` returns a class string with base always included
2. **Is destructurable** — each variant value is a property returning its class string (`button.base`, `button['intent-primary']`, etc.)
3. **Has TypeScript autocomplete** on both the function argument keys and the destructured property keys
4. **Rejects unknown variants** at the type level (no silent empty strings)

## What Gets Removed

| Removed                                                | Replacement                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `styles.create`                                        | `styles.component` (absorbs all behavior)                      |
| Varargs calling convention `button('base', 'primary')` | Object syntax `button({ intent: 'primary' })` or destructuring |
| Manual `'base'` inclusion                              | Base is always auto-applied when calling as function           |

## What Stays

- `styles.class` — for single standalone classes (no variants)
- `styles.hashClass` — escape hatch
- `cx()` — shipped as a built-in utility (see separate task 1.2)

## Key Decisions

1. **API name is `styles.component`**, not `styles.create`
2. **Base is always auto-applied** when using the function call form
3. **Destructured properties return individual class strings** (not class strings with base included — use function call for that)
4. **Flat variants** (no `variants:` wrapper) are supported for simple cases and detected automatically by the absence of a `variants` key
5. **`defaultVariants` and `compoundVariants`** are supported (same design as current `styles.component`)
6. **Invalid variant names are TypeScript errors**, not silent failures
7. **Multi-slot components** (with `slots:` key) are supported for complex components with multiple independent parts
