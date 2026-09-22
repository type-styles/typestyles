---
title: Attribute mode — React & Astro
description: Spread recipe results onto elements in attribute naming mode without dropping variant attrs
---

Attribute mode (`createStyles({ mode: 'attribute' })`) resolves recipe calls to a
`ComponentAttrsResult`: a base class plus `data-*` variant attributes. This guide
covers the binding helpers you need in React, Astro, and other JSX frameworks.

See also: [Components — attribute-driven variants](/docs/components#attribute-driven-variants).

## Quick reference

| Goal                               | Use                                           |
| ---------------------------------- | --------------------------------------------- |
| Spread with no extra classes       | `{...result.props}`                           |
| Spread + consumer `className`      | `{...mergeProps(result, className)}`          |
| Multiple slots on one element      | `{...combine(a.root, a.linkRoot, className)}` |
| Class string only (scripts, hooks) | `result.className`                            |

```ts
import { mergeProps, combine, cx } from 'typestyles';
```

## `{...result.props}` — zero overrides

When the element needs only the recipe output and no external `className`, spread
`.props` directly:

```tsx
const s = button({ tone: 'accent', size: 'md' });

<button {...s.props}>Save</button>;
// => className="button" data-tone="accent" data-size="md"
```

In Astro:

```astro
---
const s = stack({ direction: 'column', gap: 'md' });
---
<div {...s.props}><slot /></div>
```

## `{...mergeProps(result, className)}` — default binding

Most components accept a consumer `className`. Use `mergeProps` to merge attrs and
classes without dropping variant attributes:

```tsx
interface ButtonProps {
  tone?: 'accent' | 'neutral';
  className?: string;
  children: React.ReactNode;
}

export function Button({ tone = 'accent', className, children }: ButtonProps) {
  const s = button({ tone });
  return <button {...mergeProps(s, className)}>{children}</button>;
}
```

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
const s = stack({ direction: 'column', gap: 'md' });
---
<div {...mergeProps(s, className)}><slot /></div>
```

`mergeProps` also accepts a plain class string when you only need class merging:

```tsx
<div {...mergeProps('card-base', isActive && 'card-active', className)} />
```

## `combine` — multiple slots on one element

Multi-slot recipes return per-slot results. When two slots share a single DOM node
(for example a card root that is also the link surface), use `combine`:

```tsx
const c = clickableCard({ layout: 'horizontal' });

<a {...combine(c.root, c.linkRoot, className)} href={href}>
  …
</a>;
```

State modifiers that are class-only slots (no attrs) compose cleanly:

```tsx
<button {...combine(s.button, !copied && s.buttonIdle, copied && s.buttonCopied, className)} />
```

Prefer a single recipe call with compound variants when every attribute must stay
consistent. Reach for `combine` when slots only overlap by class name on one node.

In development, `combine` warns when the same attribute key appears with different
values (last wins) or when multiple slots with attrs merge onto one element.

## Anti-pattern: `className={cx(result)}`

`cx()` joins class strings via `toString()`. For `ComponentAttrsResult`, that
**drops variant attributes** — styling silently breaks.

```tsx
// Wrong — data-tone never reaches the DOM
<button className={cx(s, className)} />

// Right
<button {...mergeProps(s, className)} />
```

In development, TypeStyles logs a warning when `cx()` receives a
`ComponentAttrsResult`. Use `mergeProps` or `combine` instead.

`cx` remains the right tool for plain strings, semantic/BEM class names, and
`ThemeSurface` values:

```tsx
cx('layout-grid', isWide && 'layout-grid--wide', className);
```

## Imperative class strings

When you need a class string without spreading (DOM APIs, `data-class-*` hooks,
test selectors), use `.className`:

```ts
element.classList.add(s.root.className);
```

For debugging, `.attrs` exposes the attribute map without `className`.

## SSR

`mergeProps` and `combine` return plain `Record<string, string>` objects — safe to
serialize and spread during server render. No extra setup beyond your usual
[typestyles SSR](/docs/ssr) flow.
