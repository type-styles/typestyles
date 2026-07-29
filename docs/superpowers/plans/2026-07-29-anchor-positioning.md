# CSS Anchor Positioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class CSS Anchor Positioning DX to TypeStyles — scoped `anchor-name` refs, typed `anchor()`/`anchor-size()` value builders, and `@position-try` fallback declarations — matching the design in `specs/anchor-positioning-design.md`.

**Architecture:** A new `anchor.ts` module owns refs and `@position-try` declaration (mirrors `container.ts`'s `createContainerRef` pattern, emitting via the existing `insertRule` sheet primitive). `anchor()`/`anchor-size()` value builders join `css-math.ts` alongside `calc`/`clamp` since they share the "wrap an expression in a named CSS function" shape. `styles.ts` gets instance-scoped `anchorRef`/`positionTry` shorthands mirroring `containerRef`. No changes to `types.ts`, `serialize-style.ts`, or `global.ts` — anchor property values are already fully typed via the installed `csstype` version, and `@position-try` serialization reuses the existing `formatDeclaration` helper.

**Tech Stack:** TypeScript, Vitest (`describe`/`it`/`expect`), the existing `insertRule`/`getRegisteredCss`/`reset`/`flushSync` sheet primitives.

## Global Constraints

- Match `createContainerRef`'s exact scoping/sanitization behavior (`sanitizeClassSegment`, `{scopeId}-{label}` else `{prefix}-{label}` with default prefix `ts`) — the only difference is a `--` prefix on the returned string (anchor-name is a `<dashed-ident>`, not a `<custom-ident>`).
- No new types for `anchorName`, `positionAnchor`, `positionArea`, `positionVisibility` in `types.ts` — the installed `csstype` (3.2.3+) already types these via its public `Property`/`DataType` namespaces, and every relevant union includes `(string & {})`, so `AnchorNameRef` (a `` `--${string}` `` subtype of `string`) is already assignable without casting.
- `PositionAreaKeyword` is a one-line alias of `CSS.DataType.PositionArea` from `csstype` — do not hand-roll the keyword list.
- `PositionTryProperties` accepts the full `@position-try` descriptor set (insets, margins, sizing, self-alignment, `position-anchor`, `position-area`) — not narrowed to `position-anchor`/`position-area` only.
- No runtime validation beyond what `createContainerRef` already does (empty-label throw) — `positionTry()` does not throw on disallowed keys; it serializes whatever `PositionTryProperties` (type-restricted at compile time) is given, consistent with `@keyframes`'s passthrough stance.
- Every new export needs a corresponding `index.ts` export (value or type) — nothing is usable from `import { ... } from 'typestyles'` until Task 5 lands.

---

## Task 1: `createAnchorRef()` and core anchor-ref types

**Files:**

- Create: `packages/typestyles/src/anchor.ts`
- Create: `packages/typestyles/src/anchor.test.ts`

**Interfaces:**

- Produces: `AnchorNameRef` (type, `` `--${string}` `` branded), `CreateAnchorRefOptions` (type, `{ scopeId?: string; prefix?: string }`), `createAnchorRef(label: string, options?: CreateAnchorRefOptions): AnchorNameRef` (function) — all consumed by Task 2 (css-math.ts imports `AnchorNameRef`), Task 3 (same file), Task 4 (styles.ts imports `createAnchorRef`, `AnchorNameRef`), and Task 5 (index.ts re-exports).

- [ ] **Step 1: Write the failing tests**

Create `packages/typestyles/src/anchor.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createAnchorRef } from './anchor';

describe('createAnchorRef', () => {
  it('returns a dashed-ident with the scopeId prefix', () => {
    expect(createAnchorRef('tooltip-trigger', { scopeId: 'app' })).toBe('--app-tooltip-trigger');
  });

  it('returns the same ref for the same label and options', () => {
    expect(createAnchorRef('sidebar', { scopeId: 'app', prefix: 'ts' })).toBe(
      createAnchorRef('sidebar', { scopeId: 'app', prefix: 'ignored-when-scoped' }),
    );
  });

  it('uses prefix only when scopeId is empty', () => {
    expect(createAnchorRef('shell', { prefix: 'acme' })).toBe('--acme-shell');
    expect(createAnchorRef('shell', {})).toBe('--ts-shell');
  });

  it('defaults to the ts prefix with no options', () => {
    expect(createAnchorRef('trigger')).toBe('--ts-trigger');
  });

  it('differs when scopeId or label changes', () => {
    const base = createAnchorRef('sidebar', { scopeId: 'app-a' });
    expect(createAnchorRef('sidebar', { scopeId: 'app-b' })).not.toBe(base);
    expect(createAnchorRef('main', { scopeId: 'app-a' })).not.toBe(base);
  });

  it('sanitizes non-alphanumeric characters in the label', () => {
    expect(createAnchorRef('Tooltip Trigger!', { scopeId: 'app' })).toBe('--app-tooltip-trigger');
  });

  it('throws on empty label', () => {
    expect(() => createAnchorRef('')).toThrow(/must not be empty/);
    expect(() => createAnchorRef('   ')).toThrow(/must not be empty/);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter typestyles test anchor.test.ts`
Expected: FAIL with "Cannot find module './anchor'" (or similar resolution error) — the module doesn't exist yet.

- [ ] **Step 3: Write the minimal implementation**

Create `packages/typestyles/src/anchor.ts`:

````ts
import { sanitizeClassSegment } from './class-naming';

/**
 * Typed `anchor-name` / `@position-try` name from {@link createAnchorRef}. Unlike
 * {@link ContainerNameRef}, this is a `<dashed-ident>` — always `--`-prefixed —
 * because `anchor-name` and `position-try-fallbacks` custom names must start with `--`.
 */
export type AnchorNameRef = `--${string}` & { readonly __anchorNameRef?: true };

export type CreateAnchorRefOptions = {
  /** `--{scopeId}-{label}` when set (sanitized), same shape as `createContainerRef`. */
  scopeId?: string;
  /** Used only if `scopeId` is empty: `--{prefix}-{label}`. Default `ts`. */
  prefix?: string;
};

/**
 * Build a **human-readable** `anchor-name` / `@position-try` name: share one value between
 * `anchorName`, `positionAnchor`, and {@link anchor}'s ref argument without repeating string
 * literals.
 *
 * Shape: **`--{scopeId}-{label}`** when `scopeId` is set, else **`--{prefix}-{label}`** (defaults
 * match `createStyles`). Prefixed with `--` because `anchor-name` is a `<dashed-ident>`, unlike
 * `container-name`'s plain `<custom-ident>`.
 *
 * Prefer **`styles.anchorRef(label)`** so `scopeId` / `prefix` come from your instance.
 *
 * @example
 * ```ts
 * const tooltipAnchor = createAnchorRef('tooltip-trigger', { scopeId: 'my-app' });
 * styles.class('trigger', { anchorName: tooltipAnchor });
 * ```
 */
export function createAnchorRef(label: string, options?: CreateAnchorRefOptions): AnchorNameRef {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error('[typestyles] createAnchorRef(label): label must not be empty.');
  }

  const segment = sanitizeClassSegment(trimmed);
  const scopeId = options?.scopeId?.trim() ?? '';

  if (scopeId) {
    return `--${sanitizeClassSegment(scopeId)}-${segment}` as AnchorNameRef;
  }

  const prefixRaw = options?.prefix?.trim() || 'ts';
  return `--${sanitizeClassSegment(prefixRaw)}-${segment}` as AnchorNameRef;
}
````

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter typestyles test anchor.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/anchor.ts packages/typestyles/src/anchor.test.ts
git commit -m "feat(typestyles): add createAnchorRef for scoped anchor-name references"
```

---

## Task 2: `anchor()` and `anchorSize()` value builders

**Files:**

- Modify: `packages/typestyles/src/css-math.ts`
- Modify: `packages/typestyles/src/css-math.test.ts`

**Interfaces:**

- Consumes: `AnchorNameRef` (type, from Task 1's `./anchor`), `CssMathValue` (type, already defined in this file).
- Produces: `AnchorSideKeyword`, `AnchorSide`, `AnchorSizeDimension` (types), `anchor(side, fallback?)` / `anchor(ref, side, fallback?)` (overloaded function), `anchorSize(ref, dimension, fallback?)` (function) — consumed by Task 5 (index.ts re-exports) and used directly by library consumers.

- [ ] **Step 1: Write the failing tests**

First, update the import lines at the **top** of `packages/typestyles/src/css-math.test.ts` (do not add imports below existing code — ES module imports must stay at the top of the file). Change:

```ts
import { describe, expect, it } from 'vitest';
import { calc, clamp } from './css-math';
```

to:

```ts
import { describe, expect, it } from 'vitest';
import { calc, clamp, anchor, anchorSize } from './css-math';
import type { AnchorNameRef } from './anchor';
```

Then append these two new `describe` blocks at the **bottom** of the file, after the existing `describe('clamp', ...)` block:

```ts
describe('anchor', () => {
  const ref = '--ts-tooltip-trigger' as AnchorNameRef;

  it('emits anchor(name side) with a ref', () => {
    expect(anchor(ref, 'bottom')).toBe('anchor(--ts-tooltip-trigger bottom)');
  });

  it('emits anchor(name side, fallback) with a ref and fallback', () => {
    expect(anchor(ref, 'bottom', '8px')).toBe('anchor(--ts-tooltip-trigger bottom, 8px)');
  });

  it('emits anchor(side) without a ref (uses position-anchor on the element)', () => {
    expect(anchor('bottom')).toBe('anchor(bottom)');
  });

  it('emits anchor(side, fallback) without a ref', () => {
    expect(anchor('bottom', '8px')).toBe('anchor(bottom, 8px)');
  });

  it('accepts percentage sides', () => {
    expect(anchor(ref, '50%')).toBe('anchor(--ts-tooltip-trigger 50%)');
  });
});

describe('anchorSize', () => {
  const ref = '--ts-tooltip-trigger' as AnchorNameRef;

  it('emits anchor-size(name dimension)', () => {
    expect(anchorSize(ref, 'width')).toBe('anchor-size(--ts-tooltip-trigger width)');
  });

  it('emits anchor-size(name dimension, fallback)', () => {
    expect(anchorSize(ref, 'width', '200px')).toBe(
      'anchor-size(--ts-tooltip-trigger width, 200px)',
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter typestyles test css-math.test.ts`
Expected: FAIL with "anchor is not a function" / "anchorSize is not a function" (or a module export error) — `css-math.ts` doesn't export them yet.

- [ ] **Step 3: Write the minimal implementation**

Add to `packages/typestyles/src/css-math.ts` (append after the existing `clamp` function):

````ts
import type { AnchorNameRef } from './anchor';

export type AnchorSideKeyword =
  | 'inside'
  | 'outside'
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'start'
  | 'end'
  | 'self-start'
  | 'self-end'
  | 'center';

export type AnchorSide = AnchorSideKeyword | `${number}%`;

/**
 * CSS `anchor()` — resolve a position relative to an anchor element's edge.
 *
 * With a ref (from `createAnchorRef` / `styles.anchorRef`), names the anchor explicitly.
 * Without a ref, omits `<anchor-name>` and falls back to the element's `position-anchor`
 * (common inside `@position-try` blocks that already set `positionAnchor`).
 *
 * @example
 * ```ts
 * anchor(tooltipAnchor, 'bottom', '8px') // "anchor(--ts-tooltip-trigger bottom, 8px)"
 * anchor('bottom', '8px')                 // "anchor(bottom, 8px)"
 * ```
 */
export function anchor(side: AnchorSide, fallback?: CssMathValue): string;
export function anchor(ref: AnchorNameRef, side: AnchorSide, fallback?: CssMathValue): string;
export function anchor(
  a: AnchorSide | AnchorNameRef,
  b?: AnchorSide | CssMathValue,
  c?: CssMathValue,
): string {
  const hasRef = typeof a === 'string' && a.startsWith('--');

  if (hasRef) {
    const ref = a;
    const side = b as AnchorSide;
    return c != null ? `anchor(${ref} ${side}, ${c})` : `anchor(${ref} ${side})`;
  }

  const side = a as AnchorSide;
  const fallback = b as CssMathValue | undefined;
  return fallback != null ? `anchor(${side}, ${fallback})` : `anchor(${side})`;
}

export type AnchorSizeDimension =
  | 'width'
  | 'height'
  | 'block'
  | 'inline'
  | 'self-block'
  | 'self-inline';

/**
 * CSS `anchor-size()` — resolve a length relative to an anchor element's size.
 *
 * @example
 * ```ts
 * anchorSize(tooltipAnchor, 'width')          // "anchor-size(--ts-tooltip-trigger width)"
 * anchorSize(tooltipAnchor, 'width', '200px') // "anchor-size(--ts-tooltip-trigger width, 200px)"
 * ```
 */
export function anchorSize(
  ref: AnchorNameRef,
  dimension: AnchorSizeDimension,
  fallback?: CssMathValue,
): string {
  return fallback != null
    ? `anchor-size(${ref} ${dimension}, ${fallback})`
    : `anchor-size(${ref} ${dimension})`;
}
````

Place the `import type { AnchorNameRef } from './anchor';` line at the top of `css-math.ts` with the file's other content (the file currently has no imports — this becomes its first `import` line, above the existing `CssMathValue` type / `calc` / `clamp` code).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter typestyles test css-math.test.ts`
Expected: PASS (all `calc`, `clamp`, `anchor`, `anchorSize` tests)

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/css-math.ts packages/typestyles/src/css-math.test.ts
git commit -m "feat(typestyles): add anchor() and anchorSize() value builders"
```

---

## Task 3: `positionTry()` and `positionTryFallbacks()`

**Files:**

- Modify: `packages/typestyles/src/anchor.ts`
- Modify: `packages/typestyles/src/anchor.test.ts`

**Interfaces:**

- Consumes: `createAnchorRef` (from Task 1, same file), `CSSProperties` (type, from `./types`), `insertRule` (from `./sheet`), `formatDeclaration` (from `./serialize-style`), `CSS` namespace (from `csstype`).
- Produces: `PositionTryRef` (type), `PositionTryProperties` (type), `PositionTryTactic` (type), `PositionAreaKeyword` (type, alias of `CSS.DataType.PositionArea`), `PositionTryFallbackEntry` (type), `positionTry(name, properties, options?)` (function), `positionTryFallbacks(...entries)` (function) — consumed by Task 4 (styles.ts) and Task 5 (index.ts re-exports).

- [ ] **Step 1: Write the failing tests**

First, update the import lines at the **top** of `packages/typestyles/src/anchor.test.ts` (do not add imports below existing code — ES module imports must stay at the top of the file). Change:

```ts
import { describe, it, expect } from 'vitest';
import { createAnchorRef } from './anchor';
```

to:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createAnchorRef, positionTry, positionTryFallbacks } from './anchor';
import { getRegisteredCss, reset, flushSync } from './sheet';
```

Then append these two new `describe` blocks at the **bottom** of the file, after the existing `describe('createAnchorRef', ...)` block:

```ts
describe('positionTry', () => {
  beforeEach(() => {
    reset();
  });

  it('emits an @position-try rule with position-area', () => {
    positionTry('bottom-scrollable', { positionArea: 'block-end span-all' }, { scopeId: 'ts' });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('@position-try --ts-bottom-scrollable');
    expect(css).toContain('position-area: block-end span-all');
  });

  it('emits inset, margin, sizing, and self-alignment descriptors', () => {
    positionTry(
      'flip-up',
      {
        top: 'auto',
        bottom: '8px',
        marginTop: 4,
        width: 200,
        justifySelf: 'anchor-center',
      },
      { scopeId: 'ts' },
    );
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('top: auto');
    expect(css).toContain('bottom: 8px');
    expect(css).toContain('margin-top: 4px');
    expect(css).toContain('width: 200px');
    expect(css).toContain('justify-self: anchor-center');
  });

  it('returns the same dashed-ident name createAnchorRef would produce', () => {
    const ref = positionTry('flip-up', { positionArea: 'block-start' }, { scopeId: 'app' });
    expect(ref).toBe('--app-flip-up');
  });

  it('dedupes identical re-registration (same insertRule key)', () => {
    positionTry('flip-up', { positionArea: 'block-start' }, { scopeId: 'ts' });
    positionTry('flip-up', { positionArea: 'block-start' }, { scopeId: 'ts' });
    flushSync();
    const css = getRegisteredCss();
    const occurrences = css.split('@position-try --ts-flip-up').length - 1;
    expect(occurrences).toBe(1);
  });
});

describe('positionTryFallbacks', () => {
  it('joins bare tokens with a comma', () => {
    expect(positionTryFallbacks('flip-block', 'block-start')).toBe('flip-block, block-start');
  });

  it('joins a positionTry ref with tactics (bare dashed-ident, not var()-wrapped)', () => {
    const ref = positionTry(
      'bottom-scrollable',
      { positionArea: 'block-end span-all' },
      { scopeId: 'ts' },
    );
    expect(positionTryFallbacks(ref, 'flip-block')).toBe('--ts-bottom-scrollable, flip-block');
  });

  it('accepts a combined-tactic raw string entry', () => {
    expect(positionTryFallbacks('flip-block flip-inline')).toBe('flip-block flip-inline');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter typestyles test anchor.test.ts`
Expected: FAIL — `positionTry` / `positionTryFallbacks` are not exported from `./anchor` yet.

- [ ] **Step 3: Write the minimal implementation**

Add to `packages/typestyles/src/anchor.ts` (append after `createAnchorRef`):

````ts
import type * as CSS from 'csstype';
import type { CSSProperties } from './types';
import { formatDeclaration } from './serialize-style';
import { insertRule } from './sheet';

/** `<'position-area'>` keyword — alias of csstype's own `DataType.PositionArea` union. */
export type PositionAreaKeyword = CSS.DataType.PositionArea;

/** Typed `@position-try` name from {@link positionTry}, for use in `positionTryFallbacks`. */
export type PositionTryRef = `--${string}` & { readonly __positionTryRef?: true };

/**
 * Descriptors allowed inside `@position-try` — the full set the spec permits (insets, margins,
 * sizing, self-alignment, `position-anchor`, `position-area`), not a narrowed subset.
 */
export type PositionTryProperties = Pick<
  CSSProperties,
  | 'positionAnchor'
  | 'positionArea'
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'insetBlockStart'
  | 'insetBlockEnd'
  | 'insetInlineStart'
  | 'insetInlineEnd'
  | 'inset'
  | 'width'
  | 'height'
  | 'minWidth'
  | 'minHeight'
  | 'maxWidth'
  | 'maxHeight'
  | 'margin'
  | 'marginTop'
  | 'marginRight'
  | 'marginBottom'
  | 'marginLeft'
  | 'justifySelf'
  | 'alignSelf'
>;

/**
 * Declare an `@position-try` fallback block and return a typed ref for `positionTryFallbacks`.
 *
 * @example
 * ```ts
 * const scrollableEnd = positionTry('bottom-scrollable', { positionArea: 'block-end span-all' });
 * // Emits: @position-try --ts-bottom-scrollable { position-area: block-end span-all; }
 * ```
 */
export function positionTry(
  name: string,
  properties: PositionTryProperties,
  options?: CreateAnchorRefOptions,
): PositionTryRef {
  const fullName = createAnchorRef(name, options) as PositionTryRef;

  const declarations: string[] = [];
  for (const [prop, value] of Object.entries(properties)) {
    if (value == null) continue;
    declarations.push(formatDeclaration(prop, value as string | number));
  }

  const css = `@position-try ${fullName} { ${declarations.join('; ')}; }`;
  insertRule(`@position-try:${fullName}`, css);

  return fullName;
}

export type PositionTryTactic =
  | 'flip-block'
  | 'flip-inline'
  | 'flip-start'
  | 'flip-x'
  | 'flip-y'
  | 'none';

export type PositionTryFallbackEntry =
  | PositionTryRef
  | PositionTryTactic
  | PositionAreaKeyword
  | string;

/**
 * Join `position-try-fallbacks` entries — bare tokens (dashed-idents, try-tactics,
 * `position-area` keywords), not `var()`-wrapped.
 *
 * @example
 * ```ts
 * positionTryFallbacks(scrollableEnd, 'flip-block', 'block-start');
 * // "--ts-bottom-scrollable, flip-block, block-start"
 * ```
 */
export function positionTryFallbacks(...entries: PositionTryFallbackEntry[]): string {
  return entries.join(', ');
}
````

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter typestyles test anchor.test.ts`
Expected: PASS (all `createAnchorRef`, `positionTry`, `positionTryFallbacks` tests)

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/anchor.ts packages/typestyles/src/anchor.test.ts
git commit -m "feat(typestyles): add positionTry() and positionTryFallbacks()"
```

---

## Task 4: `styles.anchorRef()` and `styles.positionTry()` instance methods

**Files:**

- Modify: `packages/typestyles/src/styles.ts`
- Modify: `packages/typestyles/src/styles.test.ts` (639-line existing file; its top imports already include `beforeEach`, `createStyles`, `reset`, `flushSync`, `getRegisteredCss` — only `createAnchorRef` and `positionTry` need adding)

**Interfaces:**

- Consumes: `createAnchorRef`, `positionTry`, `AnchorNameRef`, `CreateAnchorRefOptions`, `PositionTryProperties`, `PositionTryRef` (from Task 1 and Task 3's `./anchor`).
- Produces: `anchorRef: (label: string) => AnchorNameRef` and `positionTry: (name: string, properties: PositionTryProperties) => PositionTryRef` on `StylesApi`, `StylesApiWithLayers`, `AttributeStylesApi`, `AttributeStylesApiWithLayers` (inherited automatically via existing `Omit<StylesApi, …>` type relationships — only `StylesApi` itself needs a direct type edit), `StylesWithUtilsApi<U>`, and `StylesWithUtilsApiLayered<U, L>` (inherited via `Omit<StylesWithUtilsApi<U>, …>` — only `StylesWithUtilsApi<U>` needs a direct type edit).

- [ ] **Step 1: Write the failing tests**

First, insert a new import line at the **top** of `packages/typestyles/src/styles.test.ts`, directly after the existing `import { cx } from './index';` line (line 9):

```ts
import { createAnchorRef, positionTry } from './anchor';
```

(`describe`, `it`, `expect`, `beforeEach`, `createStyles`, `reset`, `flushSync`, `getRegisteredCss` are already imported at the top of this file — do not re-import them.)

Then append these two new `describe` blocks at the **bottom** of the file, after its last existing `describe` block:

```ts
describe('styles.anchorRef', () => {
  it('uses the styles instance scopeId (prefix ignored when scope is set)', () => {
    const a = createStyles({ scopeId: 'pkg-a', prefix: 'ts' });
    const b = createStyles({ scopeId: 'pkg-b', prefix: 'ts' });
    expect(a.anchorRef('trigger')).toBe(createAnchorRef('trigger', { scopeId: 'pkg-a' }));
    expect(a.anchorRef('trigger')).toBe('--pkg-a-trigger');
    expect(a.anchorRef('trigger')).not.toBe(b.anchorRef('trigger'));
  });

  it('uses prefix when scopeId is empty', () => {
    const s = createStyles({ prefix: 'acme' });
    expect(s.anchorRef('widget')).toBe('--acme-widget');
  });
});

describe('styles.positionTry', () => {
  beforeEach(() => {
    reset();
  });

  it('scopes the @position-try name to the instance', () => {
    const s = createStyles({ scopeId: 'pkg-a' });
    const ref = s.positionTry('flip-up', { positionArea: 'block-start' });
    expect(ref).toBe('--pkg-a-flip-up');
    flushSync();
    expect(getRegisteredCss()).toContain('@position-try --pkg-a-flip-up');
  });

  it('matches the module-level positionTry with equivalent options', () => {
    const s = createStyles({ scopeId: 'pkg-b' });
    const viaInstance = s.positionTry('flip-down', { positionArea: 'block-end' });
    const viaModule = positionTry('flip-down', { positionArea: 'block-end' }, { scopeId: 'pkg-b' });
    expect(viaInstance).toBe(viaModule);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter typestyles test styles.test.ts`
Expected: FAIL with a TypeScript error or runtime error — `anchorRef` / `positionTry` are not properties on the object `createStyles()` returns yet.

- [ ] **Step 3: Write the minimal implementation**

In `packages/typestyles/src/styles.ts`:

3a. Add the import (near the existing `container`/`createContainerRef` import, around line 41-45):

```ts
import {
  createAnchorRef,
  positionTry,
  type AnchorNameRef,
  type PositionTryProperties,
  type PositionTryRef,
} from './anchor';
```

3b. Add to the `StylesApi` type (in `packages/typestyles/src/styles.ts`, immediately after the `containerRef` property, i.e. after the block ending `readonly containerRef: (label: string) => ContainerNameRef;`):

```ts
  /**
   * Readable `anchor-name` for `anchorName`: `--{scopeId}-{label}` or `--{prefix}-{label}` when `scopeId` is empty.
   * Same as `createAnchorRef(label, { scopeId, prefix })` from this instance's naming config.
   */
  readonly anchorRef: (label: string) => AnchorNameRef;
  /**
   * Declare an `@position-try` fallback block scoped to this instance's naming config.
   * Same as `positionTry(name, properties, { scopeId, prefix })`.
   */
  readonly positionTry: (name: string, properties: PositionTryProperties) => PositionTryRef;
```

3c. Add the same two properties to the `StylesWithUtilsApi<U>` type, immediately after its `readonly containerRef: (label: string) => ContainerNameRef;` line.

3d. In `buildStylesRuntimeApi` (the function containing the `containerRef` const), add right after the existing `containerRef` const definition:

```ts
const anchorRef = (label: string): AnchorNameRef =>
  createAnchorRef(label, {
    scopeId: classNaming.scopeId,
    prefix: classNaming.prefix,
  });
const positionTryImpl = (name: string, properties: PositionTryProperties): PositionTryRef =>
  positionTry(name, properties, {
    scopeId: classNaming.scopeId,
    prefix: classNaming.prefix,
  });
```

Then add `anchorRef,` and `positionTry: positionTryImpl,` immediately after `containerRef,` in **both** the layered return object (inside the `if (layered) { return { ... } }` block) and the unlayered return object (the final `return { ... }` of the function).

3e. In `createStylesWithUtils`, add the same `anchorRef` / `positionTryImpl` consts right after its `containerRef` const, and add `anchorRef,` / `positionTry: positionTryImpl,` after `containerRef,` in its returned object.

3f. In `createStylesWithUtilsLayered`, do the same: add the consts after its `containerRef` const, and add `anchorRef,` / `positionTry: positionTryImpl,` after `containerRef,` in its returned object.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter typestyles test styles.test.ts`
Expected: PASS (all `styles.anchorRef`, `styles.positionTry` tests, plus every pre-existing test in the file still passing)

Also run the full package test suite to confirm nothing else broke:

Run: `pnpm --filter typestyles test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/styles.ts packages/typestyles/src/styles.test.ts
git commit -m "feat(typestyles): add styles.anchorRef() and styles.positionTry() instance methods"
```

---

## Task 5: Public exports

**Files:**

- Modify: `packages/typestyles/src/index.ts`
- Create: `packages/typestyles/src/anchor-exports.test.ts`

**Interfaces:**

- Consumes: everything produced by Tasks 1–3 (`createAnchorRef`, `anchor`, `anchorSize`, `positionTry`, `positionTryFallbacks`, and their types) from `./anchor` and `./css-math`.
- Produces: the same names, now importable via `import { ... } from 'typestyles'`.

- [ ] **Step 1: Write the failing test**

Create `packages/typestyles/src/anchor-exports.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  styles,
  createAnchorRef,
  anchor,
  anchorSize,
  positionTry,
  positionTryFallbacks,
} from './index';

describe('anchor positioning public exports', () => {
  it('exposes createAnchorRef, anchor, anchorSize, positionTry, positionTryFallbacks from the package entry', () => {
    expect(typeof createAnchorRef).toBe('function');
    expect(typeof anchor).toBe('function');
    expect(typeof anchorSize).toBe('function');
    expect(typeof positionTry).toBe('function');
    expect(typeof positionTryFallbacks).toBe('function');
  });

  it('createAnchorRef and anchor compose end-to-end through the public entry', () => {
    const ref = createAnchorRef('tooltip-trigger', { scopeId: 'app' });
    expect(anchor(ref, 'bottom', '8px')).toBe('anchor(--app-tooltip-trigger bottom, 8px)');
  });

  it('anchorName/positionAnchor/positionArea/positionVisibility type-check on styles.class without casting', () => {
    // This test's value is compile-time: if AnchorNameRef or the keyword strings below ever
    // stopped being assignable to CSSProperties (e.g. a csstype major-version change dropped
    // these unions' `(string & {})` member), `pnpm --filter typestyles build` would fail here
    // before this assertion ever runs.
    const ref = createAnchorRef('trigger', { scopeId: 'app' });
    const triggerClass = styles.class('anchor-export-trigger', { anchorName: ref });
    const tooltipClass = styles.class('anchor-export-tooltip', {
      positionAnchor: ref,
      positionArea: 'block-end',
      positionVisibility: 'anchors-visible',
    });
    expect(triggerClass).toBe('anchor-export-trigger');
    expect(tooltipClass).toBe('anchor-export-tooltip');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter typestyles test anchor-exports.test.ts`
Expected: FAIL — `createAnchorRef`, `anchor`, `anchorSize`, `positionTry`, `positionTryFallbacks` are not exported from `./index` yet (TypeScript module error or `undefined` values).

- [ ] **Step 3: Write the minimal implementation**

In `packages/typestyles/src/index.ts`:

3a. Change the existing import line (currently `import { calc, clamp } from './css-math';`) to:

```ts
import { calc, clamp, anchor, anchorSize } from './css-math';
```

3b. Add a new import line (near the `container`/`createContainerRef` import):

```ts
import { createAnchorRef, positionTry, positionTryFallbacks } from './anchor';
```

3c. Change the existing export line (currently `export { calc, clamp, content };`) to:

```ts
export { calc, clamp, content, anchor, anchorSize };
```

3d. Add a new export statement (near `export { container, createContainerRef, atRuleBlock, has, is, where };`):

```ts
export { createAnchorRef, positionTry, positionTryFallbacks };
```

3e. Add a new type export block (near the existing `ContainerQueryKey` / `ContainerNameRef` type export block):

```ts
export type {
  AnchorNameRef,
  CreateAnchorRefOptions,
  PositionTryRef,
  PositionTryProperties,
  PositionTryTactic,
  PositionTryFallbackEntry,
  PositionAreaKeyword,
} from './anchor';
```

3f. `AnchorSide`, `AnchorSideKeyword`, and `AnchorSizeDimension` are defined in `css-math.ts` (Task 2), not `anchor.ts` — the existing line is `export type { CssMathValue } from './css-math';`; change it to:

```ts
export type { CssMathValue, AnchorSide, AnchorSideKeyword, AnchorSizeDimension } from './css-math';
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter typestyles test anchor-exports.test.ts`
Expected: PASS (both tests)

Run the full package build to confirm no type errors surfaced from the new exports:

Run: `pnpm --filter typestyles build`
Expected: build succeeds with no TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/index.ts packages/typestyles/src/anchor-exports.test.ts
git commit -m "feat(typestyles): export anchor positioning API from the package entry"
```

---

## Task 6: Documentation page

**Files:**

- Create: `docs/content/docs/anchor-positioning.md`
- Modify: `docs/src/navigation.ts`
- Modify: `docs/content/docs/api-reference.md`

**Interfaces:**

- Consumes: nothing (documentation only) — describes the API built in Tasks 1–5.
- Produces: a published docs page at `/docs/anchor-positioning`, linked from the nav sidebar and the API reference page.

- [ ] **Step 1: Write the failing check**

This task has no unit test — the "test" is the docs site building without error and the new page being reachable from navigation. Run the docs build once before making changes to confirm a clean baseline:

Run: `pnpm --filter docs build`
Expected: PASS (baseline, before the new page exists)

- [ ] **Step 2: N/A — proceed directly to content (no separate failing-state step for a docs-only task)**

- [ ] **Step 3: Write the documentation page**

Create `docs/content/docs/anchor-positioning.md`:

````markdown
---
title: Anchor Positioning
description: Typed CSS anchor-name refs, anchor()/anchor-size() value builders, and @position-try fallbacks — no JS positioning engine required.
---

CSS Anchor Positioning lets tooltips, popovers, dropdowns, and menus be positioned relative to
an anchor element in pure CSS — displacing libraries like Floating UI or Popper for many cases.
TypeStyles gives you typed refs, typed value builders, and a fallback-declaration helper.

## Anchor refs

`anchor-name` (and `@position-try` names) are `<dashed-ident>` — they must start with `--`,
unlike `container-name`'s plain `<custom-ident>`. `createAnchorRef()` returns a `--`-prefixed
string; prefer `styles.anchorRef(label)` so scoping comes from your instance:

```ts
import { styles, createAnchorRef } from 'typestyles';

const tooltipAnchor = createAnchorRef('tooltip-trigger'); // "--ts-tooltip-trigger"
// or: const tooltipAnchor = styles.anchorRef('tooltip-trigger');

styles.class('trigger', { anchorName: tooltipAnchor });
```
````

## `position-area` (start here)

`position-area` places the positioned element in a 3×3 grid relative to its anchor — the most
concise way to position most tooltips and menus:

```ts
styles.class('tooltip', {
  position: 'fixed',
  positionAnchor: tooltipAnchor,
  positionArea: 'block-end',
  margin: 0, // reset popover UA defaults that fight position-area
});
```

`positionArea` is already fully typed — TypeScript autocompletes every valid keyword (`top`,
`block-end`, `span-all`, …) via the installed `csstype` package, no TypeStyles-specific import
needed.

## Inset + `anchor()` (fine-grained control)

For pixel-level control, use `anchor()` inside inset properties:

```ts
import { anchor, anchorSize } from 'typestyles';

styles.class('tooltip', {
  position: 'fixed',
  positionAnchor: tooltipAnchor,
  top: anchor(tooltipAnchor, 'bottom', '8px'),
  left: anchor(tooltipAnchor, 'center'),
  minWidth: anchorSize(tooltipAnchor, 'width'),
});
```

`anchor()` also has a ref-less overload — `anchor('bottom', '8px')` — that omits the anchor name
and relies on `position-anchor` already being set on the element (common inside `@position-try`
blocks).

**Consistency rule:** use the same positioning method in your base styles and in
`@position-try` fallbacks. If your base position uses `position-area`, your fallbacks should
too — mixing `position-area` with inset/`anchor()` fallbacks produces fallbacks that don't apply
as expected.

## `@position-try` fallbacks

Declare a named fallback with `positionTry()`, or use built-in try-tactics:

```ts
import { positionTry, positionTryFallbacks } from 'typestyles';

const scrollableEnd = positionTry('bottom-scrollable', {
  positionArea: 'block-end span-all',
});

styles.class('menu', {
  position: 'fixed',
  positionAnchor: menuAnchor,
  positionArea: 'block-end',
  positionTryFallbacks: positionTryFallbacks('flip-block', scrollableEnd),
});
```

`positionTryFallbacks()` joins bare tokens — dashed-idents, try-tactics (`flip-block`,
`flip-inline`, `flip-start`, `flip-x`, `flip-y`), or `position-area` keywords — not
`var()`-wrapped references. Pass a combined tactic as one raw string entry:
`positionTryFallbacks('flip-block flip-inline')`.

`positionTry()` accepts the full `@position-try` descriptor set: `positionAnchor`,
`positionArea`, inset properties, margin properties, sizing properties, and
`justifySelf`/`alignSelf` (typically with `anchor-center`).

## Popover pairing

Anchor positioning pairs naturally with the Popover API (`:popover-open`, `::backdrop`) — see
[Pseudo-elements](/docs/pseudo-elements) once that page lands.

## Scroll timelines

`createAnchorRef`'s options shape (`{ scopeId?, prefix? }`) is shared with
`createScrollTimelineRef()` / `createViewTimelineRef()` — see
[Scroll animations](/docs/scroll-animations).

````

- [ ] **Step 4: Register the page in navigation and cross-link from API reference**

In `docs/src/navigation.ts`, add an entry to the "Advanced Features" section's items array (the array containing `{ slug: 'custom-at-rules', title: 'Custom Selectors & At-Rules' }`), immediately after that `custom-at-rules` entry:

```ts
        { slug: 'anchor-positioning', title: 'Anchor Positioning' },
````

In `docs/content/docs/api-reference.md`, add a cross-link near wherever `container()`/`createContainerRef` is documented (search the file for `createContainerRef` to find the right section) — add a line:

```markdown
See [Anchor Positioning](/docs/anchor-positioning) for `createAnchorRef`, `anchor()`, `anchorSize()`, and `positionTry()`.
```

- [ ] **Step 5: Verify the docs build succeeds with the new page**

Run: `pnpm --filter docs build`
Expected: PASS — build succeeds, the new page is included in the output, no broken-link warnings for the new nav entry or cross-link.

- [ ] **Step 6: Commit**

```bash
git add docs/content/docs/anchor-positioning.md docs/src/navigation.ts docs/content/docs/api-reference.md
git commit -m "docs: add anchor positioning guide"
```

---

## Final verification

After all six tasks:

- [ ] Run `pnpm --filter typestyles test` — full package test suite passes.
- [ ] Run `pnpm --filter typestyles build` — package builds with no TypeScript errors.
- [ ] Run `pnpm --filter docs build` — docs site builds with the new page.
- [ ] Run `pnpm changeset` and add a changeset for `typestyles` (minor bump — new public API surface, no breaking changes) describing the anchor positioning addition, following the existing changeset format in `.changeset/`.
