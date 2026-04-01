---
title: Comparing CSS-in-JS Libraries
description: How Typestyles compares to Emotion, Stitches, StyleX, CSS Modules, and Vanilla Extract
---

# Comparing CSS-in-JS Libraries

This page provides a detailed comparison of Typestyles against popular CSS-in-JS solutions. Each library makes different trade-offs — this guide helps you understand where Typestyles fits, and where each alternative shines.

---

## Feature Matrix

| Feature | Typestyles | Emotion | Stitches | StyleX | CSS Modules | Vanilla Extract |
|---|---|---|---|---|---|---|
| **Human-readable class names** | ✅ Yes | ❌ Hashes | ❌ Hashes | ❌ Hashes | ✅ Yes | ⚠️ Hashed |
| **Full TypeScript support** | ✅ Yes | ⚠️ Partial | ✅ Yes | ✅ Yes | ⚠️ Partial | ✅ Yes |
| **No build step required** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Required | ❌ Required | ❌ Required |
| **Zero runtime in production** | ⚠️ Optional | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **CSS custom property tokens** | ✅ First-class | ❌ Manual | ⚠️ Limited | ⚠️ Limited | ❌ Manual | ⚠️ Manual |
| **Theme contract enforcement** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Responsive variants** | ✅ Yes | ❌ Manual | ✅ Yes | ❌ Manual | ❌ Manual | ❌ Manual |
| **Atomic CSS output** | ✅ Optional | ❌ No | ❌ No | ✅ Default | ❌ No | ⚠️ Via Sprinkles |
| **CSS @layer support** | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Streaming SSR** | ✅ Yes | ⚠️ Limited | ⚠️ Limited | ✅ Yes | ✅ Yes | ✅ Yes |
| **Incremental adoption** | ✅ Easy | ✅ Easy | ✅ Easy | ❌ Difficult | ✅ Easy | ❌ Difficult |
| **Works with plain CSS** | ✅ Yes | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited | ✅ Yes | ⚠️ Limited |
| **Compound variants** | ✅ Yes | ❌ Manual | ✅ Yes | ❌ Manual | ❌ Manual | ❌ Manual |
| **Slot/multipart recipes** | ✅ Yes | ❌ Manual | ⚠️ Manual | ❌ Manual | ⚠️ Manual | ❌ Manual |
| **Actively maintained** | ✅ Yes | ✅ Yes | ❌ Archived | ✅ Yes | ✅ Yes | ✅ Yes |
| **ESLint plugin** | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |

---

## Typestyles vs Emotion

**Emotion** is the most widely deployed runtime CSS-in-JS library. It pioneered the `css` prop and works seamlessly with React, Vue, and vanilla JS.

### Where Emotion wins
- **Ecosystem maturity** — battle-tested in thousands of production apps
- **`css` prop** — inline styles feel natural in JSX
- **`@emotion/cache`** — advanced cache control for SSR

### Where Typestyles wins
- **Readable class names** — `button-base button-intent-primary` vs `css-1abc2de`
- **Design tokens as CSS custom properties** — cascade naturally through the DOM; work in plain CSS files
- **Theme contract enforcement** — TypeScript errors when a theme is missing required tokens
- **No runtime in production** — optional build extraction eliminates the Emotion runtime overhead
- **Responsive variants** — first-class `{ initial: 'sm', md: 'lg' }` syntax
- **CSS @layer wrapping** — prevents specificity conflicts with third-party CSS

### Code comparison

```tsx
// Emotion
import { css } from '@emotion/react';

const buttonStyle = css`
  padding: 8px 16px;
  background-color: #0066ff;
  color: white;
`;

<button css={buttonStyle}>Click</button>
// Generated class: .css-1h3iuup

// Typestyles
import { styles } from 'typestyles';

const button = styles.create('button', {
  base: { padding: '8px 16px', backgroundColor: '#0066ff', color: 'white' },
});

<button className={button('base')}>Click</button>
// Generated class: .button-base
```

---

## Typestyles vs Stitches

**Stitches** introduced the concept of first-class variants and compound variants, and was a major influence on Typestyles' component API. **However, Stitches is no longer actively maintained** (archived in 2023).

### Where Stitches wins (historical)
- **Responsive variants** were first-class before Typestyles added them
- **`as` prop** for polymorphic components was built in

### Where Typestyles wins
- **Actively maintained** — Stitches is archived; Typestyles is under active development
- **Framework-agnostic** — Stitches had React-specific APIs; Typestyles works anywhere
- **No runtime** — optional build extraction; Stitches always required a runtime
- **CSS custom property tokens** — Typestyles tokens work in plain CSS; Stitches tokens didn't
- **Slot recipes** — multipart component styling for complex UI patterns
- **ESLint plugin** — catch mistakes at lint time

### Code comparison

```tsx
// Stitches
import { styled } from '@stitches/react';

const Button = styled('button', {
  padding: '8px 16px',
  variants: {
    intent: {
      primary: { backgroundColor: '#0066ff', color: 'white' },
      ghost: { backgroundColor: 'transparent', border: '1px solid #0066ff' },
    },
  },
  defaultVariants: { intent: 'primary' },
});

<Button intent="ghost" />

// Typestyles
import { styles } from 'typestyles';

const button = styles.component('button', {
  base: { padding: '8px 16px' },
  variants: {
    intent: {
      primary: { backgroundColor: '#0066ff', color: 'white' },
      ghost: { backgroundColor: 'transparent', border: '1px solid #0066ff' },
    },
  },
  defaultVariants: { intent: 'primary' },
});

<button className={button({ intent: 'ghost' })} />
```

---

## Typestyles vs StyleX

**StyleX** is Meta's CSS-in-JS library, designed for massive scale. It achieves zero runtime cost through build-time extraction and produces atomic CSS output.

### Where StyleX wins
- **Zero runtime** — all CSS is statically extracted at build time; no JS executes at runtime
- **Atomic output by default** — CSS file size plateaus as the codebase grows
- **Collision-free composition** — last-property-wins is guaranteed by the atomic model
- **Mature at scale** — powers facebook.com, Instagram, and WhatsApp

### Where Typestyles wins
- **No build step required** — StyleX requires a Babel/ESLint transform; Typestyles works anywhere
- **Readable class names** — StyleX generates hashes like `x1qhh985`; Typestyles generates `button-base`
- **Incremental adoption** — StyleX can't coexist easily with other styling approaches
- **CSS custom property tokens** — Typestyles tokens cascade through the DOM; StyleX uses variable-like objects
- **Responsive variants** — first-class API; StyleX requires manual media queries
- **Theme contract enforcement** — TypeScript enforces theme completeness

### Code comparison

```tsx
// StyleX
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  base: { padding: '8px 16px' },
  primary: { backgroundColor: '#0066ff', color: 'white' },
});

<button {...stylex.props(styles.base, styles.primary)}>Click</button>
// Generated: class="x1qhh985 x1a2a7pz"

// Typestyles
import { styles } from 'typestyles';

const button = styles.create('button', {
  base: { padding: '8px 16px' },
  primary: { backgroundColor: '#0066ff', color: 'white' },
});

<button className={button('base', 'primary')}>Click</button>
// Generated: class="button-base button-primary"
```

---

## Typestyles vs CSS Modules

**CSS Modules** are the oldest and most universally supported approach to scoped CSS. Every major bundler supports them natively.

### Where CSS Modules win
- **Zero runtime** — pure CSS, no JavaScript at all
- **Full CSS feature support** — any CSS syntax works, including `@property`, cascade layers, etc.
- **Browser DevTools** — CSS is as readable as hand-authored files
- **No lock-in** — CSS Modules files work with any bundler and can be migrated trivially

### Where Typestyles wins
- **TypeScript** — full type safety for style objects, tokens, and variants; CSS Modules have no type checking
- **Design tokens as first-class API** — `tokens.create()` generates typed references; CSS Modules require manual `var()` strings
- **Variants and compound variants** — `styles.component()` codifies variant logic; CSS Modules require class composition in JS
- **Theme contract enforcement** — TypeScript errors on incomplete themes; CSS Modules have no contract concept
- **Colocation** — styles live alongside component code in `.ts` files; CSS Modules need separate `.module.css` files
- **No build step beyond bundler** — works with any bundler that handles TypeScript

### Code comparison

```css
/* button.module.css */
.base { padding: 8px 16px; border-radius: 6px; }
.primary { background-color: var(--color-primary); color: white; }
.ghost { background-color: transparent; border: 1px solid var(--color-primary); }
```

```tsx
// With CSS Modules — no type checking on class names
import styles from './button.module.css';

<button className={`${styles.base} ${styles.primary}`}>Click</button>

// With Typestyles — full TypeScript inference
import { styles } from 'typestyles';
const button = styles.create('button', {
  base: { padding: '8px 16px', borderRadius: '6px' },
  primary: { backgroundColor: color.primary, color: 'white' },
  ghost: { backgroundColor: 'transparent', border: `1px solid ${color.primary}` },
});

// TypeScript error if 'primray' (typo) is passed:
<button className={button('base', 'primary')}>Click</button>
```

---

## Typestyles vs Vanilla Extract

**Vanilla Extract** is a zero-runtime CSS-in-JS library that extracts styles at build time while providing full TypeScript support. It introduced `createThemeContract()` for typed theme enforcement.

### Where Vanilla Extract wins
- **Zero runtime** — all CSS is statically extracted; no JS at runtime
- **`createThemeContract()`** — TypeScript errors when a theme is incomplete (Typestyles now has this too via `tokens.createContract()`)
- **Sprinkles** — type-safe atomic utility classes with responsive conditions
- **Mature ecosystem** — Rainbow Sprinkles, Dessert Box, and other community packages

### Where Typestyles wins
- **No build step** — Vanilla Extract requires a bundler plugin (Vite, Webpack, esbuild); Typestyles works without one
- **Readable class names** — Vanilla Extract hashes class names; Typestyles uses semantic names
- **Responsive variants** — first-class `{ initial: 'sm', md: 'lg' }` API; Vanilla Extract uses Sprinkles conditions
- **CSS custom property tokens** — Typestyles tokens are CSS custom properties that work in plain CSS; Vanilla Extract tokens are virtual
- **Slot recipes** — `styles.component({ slots: [...] })` for multipart components; Vanilla Extract requires manual composition
- **Incremental adoption** — add to any project without build changes; Vanilla Extract requires build plugin from day one

### Code comparison

```ts
// Vanilla Extract
import { createThemeContract, createTheme, style } from '@vanilla-extract/css';

const colorContract = createThemeContract({
  primary: '',
  surface: '',
});

const lightTheme = createTheme(colorContract, {
  primary: '#0066ff',  // TypeScript error if missing
  surface: '#ffffff',
});

const button = style({ padding: '8px 16px', backgroundColor: colorContract.primary });

// Typestyles
import { tokens, styles } from 'typestyles';

const colorContract = tokens.createContract('color', {
  primary: '',
  surface: '',
});

const lightTheme = tokens.createTheme('light', colorContract, {
  primary: '#0066ff',  // TypeScript error if missing
  surface: '#ffffff',
});

const button = styles.create('button', {
  base: { padding: '8px 16px', backgroundColor: colorContract.primary },
});
```

---

## When to Choose Typestyles

Choose **Typestyles** when you want:
- Human-readable class names that match your component naming in browser DevTools
- Full TypeScript type safety without a mandatory build plugin
- First-class design tokens via CSS custom properties (works in plain CSS too)
- Variant-driven component styling with responsive breakpoint support
- Incremental adoption alongside existing CSS or other libraries
- Theme contract enforcement to ensure complete themes at TypeScript compile time

Consider **StyleX or Vanilla Extract** when you need:
- Absolute zero runtime for performance-critical applications at Meta/Facebook scale
- Guaranteed atomic CSS output from day one

Consider **CSS Modules** when you need:
- The simplest possible setup with zero JavaScript runtime
- Full CSS syntax support with no abstraction layer
- Maximum portability and zero lock-in

Consider **Emotion** when you need:
- The `css` prop inline styling model
- The largest existing ecosystem and most third-party component compatibility

---

## Migration Guides

- [Migrating from Emotion](/docs/migration#from-emotion)
- [Migrating from CSS Modules](/docs/migration#from-css-modules)
- [Migrating from Stitches](/docs/migration#from-stitches)
- [Migrating from Vanilla Extract](/docs/migration#from-vanilla-extract)
