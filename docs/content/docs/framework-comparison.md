---
title: Framework comparison
description: How TypeStyles compares to StyleX, Panda CSS, vanilla-extract, Emotion, CSS Modules, and plain CSS—with a shared button example and a topic-by-topic comparison
---

This page is a **decision lens**: same button pattern across ecosystems, then a **topic-by-topic** comparison (easier to scan on a laptop than a wide grid of cards or a seven-column table). For API-by-API moves, use the [Migration guide](/docs/migration). For install and your first component, see [Getting started](/docs/getting-started).

## Compared at a glance

Each subsection below is one decision axis. Lists use normal body typography—**tool names** and `inline code` carry the emphasis.

### Build

- **TypeStyles** — Optional; runtime by default, [zero-runtime](/docs/zero-runtime) when you want.
- **StyleX** — **Required** compiler (Babel / SWC).
- **Panda CSS** — **Required** codegen + config.
- **vanilla-extract** — **Required** `.css.ts` + bundler.
- **Emotion / styled-components** — Bundler only; runtime in the loop.
- **CSS Modules** — Bundler maps your authored class names to **per-file scoped** output.
- **Plain CSS** — None for CSS itself.

### Typical DOM classes

- **TypeStyles** — Readable names (`button-intent-primary`); scoped `--scope-token-*`.
- **StyleX** — Atomic, hashed.
- **Panda CSS** — Utilities / recipes from your preset.
- **vanilla-extract** — Usually hashed / scoped.
- **Emotion / styled-components** — Hashed.
- **CSS Modules** — You choose readable names in CSS; the bundler emits **scoped** class strings in the DOM, **usually with a short content hash** so files cannot collide (for example `._primary_abc123`).
- **Plain CSS** — Whatever you author.

### Tokens

- **TypeStyles** — `tokens.create` → real CSS variables.
- **StyleX** — `defineVars` + compiler.
- **Panda CSS** — Config-first scales (`blue.600`, etc.).
- **vanilla-extract** — You wire CSS vars / contracts.
- **Emotion / styled-components** — Theme objects / your own vars.
- **CSS Modules** — Your globals / vars.
- **Plain CSS** — Your conventions.

### Good fit when…

- **TypeStyles** — TS variants **and** inspectable CSS **without** a compiler on day one.
- **StyleX** — Meta stack, static guarantees, atomic output.
- **Panda CSS** — You want Panda’s pipeline and strict token schema.
- **vanilla-extract** — **Zero runtime by default**, file-based CSS.
- **Emotion / styled-components** — Classic styled API; fine with runtime (or separate extraction).
- **CSS Modules** — Mostly hand-written CSS; variants via `clsx` / toggles.
- **Plain CSS** — Maximum portability; TS ergonomics are DIY.

**SSR / production CSS:** TypeStyles can [collect styles for SSR](/docs/ssr) and optionally [extract static CSS](/docs/zero-runtime). StyleX, Panda, and vanilla-extract generally emit CSS at build time. Emotion’s story depends on your bundler and extraction setup. CSS Modules and plain CSS ship as stylesheets like any static asset.

---

## Same button: primary vs ghost

Each snippet is a **typed** `intent` (`primary` = filled, `ghost` = outline). Real apps add focus, sizing, and tokens; lengths are trimmed.

### TypeStyles (recommended shape)

[`createTypeStyles`](/docs/api-reference#createtypestyles-options) keeps **styles** and **tokens** on one **`scopeId`** (see [Getting started](/docs/getting-started)).

```ts
import { createTypeStyles } from 'typestyles';

const { styles, tokens } = createTypeStyles({ scopeId: 'app' });
const color = tokens.create('color', { primary: '#2563eb', surface: '#ffffff' });

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

### StyleX (compiler, atomic classes)

Author-time objects; **`stylex.props`** merges styles at compile time. Hashed atomic classes in the DOM.

```ts
import * as stylex from '@stylexjs/stylex';

const s = stylex.create({
  base: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
  },
  primary: { backgroundColor: '#2563eb', color: '#fff' },
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
<button type="button" {...stylex.props(s.base, intent === 'ghost' ? s.ghost : s.primary)}>
  {children}
</button>
```

### Panda CSS (`cva` / recipes)

Codegen from **`panda.config`**; import paths vary (`../styled-system/css` here is illustrative). Token strings like `blue.600` are **your** scale.

```ts
import { cva } from '../styled-system/css';

export const button = cva({
  base: { px: '4', py: '2', rounded: 'md', fontWeight: 'medium', cursor: 'pointer' },
  variants: {
    intent: {
      primary: { bg: 'blue.600', color: 'white', borderWidth: '0' },
      ghost: { bg: 'transparent', color: 'blue.600', borderWidth: '1px', borderColor: 'blue.600' },
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

**`.css.ts`** files; bundler emits **static CSS**. Typed variants; class strings usually **hashed**.

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
      ghost: { background: 'transparent', color: '#2563eb', border: '1px solid #2563eb' },
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

**Styled component** or `css` prop; **hashed** classes; **tokens** are usually theme objects or vars you wire.

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
      ? `background: transparent; color: #2563eb; border: 1px solid #2563eb;`
      : `background: #2563eb; color: #fff;`}
`;
```

```tsx
<Button intent={intent}>{children}</Button>
```

### CSS Modules

**Plain CSS** in `.module.css`; bundler scopes names. Variants are **manual** (`clsx`, toggles, BEM).

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

Global stylesheets, BEM modifiers, or attribute selectors—**no** TS variant layer unless you add one yourself. Maximum portability; colocation and typing are DIY.

---

## When TypeStyles is a strong default

- **Readable classes** and **scoped CSS variables** for DevTools, legacy CSS, and third-party markup.
- **Typed variants** (CVA-/recipe-like) **without** a compiler on day one.
- **Incremental adoption** and **`createTypeStyles` + `scopeId`** for libraries or micro-frontends.
- Comfortable with **runtime injection in dev**, with an **optional** [zero-runtime](/docs/zero-runtime) path when you need static CSS.

## When another tool might win

- **StyleX** — Standardized on Meta’s compiler; want static guarantees and atomic output.
- **Panda CSS** — Want codegen utilities and a strict config-first token pipeline.
- **vanilla-extract** — Want **zero runtime by default** and are fine with `.css.ts` contracts.
- **Emotion / styled-components** — Want the classic styled API and accept runtime (or a separate extraction story).
- **CSS Modules** — Mostly hand-written CSS; no first-class variant API in the styling layer.
- **Plain CSS** — Zero JS styling layer; maximum portability.

## Practical migration

Start with [Migration](/docs/migration): Panda- and CVA-like APIs map closely to **`styles.component`**; Emotion and CSS Modules map well to **`styles.class`** plus [`cx`](/docs/compose) from `'typestyles'`.

## Related docs

- [Getting started](/docs/getting-started)
- [Design system with tokens](/docs/design-system)
- [Cascade layers](/docs/cascade-layers)
- [Zero-runtime extraction](/docs/zero-runtime)
- [Component library setup](/docs/component-library)
