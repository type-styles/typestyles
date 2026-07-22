# Token Forward References Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `tokens.declare()` (a lazy `var(--…)` forward-reference proxy for same-namespace and cross-namespace token references) and restore typed, animatable `@property` registration for tokens whose value is `var()`-dependent, via a syntax-keyed placeholder `initial-value`.

**Architecture:** Two independent pieces landing in `packages/typestyles/src/`. Part A (`registered-property.ts`, `types.ts`, `tokens.ts`) replaces the unconditional `@property` skip for dependent values with a placeholder-table lookup, gated by a manual browser-verification checkpoint that runs **before** any code changes land. Part B (`tokens.ts`, `types.ts`) adds `tokens.declare()`, reusing the existing `buildResolvePathName` naming resolver so declared and created names can never silently drift apart.

**Tech Stack:** TypeScript, Vitest (jsdom environment), pnpm workspaces, Changesets.

## Global Constraints

- Every ref produced by any new code path must be a real `var(--…)` string; every `@property` rule emitted must be spec-valid CSS. Never emit `syntax: "*"` as a degraded fallback (that's the exact bug commit `b8d219d` fixed) or an `initial-value` that isn't computationally independent.
- The placeholder table only matches an **exact** trimmed syntax string (after stripping one optional trailing `+`/`#`). Never guess a placeholder for anything not in the table — fall back to today's skip-with-warning behavior.
- `tokens.use()`'s existing documented contract and dev-mode typo-warning behavior for already-created namespaces must not change. `declare()` is additive and separate.
- Name resolution for `declare()` must reuse the existing `buildResolvePathName` / `resolveTokenName` / `buildTokenNameContext` functions — no parallel reimplementation of `--{ns}-{path}` naming.
- Dev-mode-only checks (`process.env.NODE_ENV !== 'production'`) follow the existing style already used in `tokens.ts` (e.g. the nameTemplate duplicate-name check in `create()`) — a `throw`, not a `console.warn`, for programmer errors that indicate drift between two calls.
- All new/changed behavior needs a Changeset entry in `.changeset/` following the existing format (see `.changeset/skip-property-for-dependent-values.md`).
- Run `pnpm --filter typestyles test` (or `cd packages/typestyles && pnpm vitest run`) after every task; all 29+ existing tests plus new ones must pass before moving on.

---

## File Structure

| File                                                                        | Change                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `packages/typestyles/src/registered-property.ts`                            | Add placeholder table + lookup; change `registerAtPropertyRule` to use it instead of unconditional skip; thread `initial` through `registerAtPropertyRule` and `registerRegisteredProperty`.                          |
| `packages/typestyles/src/registered-property.test.ts`                       | Update 3 existing tests whose expectations change; add tests for the fallback path, list-multiplier stripping, and explicit `initial`.                                                                                |
| `packages/typestyles/src/types.ts`                                          | Add `initial?: string                                                                                                                                                                                                 | number`to`TokenDescriptor`and`RegisteredPropertyOptions`; add `LooseTokenRef` type. |
| `packages/typestyles/src/tokens.ts`                                         | Thread `TokenDescriptor.initial` through `collectDescriptorMeta` → `registerAtPropertyRule`; add `createLooseTokenProxy`, `declare()`, `declaredNamespaceTemplates`, and the `create()` nameTemplate-agreement check. |
| `packages/typestyles/src/tokens.test.ts`                                    | New tests: descriptor `initial` override, `tokens.declare` basics, nameTemplate mismatch throw, same-namespace self-reference end-to-end, cross-namespace end-to-end.                                                 |
| `packages/typestyles/src/index.ts`                                          | Export `LooseTokenRef`.                                                                                                                                                                                               |
| `docs/content/docs/tokens.md`                                               | New "Forward-referencing tokens" section documenting `declare()`.                                                                                                                                                     |
| `docs/content/docs/theming-patterns.md`                                     | Update "Animating typed tokens with `@property`" section to describe placeholder-based registration for dependent values.                                                                                             |
| `.changeset/token-property-placeholders.md`, `.changeset/tokens-declare.md` | Changesets for each piece (`typestyles`: minor).                                                                                                                                                                      |

---

### Task 1: Manual browser verification — Chromium invalidation with a real syntax + placeholder

**Why this task exists, and why it's first:** commit `b8d219d` (the fix Task 2 partially reverses) exists because Chromium fails to invalidate elements using a registered custom property when that property's `var()`-resolved value changes on theme toggle — but the PR that introduced that fix specifically implicates **`syntax: "*"`** (the previous degraded fallback) as the culprit, not `@property` registration with a real syntax in general:

> "Stop emitting `@property` rules with universal `syntax: "*"` when a token value references `var()` or `env()` — Chromium fails to invalidate dependents (e.g. `color: var(--component-color)`) when the registered bridge updates on theme toggle"

Task 2's placeholder approach is a different mechanism (real `syntax`, dependent value set via a normal `:root` declaration) and has not been verified against the same Chromium behavior. This task tests the underlying **raw CSS mechanism** directly, in isolation from any TypeStyles code — no repo changes are needed to run it, so it can (and must) happen before any implementation work. It's a hard gate: do not proceed to Task 2 until it passes.

**Files:** none — this task creates one standalone HTML file outside the repo (e.g. in `/tmp`), never committed.

- [ ] **Step 1: Create the repro file**

Create `/tmp/property-invalidation-check.html` with this exact content:

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      @property --accent {
        syntax: '<color>';
        inherits: false;
        initial-value: black;
      }
      @property --accent-subtle {
        syntax: '<color>';
        inherits: false;
        initial-value: transparent;
      }
      :root {
        --accent: #0066ff;
        --accent-subtle: color-mix(in oklch, var(--accent) 30%, white);
      }
      .dark {
        --accent: #ff6600;
      }
      #swatch {
        width: 200px;
        height: 100px;
        background-color: var(--accent-subtle);
        border: 1px solid black;
        font-family: sans-serif;
      }
    </style>
  </head>
  <body>
    <div id="swatch">swatch</div>
    <button onclick="document.documentElement.classList.toggle('dark')">Toggle theme</button>
  </body>
</html>
```

This mirrors exactly the mechanism Task 2 will implement: `--accent-subtle` is registered with a **real** syntax (`<color>`, not `"*"`) and a placeholder `initial-value` (`transparent`), while its actual value is a `:root` declaration that depends on `--accent` via `var()` — the same "registered bridge" shape the original bug report describes, just with a typed syntax instead of `"*"`.

- [ ] **Step 2: Open it in a real Chromium-based browser**

Run: `open -a "Google Chrome" /tmp/property-invalidation-check.html` (macOS; use your platform's equivalent to open the file directly — no dev server needed).

- [ ] **Step 3: Observe baseline, then toggle**

Confirm the swatch shows a light-blue mix (`color-mix` of `#0066ff` and white) before clicking. Click "Toggle theme". Confirm the swatch **immediately** recomputes to an orange mix (`color-mix` of `#ff6600` and white) with no reload. Click again and confirm it reverts to blue.

- [ ] **Step 4: Record the result and decide**

- **If the swatch updates correctly on both toggles:** the placeholder approach does not reintroduce the Chromium bug. Proceed to Task 2.
- **If the swatch fails to update (stuck on the pre-toggle color) on either toggle:** stop. Do not implement Task 2 as designed — the placeholder-based `@property` registration would need a different scope (e.g. restricting it to values that are independent except for a single top-level `var()` alias, or abandoning it and leaving dependent-value tokens exactly as commit `b8d219d` left them). Bring this back as a design question before continuing.

No commit for this task — it's a verification checkpoint, not a code change. Delete `/tmp/property-invalidation-check.html` when done if you'd like, or leave it; it isn't part of the repo either way.

---

### Task 2: Placeholder-table `@property` registration for dependent values

**Files:**

- Modify: `packages/typestyles/src/registered-property.ts`
- Test: `packages/typestyles/src/registered-property.test.ts`

**Interfaces:**

- Produces: `registerAtPropertyRule(name, { value, syntax, inherits?, initial? })` — same name, extended options, changed behavior for dependent `value`.
- Produces: `registerRegisteredProperty(name, { value?, syntax?, inherits?, initial? })` — extended options, passes `initial` through.

- [ ] **Step 1: Write the failing tests (replacing the 3 that assumed unconditional skip, adding 4 new)**

Replace the full contents of `packages/typestyles/src/registered-property.test.ts` with:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { registerAtPropertyRule, registerRegisteredProperty } from './registered-property';
import { getRegisteredCss, reset } from './sheet';

describe('registerAtPropertyRule', () => {
  beforeEach(() => {
    reset();
  });

  it('emits a typed @property with initial-value for computationally independent values', () => {
    registerAtPropertyRule('--ts-test-literal', { value: '#fff', syntax: '<color>' });
    expect(getRegisteredCss()).toContain(
      '@property --ts-test-literal { syntax: "<color>"; inherits: false; initial-value: #fff; }',
    );
  });

  it('registers @property with a placeholder initial-value for var()-dependent <color> values', () => {
    registerAtPropertyRule('--ts-test-var', {
      value: 'var(--ts-token-ref)',
      syntax: '<color>',
      inherits: false,
    });
    const css = getRegisteredCss();
    expect(css).toContain(
      '@property --ts-test-var { syntax: "<color>"; inherits: false; initial-value: transparent; }',
    );
  });

  it('registers @property with a placeholder initial-value for env()-dependent <length> values', () => {
    registerAtPropertyRule('--ts-test-env', {
      value: 'env(safe-area-inset-top)',
      syntax: '<length>',
      inherits: true,
    });
    const css = getRegisteredCss();
    expect(css).toContain(
      '@property --ts-test-env { syntax: "<length>"; inherits: true; initial-value: 0px; }',
    );
  });

  it('strips a trailing + or # list multiplier before matching the placeholder table', () => {
    registerAtPropertyRule('--ts-test-list', {
      value: 'var(--ts-a) var(--ts-b)',
      syntax: '<color>+',
      inherits: false,
    });
    const css = getRegisteredCss();
    expect(css).toContain(
      '@property --ts-test-list { syntax: "<color>+"; inherits: false; initial-value: transparent; }',
    );
  });

  it('falls back to skipping @property when the syntax has no placeholder and none is given', () => {
    registerAtPropertyRule('--ts-test-noplaceholder', {
      value: 'var(--ts-token-ref)',
      syntax: '<custom-ident>',
      inherits: false,
    });
    const css = getRegisteredCss();
    expect(css).not.toContain('@property --ts-test-noplaceholder');
  });

  it('uses an explicit initial override instead of the placeholder table', () => {
    registerAtPropertyRule('--ts-test-explicit', {
      value: 'var(--ts-token-ref)',
      syntax: '<color>',
      inherits: false,
      initial: 'hotpink',
    });
    const css = getRegisteredCss();
    expect(css).toContain(
      '@property --ts-test-explicit { syntax: "<color>"; inherits: false; initial-value: hotpink; }',
    );
  });

  it('accepts a numeric explicit initial override', () => {
    registerAtPropertyRule('--ts-test-explicit-number', {
      value: 'calc(var(--ts-a) + 1)',
      syntax: '<number>',
      inherits: false,
      initial: 0,
    });
    const css = getRegisteredCss();
    expect(css).toContain('initial-value: 0;');
  });

  it('keeps the :root default assignment for var() values alongside the registered placeholder', () => {
    registerRegisteredProperty('--ts-test-root', {
      value: 'var(--ts-token-ref)',
      syntax: '<color>',
    });
    const css = getRegisteredCss();
    expect(css).toContain(':root { --ts-test-root: var(--ts-token-ref); }');
    expect(css).toContain('@property --ts-test-root');
    expect(css).toContain('initial-value: transparent');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/typestyles && pnpm vitest run registered-property.test.ts`
Expected: FAIL — the new/changed assertions don't match current (unconditional-skip) behavior.

- [ ] **Step 3: Implement the placeholder table and wire it into `registerAtPropertyRule`**

In `packages/typestyles/src/registered-property.ts`, replace:

```ts
/**
 * `@property` initial values must be *computationally independent*
 * (CSS Properties & Values Level 1, §2.4) — `var()` / `env()` references are not.
 */
function isComputationallyIndependent(value: string): boolean {
  return !/\b(?:var|env)\(/i.test(value);
}

export function registerAtPropertyRule(
  name: string,
  options: { value: string; syntax: string; inherits?: boolean },
): void {
  // Skip `@property` for dependent values (token/`env()` refs). Emitting
  // `syntax: "*"` (the only form allowed without initial-value) makes Chromium
  // fail to invalidate properties that reference the registered custom property
  // when its var()-resolved value changes — e.g. light/dark theme toggles leave
  // `color: var(--component-color)` stuck on the previous computed color.
  // Defaults still reach the cascade via `registerRootCustomProperty` / base styles.
  // Note: skipping registration means CSS's default `inherits: true` for custom
  // properties applies; pass a literal `value` when you need typed `@property`.
  if (!isComputationallyIndependent(options.value)) {
    return;
  }

  const inherits = options.inherits ?? false;
  const css = `@property ${name} { syntax: "${escapePropertySyntaxString(options.syntax)}"; inherits: ${inherits}; initial-value: ${options.value}; }`;
  insertRule(`@property:${name}`, css);
}
```

with:

```ts
/**
 * `@property` initial values must be *computationally independent*
 * (CSS Properties & Values Level 1, §2.4) — `var()` / `env()` references are not.
 */
function isComputationallyIndependent(value: string): boolean {
  return !/\b(?:var|env)\(/i.test(value);
}

/**
 * Safe placeholder `initial-value`s for common single-component syntaxes. A
 * placeholder only needs to satisfy the syntax grammar — the real, possibly
 * `var()`-dependent value always reaches the cascade separately via the
 * unconditional `:root { name: value }` declaration `registerRootCustomProperty`
 * / `tokens.create` emit, which the cascade prefers over `initial-value`.
 */
const SYNTAX_PLACEHOLDERS: Record<string, string> = {
  '<color>': 'transparent',
  '<number>': '0',
  '<integer>': '0',
  '<length>': '0px',
  '<percentage>': '0%',
  '<length-percentage>': '0px',
  '<angle>': '0deg',
  '<time>': '0s',
  '<resolution>': '0dpi',
};

/**
 * Looks up a safe placeholder for `syntax`. Strips one optional trailing `+`/`#`
 * list multiplier first — a single item always satisfies "one or more", so list
 * syntaxes reuse their base placeholder. Anything not an exact match (unions,
 * multi-component syntaxes, `<custom-ident>`, `<url>`, …) returns `undefined`;
 * callers must not guess beyond this table.
 */
function placeholderForSyntax(syntax: string): string | undefined {
  const base = syntax.trim().replace(/[+#]$/, '');
  return SYNTAX_PLACEHOLDERS[base];
}

export function registerAtPropertyRule(
  name: string,
  options: { value: string; syntax: string; inherits?: boolean; initial?: string | number },
): void {
  const inherits = options.inherits ?? false;

  if (isComputationallyIndependent(options.value)) {
    const css = `@property ${name} { syntax: "${escapePropertySyntaxString(options.syntax)}"; inherits: ${inherits}; initial-value: ${options.value}; }`;
    insertRule(`@property:${name}`, css);
    return;
  }

  // The real (dependent) value reaches the cascade via a separate `:root`
  // declaration — `@property`'s `initial-value` only needs to be *some* valid,
  // computationally independent placeholder for the registered syntax.
  const placeholder =
    options.initial !== undefined ? String(options.initial) : placeholderForSyntax(options.syntax);

  if (placeholder === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[typestyles] Skipping @property for "${name}": its value depends on var()/env() and ` +
          `syntax "${options.syntax}" has no built-in placeholder initial-value. Pass an explicit ` +
          `\`initial\` (e.g. { initial: '0' }) to register it typed, or accept the untyped custom property.`,
      );
    }
    return;
  }

  const css = `@property ${name} { syntax: "${escapePropertySyntaxString(options.syntax)}"; inherits: ${inherits}; initial-value: ${placeholder}; }`;
  insertRule(`@property:${name}`, css);
}
```

- [ ] **Step 4: Thread `initial` through `registerRegisteredProperty`**

Replace:

```ts
export function registerRegisteredProperty(
  name: string,
  options: { value?: string; syntax?: string; inherits?: boolean },
): void {
  if (options.syntax != null) {
    if (options.value == null) {
      throw new Error(
        '[typestyles] Registered properties with `syntax` require `value` for `@property` initial-value.',
      );
    }
    registerAtPropertyRule(name, {
      value: options.value,
      syntax: options.syntax,
      inherits: options.inherits,
    });
  }

  if (options.value != null) {
    registerRootCustomProperty(name, options.value);
  }
}
```

with:

```ts
export function registerRegisteredProperty(
  name: string,
  options: { value?: string; syntax?: string; inherits?: boolean; initial?: string | number },
): void {
  if (options.syntax != null) {
    if (options.value == null) {
      throw new Error(
        '[typestyles] Registered properties with `syntax` require `value` for `@property` initial-value.',
      );
    }
    registerAtPropertyRule(name, {
      value: options.value,
      syntax: options.syntax,
      inherits: options.inherits,
      initial: options.initial,
    });
  }

  if (options.value != null) {
    registerRootCustomProperty(name, options.value);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/typestyles && pnpm vitest run registered-property.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 6: Run the full package test suite to check for regressions**

Run: `cd packages/typestyles && pnpm vitest run`
Expected: PASS — check `tokens.test.ts` and `component-*.test.ts` files in particular, since they also call `registerAtPropertyRule` indirectly through `tokens.create` descriptors and `ctx.vars()`. Any newly-`@property`-registered output for existing `<color>`/`<number>`/etc.-syntax dependent descriptors in those files is expected and correct — if one of those tests asserts `@property` is absent for a dependent typed descriptor, update it the same way Step 1 updated `registered-property.test.ts` (assert the placeholder-registered CSS instead).

- [ ] **Step 7: Commit**

```bash
git add packages/typestyles/src/registered-property.ts packages/typestyles/src/registered-property.test.ts
git commit -m "feat: register @property with a placeholder initial-value for var()-dependent tokens"
```

---

### Task 3: `TokenDescriptor.initial` — explicit placeholder override for `tokens.create`

**Files:**

- Modify: `packages/typestyles/src/types.ts`
- Modify: `packages/typestyles/src/tokens.ts`
- Test: `packages/typestyles/src/tokens.test.ts`

**Interfaces:**

- Consumes: `registerAtPropertyRule(name, { value, syntax, inherits?, initial? })` from Task 2.
- Produces: `TokenDescriptor` gains `initial?: string | number`, usable as `tokens.create('ns', { x: { value: '...', syntax: '<color>', initial: 'hotpink' } })`.

- [ ] **Step 1: Write the failing test**

Add to `packages/typestyles/src/tokens.test.ts`, inside the `describe('tokens.create', ...)` block (after the existing `'returns RegisteredPropertyRef leaves and registers @property for descriptor tokens'` test):

```ts
it('uses an explicit descriptor `initial` as the @property placeholder for dependent values', () => {
  const api = createTokens();
  const base = api.create('base', { accent: '#0066ff' });
  api.create('derived', {
    accentSubtle: {
      value: `color-mix(in oklch, ${base.accent} 30%, white)`,
      syntax: '<color>',
      inherits: false,
      initial: 'hotpink',
    },
  });
  flushSync();

  const css = getRegisteredCss();
  expect(css).toContain('@property --derived-accentSubtle');
  expect(css).toContain('initial-value: hotpink');
  expect(css).toContain(
    '--derived-accentSubtle: color-mix(in oklch, var(--base-accent) 30%, white)',
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/typestyles && pnpm vitest run tokens.test.ts -t "explicit descriptor"`
Expected: FAIL — `TokenDescriptor` has no `initial` field yet, and it isn't threaded through.

- [ ] **Step 3: Add `initial` to `TokenDescriptor` and `RegisteredPropertyOptions`**

In `packages/typestyles/src/types.ts`, replace:

```ts
export type TokenDescriptor = {
  value: string | number;
  syntax?: string;
  inherits?: boolean;
};
```

with:

```ts
export type TokenDescriptor = {
  value: string | number;
  syntax?: string;
  inherits?: boolean;
  /**
   * Explicit `@property` placeholder `initial-value`, used when `value` is
   * `var()`/`env()`-dependent (skips the built-in syntax-keyed placeholder
   * table). Ignored for computationally independent `value`s, which use
   * `value` itself as `initial-value`.
   */
  initial?: string | number;
};
```

And replace:

```ts
/** Options for `styles.property(id, options?)`. */
export type RegisteredPropertyOptions = {
  value?: string | number;
  syntax?: string;
  inherits?: boolean;
};
```

with:

```ts
/** Options for `styles.property(id, options?)`. */
export type RegisteredPropertyOptions = {
  value?: string | number;
  syntax?: string;
  inherits?: boolean;
  /** @see {@link TokenDescriptor.initial} */
  initial?: string | number;
};
```

- [ ] **Step 4: Thread `initial` through `collectDescriptorMeta` and its call site in `tokens.ts`**

In `packages/typestyles/src/tokens.ts`, replace:

```ts
function collectDescriptorMeta(
  obj: TokenValues,
  prefix = '',
): Map<string, Pick<TokenDescriptor, 'syntax' | 'inherits'> & { value: string }> {
  const meta = new Map<string, Pick<TokenDescriptor, 'syntax' | 'inherits'> & { value: string }>();

  if (obj === null || obj === undefined) return meta;

  if (isTokenDescriptor(obj)) {
    if (prefix) {
      meta.set(prefix, {
        value: String(obj.value),
        syntax: obj.syntax,
        inherits: obj.inherits,
      });
    }
    return meta;
  }

  if (typeof obj !== 'object') return meta;

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}-${key}` : key;

    if (isTokenDescriptor(value)) {
      meta.set(fullKey, {
        value: String(value.value),
        syntax: value.syntax,
        inherits: value.inherits,
      });
    } else if (typeof value === 'object' && value !== null) {
      for (const [path, entry] of collectDescriptorMeta(value as TokenValues, fullKey)) {
        meta.set(path, entry);
      }
    }
  }

  return meta;
}
```

with:

```ts
function collectDescriptorMeta(
  obj: TokenValues,
  prefix = '',
): Map<string, Pick<TokenDescriptor, 'syntax' | 'inherits' | 'initial'> & { value: string }> {
  const meta = new Map<
    string,
    Pick<TokenDescriptor, 'syntax' | 'inherits' | 'initial'> & { value: string }
  >();

  if (obj === null || obj === undefined) return meta;

  if (isTokenDescriptor(obj)) {
    if (prefix) {
      meta.set(prefix, {
        value: String(obj.value),
        syntax: obj.syntax,
        inherits: obj.inherits,
        initial: obj.initial,
      });
    }
    return meta;
  }

  if (typeof obj !== 'object') return meta;

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}-${key}` : key;

    if (isTokenDescriptor(value)) {
      meta.set(fullKey, {
        value: String(value.value),
        syntax: value.syntax,
        inherits: value.inherits,
        initial: value.initial,
      });
    } else if (typeof value === 'object' && value !== null) {
      for (const [path, entry] of collectDescriptorMeta(value as TokenValues, fullKey)) {
        meta.set(path, entry);
      }
    }
  }

  return meta;
}
```

Then, further down in the same file, inside `create()`, replace:

```ts
for (const [path, entry] of descriptorMeta) {
  const propName = nameByPath.get(path);
  if (propName !== undefined && entry.syntax != null) {
    registerAtPropertyRule(propName, {
      value: entry.value,
      syntax: entry.syntax,
      inherits: entry.inherits,
    });
  }
}
```

with:

```ts
for (const [path, entry] of descriptorMeta) {
  const propName = nameByPath.get(path);
  if (propName !== undefined && entry.syntax != null) {
    registerAtPropertyRule(propName, {
      value: entry.value,
      syntax: entry.syntax,
      inherits: entry.inherits,
      initial: entry.initial,
    });
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/typestyles && pnpm vitest run tokens.test.ts`
Expected: PASS (30 tests)

- [ ] **Step 6: Commit**

```bash
git add packages/typestyles/src/types.ts packages/typestyles/src/tokens.ts packages/typestyles/src/tokens.test.ts
git commit -m "feat: support explicit TokenDescriptor.initial as the @property placeholder"
```

---

### Task 4: Docs and changeset for typed `@property` on dependent tokens

**Files:**

- Modify: `docs/content/docs/theming-patterns.md`
- Create: `.changeset/token-property-placeholders.md`

- [ ] **Step 1: Update the "Animating typed tokens with `@property`" section**

In `docs/content/docs/theming-patterns.md`, find the paragraph starting `> **Register the token with `syntax` to make it interpolate.**` (around line 768) and add a new paragraph immediately after the code example that follows it (after the ` ```ts ... const card = styles.class(...) ``` ` block, before the `Toggling dark.className now smoothly rotates...` paragraph — insert the new paragraph **before** that existing paragraph):

```md
**Tokens whose value references another token stay typed too.** `@property`'s
`initial-value` must be computationally independent (no `var()`/`env()`) per
spec, but that requirement is only about the `@property` rule's fallback
default — the real value still reaches the cascade through the ordinary
`:root { --name: value }` declaration `tokens.create` always emits. So a
derived token like `accentSubtle: { value: `color-mix(in oklch, ${accent} 24%, white)`, syntax: '<color>' }`
still gets a real, typed `@property` registration: TypeStyles picks a
syntax-appropriate placeholder (`transparent` for `<color>`, `0` for
`<number>`, `0px` for `<length>`, and so on) as the fallback `initial-value`,
while `:root` carries the actual `color-mix()` result. Pass an explicit
`initial` on the descriptor (`{ value, syntax, initial: 'hotpink' }`) to
override the placeholder, or to type a syntax the built-in table doesn't
cover.
```

- [ ] **Step 2: Add the changeset**

Create `.changeset/token-property-placeholders.md`:

```md
---
'typestyles': minor
---

Register `@property` with a syntax-appropriate placeholder `initial-value` (e.g. `transparent` for `<color>`, `0` for `<number>`) instead of always skipping registration for `var()`/`env()`-dependent token values. The real value still reaches the cascade via the existing unconditional `:root` declaration. Add `TokenDescriptor.initial` / `RegisteredPropertyOptions.initial` to override the placeholder explicitly.
```

- [ ] **Step 3: Commit**

```bash
git add docs/content/docs/theming-patterns.md .changeset/token-property-placeholders.md
git commit -m "docs: document placeholder-based @property registration for dependent tokens"
```

---

### Task 5: `tokens.declare()` — loose forward-reference proxy

**Files:**

- Modify: `packages/typestyles/src/types.ts`
- Modify: `packages/typestyles/src/tokens.ts`
- Test: `packages/typestyles/src/tokens.test.ts`

**Interfaces:**

- Consumes: `buildResolvePathName(namespace, template, nameByPath)` (already defined in `tokens.ts`, unchanged).
- Produces: `LooseTokenRef` type (`types.ts`); `tokens.declare(namespace, options?)` on `TokensApi`, two overloads: untyped → `LooseTokenRef`, `declare<T extends TokenValues>(...)` → `TokenRef<T>`.

- [ ] **Step 1: Write the failing tests**

Add a new `describe` block to `packages/typestyles/src/tokens.test.ts`, after the `describe('tokens.use', ...)` block and before `describe('createTheme', ...)`:

```ts
describe('tokens.declare', () => {
  beforeEach(() => {
    reset();
  });

  it('resolves nested paths to var() strings via template-literal coercion', () => {
    const api = createTokens();
    const color = api.declare('color');
    expect(`${color.accent.default}`).toBe('var(--color-accent-default)');
    expect(`${color.background.app}`).toBe('var(--color-background-app)');
  });

  it('resolves arbitrarily deep paths', () => {
    const api = createTokens();
    const color = api.declare('color');
    expect(`${color.a.b.c.d}`).toBe('var(--color-a-b-c-d)');
  });

  it('coerces via String() and valueOf, not just template literals', () => {
    const api = createTokens();
    const color = api.declare('color');
    expect(String(color.accent.default)).toBe('var(--color-accent-default)');
    expect(color.accent.default.valueOf()).toBe('var(--color-accent-default)');
  });

  it('respects scopeId', () => {
    const api = createTokens({ scopeId: 'acme' });
    const color = api.declare('color');
    expect(`${color.accent}`).toBe('var(--acme-color-accent)');
  });

  it('produces names matching a later tokens.create call in the same namespace', () => {
    const api = createTokens();
    const color = api.declare('color');
    const built = api.create('color', {
      accent: {
        default: '#0066ff',
        subtle: `color-mix(in oklch, ${color.accent.default} 24%, white)`,
      },
    });
    flushSync();

    expect(built.accent.default).toBe('var(--color-accent-default)');
    const css = getRegisteredCss();
    expect(css).toContain(
      '--color-accent-subtle: color-mix(in oklch, var(--color-accent-default) 24%, white)',
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/typestyles && pnpm vitest run tokens.test.ts -t "tokens.declare"`
Expected: FAIL — `api.declare` does not exist.

- [ ] **Step 3: Add `LooseTokenRef` to `types.ts`**

In `packages/typestyles/src/types.ts`, add immediately after the `CSSVarRef` type definition (after `export type CSSVarRef = ...`):

```ts
/**
 * Lazy `var(--…)` reference for `tokens.declare()`. Any property path, at any
 * depth, resolves to a `var(--…)` string on coercion (template literal,
 * `String()`, `valueOf()`) — there is no compile-time or dev-time validation
 * that a given path will actually be created, since `declare()` runs before
 * the namespace's shape exists. Pass an explicit generic to `declare<T>()`
 * for a fully-typed `TokenRef<T>` instead.
 */
export type LooseTokenRef = CSSVarRef & {
  readonly [key: string]: LooseTokenRef;
};
```

- [ ] **Step 4: Add `createLooseTokenProxy` to `tokens.ts`**

In `packages/typestyles/src/tokens.ts`, add the import of `LooseTokenRef` — replace:

```ts
import type {
  TokenValues,
  TokenRef,
  CreatedTokenRef,
  TokenRegistry,
  ThemeConfig,
  ThemeSurface,
  ThemeOverrides,
  TokenDescriptor,
} from './types';
```

with:

```ts
import type {
  TokenValues,
  TokenRef,
  CreatedTokenRef,
  TokenRegistry,
  ThemeConfig,
  ThemeSurface,
  ThemeOverrides,
  TokenDescriptor,
  LooseTokenRef,
} from './types';
```

Then add `createLooseTokenProxy` right after the closing brace of `createTokenProxy` (the function ending at the line `return new Proxy({}, handler);\n}` around line 241, before the `/** * Create a tokens + theme API...` JSDoc comment that precedes `createTokens`):

```ts
/**
 * Builds a proxy for `tokens.declare()`: unlike {@link createTokenProxy}, it
 * has no known key set (the namespace hasn't been created yet), so it never
 * collapses to a leaf value on its own — every property access continues the
 * accumulated path as another proxy, at any depth. `toString`/`valueOf` are
 * the only exit: they resolve the accumulated path to a `var(--…)` string via
 * `resolvePathName`, the same resolver `create()`/`use()` use.
 */
function createLooseTokenProxy(resolvePathName: (path: string) => string, prefix: string): object {
  const makeToken = (p: string) => `var(${resolvePathName(p)})`;

  const handler: ProxyHandler<object> = {
    get(_target, prop: string | symbol): unknown {
      if (typeof prop === 'symbol') {
        return undefined;
      }
      if (prop === 'toString' || prop === 'valueOf') {
        return () => makeToken(prefix);
      }
      if (prop === 'constructor') {
        return Object;
      }
      if (prop === '__esModule') {
        return false;
      }
      if (prop === 'length') {
        return 0;
      }

      const newPrefix = prefix ? `${prefix}-${prop}` : prop;
      return createLooseTokenProxy(resolvePathName, newPrefix);
    },
    has(_target, _prop) {
      return true;
    },
    set(_target, _prop, _value) {
      return false;
    },
  };

  return new Proxy({}, handler);
}
```

- [ ] **Step 5: Add `declaredNamespaceTemplates` map and the `declare` function**

In `packages/typestyles/src/tokens.ts`, inside `createTokens()`, find:

```ts
const registeredNamespaces = new Set<string>();
const createdTokenKeys = new Map<string, Set<string>>();
const createdDescriptorLeaves = new Map<string, Set<string>>();
const createdTokenTemplates = new Map<string, TokenNameTemplate | undefined>();
const createdTokenNameByPath = new Map<string, Map<string, string>>();
```

and replace with:

```ts
const registeredNamespaces = new Set<string>();
const createdTokenKeys = new Map<string, Set<string>>();
const createdDescriptorLeaves = new Map<string, Set<string>>();
const createdTokenTemplates = new Map<string, TokenNameTemplate | undefined>();
const createdTokenNameByPath = new Map<string, Map<string, string>>();
/** `nameTemplate` recorded by `tokens.declare()`, checked for agreement when `create()` later runs. */
const declaredNamespaceTemplates = new Map<string, TokenNameTemplate | undefined>();
```

Then, after the `use` function's closing brace (after `return createTokenProxy(resolvePathName, '', allKeys, descriptorLeaves) as TokenRef<T>;\n  }` inside `use`), add a new `declare` function, before the final `return { ... }` of `createTokens()`:

```ts
function declare(namespace: string, options?: { nameTemplate?: TokenNameTemplate }): LooseTokenRef {
  if (options?.nameTemplate !== undefined) {
    declaredNamespaceTemplates.set(namespace, options.nameTemplate);
  }

  const template =
    options?.nameTemplate ?? declaredNamespaceTemplates.get(namespace) ?? instanceDefaultTemplate;
  const nameByPath = createdTokenNameByPath.get(namespace) ?? new Map<string, string>();
  const resolvePathName = buildResolvePathName(namespace, template, nameByPath);

  return createLooseTokenProxy(resolvePathName, '') as LooseTokenRef;
}
```

- [ ] **Step 6: Add `declare` to the `TokensApi` type and the returned object**

Find:

```ts
export type TokensApi<R extends TokenRegistry = Record<string, never>> = {
  /** Same `scopeId` passed to `createTokens`, if any. */
  readonly scopeId: string | undefined;
  create: <T extends TokenValues, N extends string>(
    namespace: N,
    values: T,
    options?: { layer?: string; nameTemplate?: TokenNameTemplate },
  ) => CreatedTokenRef<T, N>;
  use: {
    <T extends TokenValues, N extends string>(ref: CreatedTokenRef<T, N>): TokenRef<T>;
    <N extends keyof R & string>(namespace: N): TokenRef<R[N]>;
    <T extends TokenValues = TokenValues>(namespace: string): TokenRef<T>;
  };
  createTheme: (name: string, config: ThemeConfig) => ThemeSurface;
  createDarkMode: (name: string, darkOverrides: ThemeOverrides) => ThemeSurface;
  when: typeof when;
  colorMode: typeof colorMode;
};
```

Replace with:

```ts
export type TokensApi<R extends TokenRegistry = Record<string, never>> = {
  /** Same `scopeId` passed to `createTokens`, if any. */
  readonly scopeId: string | undefined;
  create: <T extends TokenValues, N extends string>(
    namespace: N,
    values: T,
    options?: { layer?: string; nameTemplate?: TokenNameTemplate },
  ) => CreatedTokenRef<T, N>;
  use: {
    <T extends TokenValues, N extends string>(ref: CreatedTokenRef<T, N>): TokenRef<T>;
    <N extends keyof R & string>(namespace: N): TokenRef<R[N]>;
    <T extends TokenValues = TokenValues>(namespace: string): TokenRef<T>;
  };
  /**
   * Reserves `namespace`'s naming and returns a lazy `var(--…)` reference proxy
   * usable **before** `tokens.create(namespace, …)` runs — for referencing a
   * sibling token within the same `create()` call, or a namespace declared in
   * another module without importing its `create()` output. See {@link LooseTokenRef}.
   */
  declare: {
    (namespace: string, options?: { nameTemplate?: TokenNameTemplate }): LooseTokenRef;
    <T extends TokenValues>(
      namespace: string,
      options?: { nameTemplate?: TokenNameTemplate },
    ): TokenRef<T>;
  };
  createTheme: (name: string, config: ThemeConfig) => ThemeSurface;
  createDarkMode: (name: string, darkOverrides: ThemeOverrides) => ThemeSurface;
  when: typeof when;
  colorMode: typeof colorMode;
};
```

Then find the `return { ... }` at the end of `createTokens()`:

```ts
  return {
    scopeId,
    create,
    use: use as TokensApi<R>['use'],
    createTheme: (name, config) =>
```

Replace with:

```ts
  return {
    scopeId,
    create,
    use: use as TokensApi<R>['use'],
    declare: declare as TokensApi<R>['declare'],
    createTheme: (name, config) =>
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd packages/typestyles && pnpm vitest run tokens.test.ts`
Expected: PASS (35 tests)

- [ ] **Step 8: Commit**

```bash
git add packages/typestyles/src/types.ts packages/typestyles/src/tokens.ts packages/typestyles/src/tokens.test.ts
git commit -m "feat: add tokens.declare() for forward-referencing token names"
```

---

### Task 6: nameTemplate agreement between `declare()` and `create()`

**Files:**

- Modify: `packages/typestyles/src/tokens.ts`
- Test: `packages/typestyles/src/tokens.test.ts`

**Interfaces:**

- Consumes: `declaredNamespaceTemplates` map from Task 5.
- Produces: `create()` now resolves its default template as `options?.nameTemplate ?? declaredNamespaceTemplates.get(namespace) ?? instanceDefaultTemplate`, and throws in dev mode on a mismatched explicit override.

- [ ] **Step 1: Write the failing tests**

Add to the `describe('tokens.declare', ...)` block in `packages/typestyles/src/tokens.test.ts` (after the last test added in Task 5):

```ts
it('reuses the nameTemplate declared earlier when create() omits its own', () => {
  const api = createTokens();
  const template = ({ path }: { path: string }) => `--ds-color-${path}`;
  const color = api.declare('color', { nameTemplate: template });
  expect(`${color.accent}`).toBe('var(--ds-color-accent)');

  const built = api.create('color', { accent: '#0066ff' });
  expect(built.accent).toBe('var(--ds-color-accent)');
});

it('throws in dev mode when create() passes a different nameTemplate than declare() used', () => {
  const api = createTokens();
  api.declare('color', { nameTemplate: ({ path }) => `--a-${path}` });

  expect(() =>
    api.create('color', { accent: '#0066ff' }, { nameTemplate: ({ path }) => `--b-${path}` }),
  ).toThrow(/different nameTemplate/);
});

it('does not throw when create() passes the same nameTemplate reference declare() used', () => {
  const api = createTokens();
  const template = ({ path }: { path: string }) => `--ds-color-${path}`;
  api.declare('color', { nameTemplate: template });

  expect(() =>
    api.create('color', { accent: '#0066ff' }, { nameTemplate: template }),
  ).not.toThrow();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/typestyles && pnpm vitest run tokens.test.ts -t "nameTemplate"`
Expected: FAIL — `create()` doesn't yet consult `declaredNamespaceTemplates` or throw on mismatch.

- [ ] **Step 3: Update `create()`'s template resolution and add the mismatch check**

In `packages/typestyles/src/tokens.ts`, replace:

```ts
  function create<T extends TokenValues, N extends string>(
    namespace: N,
    values: T,
    options?: { layer?: string; nameTemplate?: TokenNameTemplate },
  ): CreatedTokenRef<T, N> {
    if (options?.layer != null && !themeLayerContext) {
      throw new Error(
        '[typestyles] `tokens.create(..., { layer })` requires `createTokens({ layers, tokenLayer })`.',
      );
    }

    registeredNamespaces.add(namespace);

    const cssNs = scopedTokenNamespace(scopeId, namespace);
    const effectiveTemplate = options?.nameTemplate ?? instanceDefaultTemplate;
    if (effectiveTemplate !== undefined) customNamingActive = true;
```

with:

```ts
  function create<T extends TokenValues, N extends string>(
    namespace: N,
    values: T,
    options?: { layer?: string; nameTemplate?: TokenNameTemplate },
  ): CreatedTokenRef<T, N> {
    if (options?.layer != null && !themeLayerContext) {
      throw new Error(
        '[typestyles] `tokens.create(..., { layer })` requires `createTokens({ layers, tokenLayer })`.',
      );
    }

    const declaredTemplate = declaredNamespaceTemplates.get(namespace);
    if (
      process.env.NODE_ENV !== 'production' &&
      declaredTemplate !== undefined &&
      options?.nameTemplate !== undefined &&
      options.nameTemplate !== declaredTemplate
    ) {
      throw new Error(
        `[typestyles] tokens.create('${namespace}', ...) was called with a different nameTemplate than ` +
          `tokens.declare('${namespace}', ...) used — pass the same nameTemplate to both, or omit it on ` +
          `create() to reuse the declared one.`,
      );
    }

    registeredNamespaces.add(namespace);

    const cssNs = scopedTokenNamespace(scopeId, namespace);
    const effectiveTemplate = options?.nameTemplate ?? declaredTemplate ?? instanceDefaultTemplate;
    if (effectiveTemplate !== undefined) customNamingActive = true;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/typestyles && pnpm vitest run tokens.test.ts`
Expected: PASS (38 tests)

- [ ] **Step 5: Run the full package test suite**

Run: `cd packages/typestyles && pnpm vitest run`
Expected: PASS — confirms `createTheme`-related tests and everything else in `tokens.ts`'s dependency surface still work.

- [ ] **Step 6: Commit**

```bash
git add packages/typestyles/src/tokens.ts packages/typestyles/src/tokens.test.ts
git commit -m "feat: keep tokens.declare() and tokens.create() nameTemplate in agreement"
```

---

### Task 7: End-to-end same-namespace self-reference test (Var UI scenario)

**Files:**

- Test: `packages/typestyles/src/tokens.test.ts`

This task has no implementation changes — Tasks 5 and 6 already implement everything needed. It exists as its own reviewable step because it's the scenario the whole feature was motivated by (Var UI's hand-rolled `cref()` workaround) and deserves an explicit, realistic regression test distinct from the smaller unit tests in Task 5.

- [ ] **Step 1: Write the test**

Add to the `describe('tokens.declare', ...)` block in `packages/typestyles/src/tokens.test.ts`:

```ts
it('supports the Var UI colorRefShape pattern: multiple self-referencing derived tokens in one create() call', () => {
  const api = createTokens({ scopeId: 'acme' });
  const color = api.declare('color');

  const built = api.create('color', {
    background: { app: '#0a0a0a' },
    accent: {
      default: '#0066ff',
      subtle: `color-mix(in oklch, ${color.accent.default} 24%, ${color.background.app})`,
    },
    danger: {
      default: '#ef4444',
      subtle: `color-mix(in oklch, ${color.danger.default} 12%, transparent)`,
    },
  });
  flushSync();

  expect(built.accent.subtle).toBe('var(--acme-color-accent-subtle)');

  const css = getRegisteredCss();
  expect(css).toContain(
    '--acme-color-accent-subtle: color-mix(in oklch, var(--acme-color-accent-default) 24%, var(--acme-color-background-app))',
  );
  expect(css).toContain(
    '--acme-color-danger-subtle: color-mix(in oklch, var(--acme-color-danger-default) 12%, transparent)',
  );
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd packages/typestyles && pnpm vitest run tokens.test.ts -t "colorRefShape"`
Expected: PASS — this should already pass given Tasks 5–6; if it fails, that's a real gap in those tasks' implementation to fix before continuing.

- [ ] **Step 3: Commit**

```bash
git add packages/typestyles/src/tokens.test.ts
git commit -m "test: cover the Var UI colorRefShape self-reference pattern end-to-end"
```

---

### Task 8: End-to-end cross-namespace / circular reference test

**Files:**

- Test: `packages/typestyles/src/tokens.test.ts`

No implementation changes — same rationale as Task 7, covering the second scenario from the spec.

- [ ] **Step 1: Write the test**

Add to the `describe('tokens.declare', ...)` block:

```ts
it('supports two namespaces referencing each other without a real import cycle', () => {
  const api = createTokens();

  // Simulates module A: declares what it needs from "colorB" before "colorB" exists.
  const colorBRef = api.declare('colorB');
  const colorA = api.create('colorA', {
    accent: `color-mix(in oklch, ${colorBRef.accent} 50%, black)`,
  });

  // Simulates module B: declares what it needs from "colorA" (already created above,
  // but declare() doesn't require that — it would work in either creation order).
  const colorARef = api.declare('colorA');
  const colorB = api.create('colorB', {
    accent: `color-mix(in oklch, ${colorARef.accent} 50%, white)`,
  });

  flushSync();

  expect(colorA.accent).toBe('var(--colorA-accent)');
  expect(colorB.accent).toBe('var(--colorB-accent)');

  const css = getRegisteredCss();
  expect(css).toContain('--colorA-accent: color-mix(in oklch, var(--colorB-accent) 50%, black)');
  expect(css).toContain('--colorB-accent: color-mix(in oklch, var(--colorA-accent) 50%, white)');
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd packages/typestyles && pnpm vitest run tokens.test.ts -t "import cycle"`
Expected: PASS.

- [ ] **Step 3: Run the full package test suite one more time**

Run: `cd packages/typestyles && pnpm vitest run`
Expected: PASS, all tests (baseline 29 + all tests added across Tasks 2, 3, 5–8).

- [ ] **Step 4: Commit**

```bash
git add packages/typestyles/src/tokens.test.ts
git commit -m "test: cover cross-namespace token forward references end-to-end"
```

---

### Task 9: Export `LooseTokenRef`, document `tokens.declare()`, changeset

**Files:**

- Modify: `packages/typestyles/src/index.ts`
- Modify: `docs/content/docs/tokens.md`
- Create: `.changeset/tokens-declare.md`

- [ ] **Step 1: Export `LooseTokenRef`**

In `packages/typestyles/src/index.ts`, find the large `export type { ... } from './types';` block and add `LooseTokenRef` to it — locate:

```ts
  ThemeSurface,
  DeepPartialTokenValues,
} from './types';
```

and replace with:

```ts
  ThemeSurface,
  DeepPartialTokenValues,
  LooseTokenRef,
} from './types';
```

- [ ] **Step 2: Verify the export compiles**

Run: `cd packages/typestyles && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Add the "Forward-referencing tokens" section to `docs/content/docs/tokens.md`**

Insert a new section immediately after the existing "## Referencing tokens defined elsewhere" section (after its closing content, before "## Theming" — i.e. right before the line `## Theming` around line 132):

````md
## Forward-referencing tokens (`tokens.declare`)

`tokens.create(namespace, values)` takes a single plain object, so nothing
inside `values` can reference the object being built — a semantic
`accent.subtle` built from `color-mix()` of `accent.default` can't refer to
`accent.default` from within the same `tokens.create('color', {...})` call,
because `color` doesn't exist yet while `values` is still being constructed.

`tokens.declare(namespace, options?)` reserves a namespace's naming ahead of
time and returns a lazy reference proxy you can use while building that same
namespace's values — or another namespace's, before it's been created:

```ts
import { tokens } from 'typestyles';

const color = tokens.declare('color');

export const colorTokens = tokens.create('color', {
  background: { app: '#0a0a0a' },
  accent: {
    default: '#0066ff',
    subtle: `color-mix(in oklch, ${color.accent.default} 24%, ${color.background.app})`,
  },
});
```
````

Any property path on a declared ref, at any depth, resolves to a real
`var(--…)` string when coerced (template literals, `String()`, `assignVars`).
Name resolution reuses the same logic `tokens.create` and `tokens.use` use
internally — including `scopeId` and any `nameTemplate` — so a declared name
and the name `tokens.create` eventually emits are always the same string. If
you pass a `nameTemplate` to `declare()`, pass the **same** function reference
to the matching `create()` call (or omit it there to reuse the declared one);
passing a different one throws in development.

**Cross-namespace / avoiding import cycles.** The same mechanism works across
modules — declare what you need from a namespace before importing (or without
ever importing) the module that creates it:

```ts
// module-a.ts
import { tokens } from './runtime';
const colorFromB = tokens.declare('colorB');
export const colorA = tokens.create('colorA', {
  accent: `color-mix(in oklch, ${colorFromB.accent} 50%, black)`,
});

// module-b.ts — no import of module-a.ts needed
import { tokens } from './runtime';
const colorFromA = tokens.declare('colorA');
export const colorB = tokens.create('colorB', {
  accent: `color-mix(in oklch, ${colorFromA.accent} 50%, white)`,
});
```

**Type safety.** Without a type argument, `declare()` returns a `LooseTokenRef`
— any path typechecks, since `declare()` genuinely can't know the namespace's
eventual shape. Pass the shape explicitly for full autocomplete and type
checking instead:

```ts
type DesignColorValues = {
  background: { app: string };
  accent: { default: string; subtle: string };
};

const color = tokens.declare<DesignColorValues>('color');
color.accent.default; // string, typed
color.accent.nonexistent; // ✗ type error
```

`declare()` only reserves naming — it emits no CSS. If you `declare()` a
namespace and never call the matching `tokens.create()`, no `:root` rule is
ever produced for it, the same as never calling `create()` at all.

````

- [ ] **Step 4: Add the changeset**

Create `.changeset/tokens-declare.md`:

```md
---
'typestyles': minor
---

Add `tokens.declare(namespace, options?)` — a lazy `var(--…)` reference proxy for referencing a token before its value exists, either within the same `tokens.create()` call (self-referencing derived tokens) or across modules without a real import cycle. Names resolve through the same logic `tokens.create`/`tokens.use` already use, including `scopeId` and `nameTemplate`.
````

- [ ] **Step 5: Run the full package test suite and typecheck one final time**

Run: `cd packages/typestyles && pnpm vitest run && pnpm exec tsc --noEmit`
Expected: PASS, no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/typestyles/src/index.ts docs/content/docs/tokens.md .changeset/tokens-declare.md
git commit -m "docs: document tokens.declare() and export LooseTokenRef"
```

---

## Post-plan follow-up (not part of this plan)

Var UI's `packages/core/src/tokens/index.ts` (a separate repo) hand-rolls the
exact `cref()` workaround `tokens.declare()` replaces. Once this plan ships
and a new `typestyles` version is published, migrating Var UI's `colorRefShape`
to use `tokens.declare()` is a natural follow-up — but it's a change in a
different repository and package version bump, out of scope here.
