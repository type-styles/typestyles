---
title: Framework comparison
description: How TypeStyles compares to StyleX, Panda CSS, vanilla-extract, Emotion, CSS Modules, and plain CSS—with concrete API examples
---

Most teams choose a styling layer alongside a framework and a design system. This page is a **decision lens**: it shows the **same button** in several ecosystems, then summarizes tradeoffs in smaller tables so you are not staring at one giant grid.

For step-by-step API mapping when you already know what you are leaving, use the [Migration guide](/docs/migration).

---

## Same button: primary vs ghost

Each example is a **typed** `intent` prop with **primary** (filled) and **ghost** (outline) looks. Snippets are trimmed for length; real projects add focus states, sizing, and tokens.

### TypeStyles (scoped instance)

One `createTypeStyles` call keeps **tokens** and **class names** on the same `scopeId`—the pattern we recommend in [Getting started](/docs/getting-started).

```ts
import { createTypeStyles } from 'typestyles';

const { styles, tokens } = createTypeStyles({ scopeId: 'app' });

const color = tokens.create('color', {
  primary: '#2563eb',
  surface: '#ffffff',
});

export const button = styles.component('button', {
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
  },
  variants: {
    intent: {
      primary: { backgroundColor: color.primary, color: color.surface },
      ghost: {
        backgroundColor: 'transparent',
        color: color.primary,
        border: `1px solid ${color.primary}`,
      },
    },
  },
  defaultVariants: { intent: 'primary' },
});
```

```tsx
<button type="button" className={button({ intent })}>
  {children}
</button>
```

You get readable classes (for example `button-base`, `button-intent-primary`) and scoped CSS variables (for example `--app-color-primary`).

### StyleX

Styles are **author-time objects** merged with **`stylex.props`**. A **compiler** (Babel / SWC) is required; the DOM usually sees **atomic, hashed** classes.

```ts
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
  },
  primary: {
    backgroundColor: '#2563eb',
    color: '#fff',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#2563eb',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#2563eb',
  },
});
```

```tsx
<button
  type="button"
  {...stylex.props(styles.base, intent === 'ghost' ? styles.ghost : styles.primary)}
>
  {children}
</button>
```

### Panda CSS (`cva` / recipes)

Panda leans on **codegen** from `panda.config` and generated imports (paths vary by project). Token strings like `blue.600` come from **your** token scale, not the library defaults.

```ts
import { cva } from '../styled-system/css';

export const button = cva({
  base: {
    px: '4',
    py: '2',
    rounded: 'md',
    fontWeight: 'medium',
    cursor: 'pointer',
  },
  variants: {
    intent: {
      primary: { bg: 'blue.600', color: 'white', borderWidth: '0' },
      ghost: {
        bg: 'transparent',
        color: 'blue.600',
        borderWidth: '1px',
        borderColor: 'blue.600',
      },
    },
  },
  defaultVariants: { intent: 'primary' },
});
```

```tsx
<button type="button" className={button({ intent })}>
  {children}
</button>
```

### vanilla-extract (`recipe`)

Author styles in **`.css.ts`** files; the bundler emits a **static CSS** artifact. Variants are typed; class strings are typically **hashed** unless you choose otherwise.

```ts
import { recipe } from '@vanilla-extract/recipes';

export const button = recipe({
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
  },
  variants: {
    intent: {
      primary: { background: '#2563eb', color: '#fff' },
      ghost: {
        background: 'transparent',
        color: '#2563eb',
        border: '1px solid #2563eb',
      },
    },
  },
  defaultVariants: { intent: 'primary' },
});
```

```tsx
<button type="button" className={button({ intent })}>
  {children}
</button>
```

### Emotion / styled-components

The classic pattern is a **styled component** or `css` prop with **template strings** or objects. Output classes are **hashed**; you usually **wire tokens yourself** (theme objects, variables, or both).

```tsx
import styled from '@emotion/styled';

export const Button = styled.button<{ intent?: 'primary' | 'ghost' }>`
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  ${(p) =>
    p.intent === 'ghost'
      ? `
    background: transparent;
    color: #2563eb;
    border: 1px solid #2563eb;
  `
      : `
    background: #2563eb;
    color: #fff;
  `}
`;
```

### CSS Modules

You write **plain CSS** (or Sass) in a `.module.css` file and import **scoped class names**. Variants are **manual** (toggle classes, BEM modifiers, or a small helper such as `clsx`).

```css
/* Button.module.css */
.base {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}
.primary {
  background: #2563eb;
  color: #fff;
}
.ghost {
  background: transparent;
  color: #2563eb;
  border: 1px solid #2563eb;
}
```

```tsx
import styles from './Button.module.css';
import clsx from 'clsx';

<button
  type="button"
  className={clsx(styles.base, intent === 'ghost' ? styles.ghost : styles.primary)}
>
  {children}
</button>;
```

### Plain CSS

Same idea as modules without the bundler renaming step: **global stylesheets**, **BEM-style** modifiers, or **attribute selectors**. Typing and variant composition live **outside** CSS unless you add your own conventions.

---

## Compare by workflow

These tables are intentionally smaller than a single “everything × everyone” matrix.

### Build and day-one setup

|                          | TypeStyles                                                       | StyleX                                       | Panda CSS                                             | vanilla-extract                |
| ------------------------ | ---------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------- | ------------------------------ |
| **Build required?**      | No for the default runtime path; optional plugins for extraction | Yes — compiler is the product                | Yes — CLI / PostCSS + codegen                         | Yes — `.css.ts` pipeline       |
| **Typical DOM classes**  | Readable semantic names by default                               | Atomic hashed classes                        | Utility / recipe classes from preset                  | Hashed or locally scoped       |
| **Incremental adoption** | Strong — one component at a time                                 | Harder — styles want the compiler everywhere | Moderate — generated output expects Panda conventions | Moderate — files are VE-native |

### Tokens, legacy CSS, and SSR

|                             | TypeStyles                                                                                       | StyleX                                                                         | Panda CSS                                          | vanilla-extract                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------- |
| **Design tokens**           | `tokens.create` → CSS custom properties (scoped with `scopeId`)                                  | `defineVars` / theming patterns; less “drop into any stylesheet” than raw vars | Config-first tokens + codegen utilities            | Contracts / Sprinkles; you wire variables explicitly |
| **Coexist with non-TS CSS** | Strong — same `var(--…)` in legacy sheets                                                        | Moderate — authored as JS objects                                              | Moderate — utilities assume Panda output           | Good — static CSS file                               |
| **SSR / production CSS**    | `collectStyles` from `typestyles/server`; optional [zero-runtime](/docs/zero-runtime) extraction | Compiler emits CSS ahead of time                                               | Build-time CSS + runtime pieces depending on setup | Import emitted CSS like any static bundle            |

**Emotion / styled-components** — Runtime-friendly, familiar component API; optional extraction; hashed classes. **CSS Modules** and **plain CSS** — Ship CSS files directly; you bring your own variant and token discipline.

---

## When TypeStyles is a strong default

- You want **human-readable classes** and **scoped CSS variables** so DevTools, legacy sheets, and third-party markup stay legible.
- You want **typed variants** (similar ergonomics to CVA / Panda recipes) **without** committing to a compiler on day one.
- You need **incremental adoption** and **scoped instances** (`createTypeStyles`, `scopeId`) for libraries or micro-frontends.
- You are fine with **runtime injection in development** and want an **optional** path to **static CSS** when you enable [zero-runtime extraction](/docs/zero-runtime).

## When another tool might win

- **StyleX** — You have standardized on Meta’s compiler, want maximum static guarantees, and accept hashed atomic classes plus stricter authoring rules.
- **Emotion / styled-components** — You want the classic styled API and accept runtime cost (or a separate extraction story).
- **Panda CSS** — You want codegen utilities, strict token schemas in config, and a Panda-first pipeline.
- **vanilla-extract** — You want **zero runtime by default** and are comfortable with build configuration and file contracts.
- **CSS Modules** — Your UI is mostly global tokens plus small scoped files; you do not need a first-class variant API in the styling layer.
- **Plain CSS** — Maximum portability and zero JS styling layer; you trade colocated TypeScript ergonomics unless you layer helpers yourself.

## Practical migration

Start with the [Migration guide](/docs/migration). Panda and CVA-like APIs map closely to `styles.component`; Emotion and CSS Modules map well to `styles.class` plus the [`cx` utility](/docs/compose) from `'typestyles'`.

## Related docs

- [Getting started](/docs/getting-started) — install, `createTypeStyles`, and first components
- [Design system with tokens](/docs/design-system) — token layers and governance
- [Cascade layers](/docs/cascade-layers) — `createTypeStyles` and `@layer`
- [Zero-runtime extraction](/docs/zero-runtime) — production CSS files
- [Component library setup](/docs/component-library) — publishing packages
