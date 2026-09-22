# Spec: Attribute-mode binding helpers

> **Status:** Draft (Var UI → TypeStyles)  
> **Target repo path:** `specs/attribute-mode-binding-helpers.md`  
> **Motivation:** Var UI runs TypeStyles in global `mode: 'attribute'`. Framework bindings currently ship duplicate helpers (`recipeProps`, `recipeClassName`) in four places. Native `.props` covers most cases; these helpers close the remaining gaps and make attribute mode the obvious integration path.

---

## Background

In attribute mode, `styles.component()` resolves to `ComponentAttrsResult`:

```ts
interface ComponentAttrsResult {
  readonly className: string;
  readonly attrs: Readonly<Record<string, string>>;
  /** attrs merged with className — ready to spread onto a DOM element */
  readonly props: Readonly<Record<string, string>>;
  toString(): string;
}
```

Var UI and other consumers need three distinct operations:

| Operation                             | Today                        | Problem                                                        |
| ------------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| Spread onto element                   | `{...result.props}`          | No built-in way to merge a consumer `className`                |
| Compose extra classes on same element | `cx(result, extra)`          | `cx` coerces via `toString()` — **attrs are silently dropped** |
| Merge multiple slots onto one element | `cx(a.root, a.linkRoot)`     | Same attrs drop; no conflict detection                         |
| Class string for imperative DOM       | `result.className` / wrapper | Fine, but wrappers proliferate                                 |

Var UI's `recipeProps` is `{ ...result.attrs, className: cx(result.className, ...extras) }`. This spec formalizes that in TypeStyles.

---

## 1. `mergeProps`

### Summary

Merge a `ComponentAttrsResult` (or plain class string) with optional extra class names, returning a flat props bag suitable for DOM spread.

### Signature

```ts
type RecipeInput = string | ComponentAttrsResult;

function mergeProps(
  result: RecipeInput,
  ...classNames: Array<string | false | null | undefined>
): Record<string, string>;
```

### Behavior

1. **String input** — `{ className: cx(result, ...classNames) }`.
2. **`ComponentAttrsResult` input** — `{ ...result.attrs, className: cx(result.className, ...classNames) }`.
3. **Falsy entries** in `classNames` are ignored (same rules as `cx`).
4. **Return type** — `Record<string, string>` so it spreads cleanly in JSX/Astro (`{...mergeProps(s.root, className)}`).
5. **Attrs win on key collision** — if a caller passes a key that exists in `attrs`, `className` is the only merged field; attribute keys from `result.attrs` are never overwritten by `classNames`.
6. **Pure** — no side effects, no CSS registration.

### Examples

```tsx
import { mergeProps, cx } from 'typestyles';

const s = button({ tone: 'accent', appearance: 'filled' });

// React / Astro
<button {...mergeProps(s, className)}>Save</button>;

// Equivalent to today's Var UI recipeProps
<button {...mergeProps(s.root, isActive && s.linkActive.className)} />;
```

```astro
---
const s = stack({ direction: 'column', gap: 'md' });
---
<div {...mergeProps(s, className)}><slot /></div>
```

### Non-goals

- Does not merge attrs from multiple `ComponentAttrsResult` values (see `combine`).
- Does not accept arbitrary HTML props — callers spread `mergeProps(...)` first, then `...rest`.

### Migration

Var UI will replace `recipeProps` with `mergeProps` and eventually remove the wrapper. Existing `result.props` remains valid when no extra `className` is needed.

---

## 2. `combine`

### Summary

Merge **multiple** recipe results onto a **single** element: union of class names, union of attrs when compatible.

### Signature

```ts
function combine(...parts: Array<RecipeInput | false | null | undefined>): Record<string, string>;

function combine(
  ...parts: Array<RecipeInput | false | null | undefined>,
  options: { className?: string | false | null | undefined },
): Record<string, string>;
```

Overload preference: last argument may be `{ className?: string }` for consumer override, or `className` can be passed as a plain string part (same as `cx`).

### Behavior

1. Filter falsy parts.
2. Collect all `className` strings (from strings and `ComponentAttrsResult.className`); join with `cx`.
3. Collect all `attrs` objects. **If the same key appears with different values → dev warning and last-wins** (or throw in strict mode — see Open questions).
4. Return `{ ...mergedAttrs, className: cx(...allClassNames, options?.className) }`.
5. **Dev warning** when any input is a `ComponentAttrsResult` with non-empty `attrs` and another part also has attrs — suggests the caller may want separate elements instead.

### Examples

```tsx
// Var UI ClickableCard — root + linkRoot on one <a>
const c = card();
<a {...combine(c.root, c.linkRoot, className)} href={href}>…</a>

// State modifiers as class-only slots (no attrs on modifier slots)
<button {...combine(s.button, !copied && s.buttonIdle, copied && s.buttonCopied, className)} />
```

### When _not_ to use

Prefer a single recipe call with compound variants when attrs must stay consistent. `combine` is for multi-slot recipes where only classNames overlap on one node.

---

## 3. `cx` dev warning (attrs dropped)

### Summary

In development, warn when `cx()` receives a `ComponentAttrsResult` (detected via `attrs` property) because variant attributes will not reach the DOM.

### Behavior

```ts
// Dev only — no production cost
cx(s.root, s.linkRoot, className);
// warn: cx() used ComponentAttrsResult "…" — attrs were not applied.
//       Spread mergeProps(s.root, …) or combine(…) on the element instead.
```

1. Trigger once per callsite (dedupe by stack or a WeakSet of object identity — implementation detail).
2. Plain strings and `ThemeSurface` (no `attrs` key) — no warning.
3. Document in attribute-mode integration guide.

### Optional: `cx.classOnly`

If the warning is too noisy for legitimate class-only composition, export an explicit opt-in:

```ts
cx.classOnly(s.buttonIdle, s.buttonCopied); // no warning; never reads attrs
```

Not required for v1 if `combine` covers the main cases.

---

## 4. Documentation deliverable

Add **`docs/attribute-mode-react.md`** (and Astro section) covering:

1. `{...result.props}` when no consumer class override.
2. `{...mergeProps(result, className)}` as the default binding.
3. `combine` for multi-slot same-element.
4. **Anti-pattern:** `className={cx(variantResult)}` without spreading props — breaks variant attrs.
5. Imperative class strings: `result.className` for scripts / `data-class-*` hooks.

Var UI will link to this as the canonical integration reference.

---

## 5. Exports

From main `typestyles` entry:

```ts
export { mergeProps, combine } from './binding';
// cx already exported — extend in place for dev warning
```

No new subpath required. Bundle size should stay negligible (thin wrappers over existing `cx`).

---

## 6. Tests

| Case                                         | Assert                            |
| -------------------------------------------- | --------------------------------- |
| `mergeProps('a', 'b')`                       | `{ className: 'a b' }`            |
| `mergeProps({ className, attrs }, 'extra')`  | attrs spread + merged className   |
| `mergeProps(s, false, null, undefined, 'x')` | falsy ignored                     |
| `combine(a, b)` class-only slots             | single className, empty attrs     |
| `combine(a, b)` conflicting `data-tone`      | dev warning (mock `console.warn`) |
| `cx(componentResult)` in dev                 | warning emitted                   |
| `cx('a', 'b')`                               | no warning                        |

---

## 7. Relationship to existing API

| API                         | Keep?                                  | Notes                                    |
| --------------------------- | -------------------------------------- | ---------------------------------------- |
| `.props`                    | Yes                                    | Zero-arg spread; no consumer `className` |
| `.className` / `.attrs`     | Yes                                    | Advanced / documentation / debugging     |
| `toString()` / `cx(result)` | Yes                                    | Class-only; warn in dev when attrs exist |
| Var UI `recipeProps`        | Migrate → `mergeProps`                 | Remove after TypeStyles ships            |
| Var UI `recipeClassName`    | Migrate → `cx(result)` or `.className` | Deprecate public export                  |

---

## 8. Open questions

1. **`combine` attr conflicts** — last-wins + warn, or hard error in dev?
2. **Strict mode flag** — `createTypeStyles({ strictBinding: true })` for throws vs warns?
3. **`.props(...classNames)` method** on `ComponentAttrsResult` — sugar for `mergeProps(this, ...)`? Nice ergonomics but adds prototype surface; defer unless strongly preferred.
4. **SSR** — ensure return values are plain serializable objects (they should be today).

---

## 9. Suggested implementation order

1. `mergeProps` + tests + attribute-mode doc section
2. `cx` dev warning
3. `combine` + tests
4. Var UI migration (separate PR)

---

## Appendix: Var UI duplication map

Helpers to delete after ship:

- `packages/react/src/components/utils.ts` — `recipeProps`, `recipeClassName`
- `packages/astro/src/utils.ts` — same
- `docs/src/lib/recipeProps.ts` — Vitest copy
- `packages/docs-components/src/utils/recipeProps.ts` — same

Public re-export (optional, one release): `export { mergeProps, combine } from 'typestyles'` from `@var-ui/react` and `@var-ui/astro` with deprecation notice on `recipeProps`.
