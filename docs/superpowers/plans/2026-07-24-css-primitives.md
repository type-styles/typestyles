# CSS Primitives Ladder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `typestyles/css` subpath with CSS-faithful `atProperty` / `customProperty` / `customProperties` emitters; split `styles.property` and `ctx.vars` into declare-only registration plus separate value setting (variant-driven for components); converge on shared `PropertyRegistration` types while preserving shorthand backward compatibility.

**Architecture:** Build a thin `css.ts` public API over existing `registerAtPropertySchema` and a new batch custom-property emitter with per-selector merge maps. Refactor `createStylesPropertyFn` into a callable namespace object (`property`, `property.declare`, `property.set`). Extend `createComponentConfigContextPair` with `vars.declare` / `var.declare` using `flattenTokenSchema` for schema leaves. Optionally refactor `tokens.create` `:root` emission through the batch helper without changing output keys or layer wrapping.

**Tech Stack:** TypeScript, Vitest (jsdom), tsup, pnpm workspaces, Changesets.

**Spec:** `specs/css-primitives-design.md`

## Global Constraints

- **Progressive disclosure:** `tokens.*` semantics unchanged; this plan only refactors `:root` emission internally.
- **`PropertyRegistration` never includes `value`** — values are set via `css.customProperty`, `styles.property.set`, component `base`/variants, or `tokens.create`.
- **Shorthand APIs unchanged:** `styles.property(id, opts?)`, `ctx.var(id, opts?)`, `ctx.vars(definitions)` must keep existing behavior and tests passing.
- **`ctx.vars` stays variant-driven** — no `ctx.vars.set()`; values go in `[ref.name]` overrides only.
- **`styles.property` callable + namespace:** `declare` and `set` are properties on the same function object.
- **`typestyles/css` uses exact `--name` strings** — no `scopeId` prefixing; dev throw if `name` does not start with `--`.
- **`registerAtPropertySchema` conflict check:** identical re-registration is a no-op; conflicting re-registration throws in dev mode.
- **`css.customProperties` merge:** in-memory accumulator per selector; `insertRule` key `custom-props:${selector}`; later calls merge and replace atomically.
- Run `pnpm --filter typestyles test` after every task; run `pnpm verify` before the final commit.
- Add a Changeset in `.changeset/` (`typestyles`: **minor** — new `typestyles/css` subpath and `declare`/`set` methods).

---

## File Structure

| File                                                  | Responsibility                                                                                                                                                                                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/typestyles/src/types.ts`                    | Add `PropertyRegistration`, `PropertyRef`, `PropertyOptions`, `StylesPropertyFn`; alias `ComponentVarSchema` → `TokenSchema`; update `ComponentConfigContext`; deprecate `TokenDescriptor` / `RegisteredPropertyOptions` as aliases of `PropertyOptions`. |
| `packages/typestyles/src/custom-properties.ts`        | **New.** Per-selector property maps, `registerCustomProperty`, `registerCustomProperties`, `formatCustomPropertiesCss`.                                                                                                                                   |
| `packages/typestyles/src/registered-property.ts`      | Track `@property` registrations for conflict detection; route `registerRootCustomProperty` through `registerCustomProperty`; export `propertyRegistrationsEqual`.                                                                                         |
| `packages/typestyles/src/css.ts`                      | **New.** `css.atProperty`, `css.customProperty`, `css.customProperties`, `css.var`.                                                                                                                                                                       |
| `packages/typestyles/src/css-entry.ts`                | **New.** Re-export `css` for `typestyles/css` subpath.                                                                                                                                                                                                    |
| `packages/typestyles/src/css.test.ts`                 | **New.** Tests for `css.*` emitters.                                                                                                                                                                                                                      |
| `packages/typestyles/src/custom-properties.test.ts`   | **New.** Batch merge tests.                                                                                                                                                                                                                               |
| `packages/typestyles/src/registered-property.test.ts` | Add conflict-detection tests for `registerAtPropertySchema`.                                                                                                                                                                                              |
| `packages/typestyles/src/styles.ts`                   | Update `StylesApi.property` type to `StylesPropertyFn`.                                                                                                                                                                                                   |
| `packages/typestyles/src/registered-property.ts`      | Rewrite `createStylesPropertyFn` → callable + `.declare` / `.set`.                                                                                                                                                                                        |
| `packages/typestyles/src/component-config-context.ts` | Add `vars.declare`, `var.declare`; refactor `registerVar` to use schema path.                                                                                                                                                                             |
| `packages/typestyles/src/component.test.ts`           | Add `vars.declare` tests.                                                                                                                                                                                                                                 |
| `packages/typestyles/src/styles.test.ts`              | Add `property.declare` / `.set` tests.                                                                                                                                                                                                                    |
| `packages/typestyles/src/tokens.ts`                   | Refactor `:root` block formatting through `formatCustomPropertiesCss` (behavior-neutral).                                                                                                                                                                 |
| `packages/typestyles/tsup.config.ts`                  | Add `css: 'src/css-entry.ts'` entry.                                                                                                                                                                                                                      |
| `packages/typestyles/package.json`                    | Add `"./css"` export map entry.                                                                                                                                                                                                                           |
| `packages/typestyles/src/index.ts`                    | Re-export `PropertyRegistration`, `PropertyRef`, `PropertyOptions`.                                                                                                                                                                                       |
| `docs/content/docs/css-primitives.md`                 | **New.** Ladder decision tree + API reference.                                                                                                                                                                                                            |
| `docs/content/docs/api-reference.md`                  | Document `styles.property.declare` / `.set` and `typestyles/css`.                                                                                                                                                                                         |
| `docs/content/docs/tokens.md`                         | Cross-link to css-primitives.                                                                                                                                                                                                                             |
| `docs/content/docs/components.md`                     | `ctx.vars.declare` example.                                                                                                                                                                                                                               |
| `docs/src/navigation.ts`                              | Add `css-primitives` nav entry under Tokens group.                                                                                                                                                                                                        |
| `.changeset/css-primitives.md`                        | Changeset entry.                                                                                                                                                                                                                                          |

**Out of scope:** `css.keyframes` / `css.fontFace` aliases, `PropertyRef` branding for compile-time `set()` safety, removing deprecated type aliases.

---

### Task 1: Shared property types

**Files:**

- Modify: `packages/typestyles/src/types.ts`
- Test: `packages/typestyles/src/types.typecheck.ts` (create if missing, or extend existing typecheck file)

**Interfaces:**

- Produces: `PropertyRegistration`, `PropertyRef`, `PropertyOptions`, `StylesPropertyFn`, `ComponentVarSchema` (alias of `TokenSchema`), updated `ComponentConfigContext`.

- [ ] **Step 1: Add property types to `types.ts`**

Insert after `RegisteredPropertyRef` (around line 263):

```ts
/** `@property` registration metadata — never includes a runtime value. */
export type PropertyRegistration = {
  syntax: string;
  inherits?: boolean;
  initial?: string | number;
};

/** Reference to a registered CSS custom property. */
export type PropertyRef = RegisteredPropertyRef;

/** Shorthand options for bundled declare + optional set. */
export type PropertyOptions = PropertyRegistration & {
  value?: string | number;
};

/** Callable `styles.property` with `declare` / `set` namespace methods. */
export type StylesPropertyFn = {
  (id: string, options?: PropertyOptions): PropertyRef;
  declare(id: string, registration: PropertyRegistration): PropertyRef;
  set(ref: PropertyRef, value: string | number): void;
};

/** Schema for `ctx.vars.declare` — same shape as token declare schemas. */
export type ComponentVarSchema = TokenSchema;
```

Update `RegisteredPropertyOptions`:

```ts
/** @deprecated Use {@link PropertyOptions} */
export type RegisteredPropertyOptions = PropertyOptions;
```

Update `ComponentVarDescriptor`:

```ts
/** @deprecated Use {@link PropertyOptions} */
export type ComponentVarDescriptor = PropertyOptions;
```

Update `ComponentConfigContext`:

```ts
export type ComponentConfigContext = {
  var: {
    (id: string, options?: PropertyOptions): PropertyRef;
    declare(id: string, registration: PropertyRegistration): PropertyRef;
  };
  vars: {
    <const T extends ComponentVarDefinitions>(definitions: T): ComponentVarRefTree<T>;
    declare<const T extends ComponentVarSchema>(schema: T): ComponentVarRefTree<InferFromSchema<T>>;
  };
};
```

Update `StylesApi` in `styles.ts` (type only in this step):

```ts
property: StylesPropertyFn;
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm --filter typestyles typecheck`
Expected: PASS (implementation catches up in later tasks; if `createStylesPropertyFn` return type mismatches, add `as StylesPropertyFn` temporarily or implement Task 4 first).

- [ ] **Step 3: Commit**

```bash
git add packages/typestyles/src/types.ts packages/typestyles/src/styles.ts
git commit -m "refactor(typestyles): add PropertyRegistration and StylesPropertyFn types"
```

---

### Task 2: Custom-property batch emitter and `@property` conflict detection

**Files:**

- Create: `packages/typestyles/src/custom-properties.ts`
- Create: `packages/typestyles/src/custom-properties.test.ts`
- Modify: `packages/typestyles/src/registered-property.ts`
- Modify: `packages/typestyles/src/registered-property.test.ts`

**Interfaces:**

- Produces: `registerCustomProperty(name, value, selector?)`, `registerCustomProperties(selector, properties)`, `formatCustomPropertiesCss(selector, properties)`, `resetCustomProperties()` (test-only export).
- Produces: `registerAtPropertySchema` now tracks registrations; `propertyRegistrationsEqual(a, b)`.

- [ ] **Step 1: Write failing tests for custom-properties**

Create `packages/typestyles/src/custom-properties.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerCustomProperty,
  registerCustomProperties,
  resetCustomProperties,
} from './custom-properties';
import { getRegisteredCss, reset, flushSync } from './sheet';

describe('custom-properties', () => {
  beforeEach(() => {
    reset();
    resetCustomProperties();
  });

  it('registerCustomProperty emits a single declaration on :root', () => {
    registerCustomProperty('--ts-a', '#fff');
    flushSync();
    expect(getRegisteredCss()).toContain(':root { --ts-a: #fff; }');
  });

  it('registerCustomProperties batches multiple properties on one selector', () => {
    registerCustomProperties(':root', { '--ts-a': '#fff', '--ts-b': '8px' });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain(':root { --ts-a: #fff; --ts-b: 8px; }');
  });

  it('registerCustomProperties merges later calls for the same selector', () => {
    registerCustomProperties(':root', { '--ts-a': '#fff' });
    registerCustomProperties(':root', { '--ts-b': '8px' });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('--ts-a: #fff');
    expect(css).toContain('--ts-b: 8px');
    expect(css.match(/:root \{[^}]+\}/g)?.length).toBe(1);
  });

  it('later registerCustomProperties overrides the same property name', () => {
    registerCustomProperties(':root', { '--ts-a': '#fff' });
    registerCustomProperties(':root', { '--ts-a': '#000' });
    flushSync();
    expect(getRegisteredCss()).toContain(':root { --ts-a: #000; }');
    expect(getRegisteredCss()).not.toContain('#fff');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter typestyles test -- src/custom-properties.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `custom-properties.ts`**

```ts
import { insertRule } from './sheet';

const selectorMaps = new Map<string, Map<string, string>>();

function selectorKey(selector: string): string {
  return `custom-props:${selector}`;
}

function getOrCreateMap(selector: string): Map<string, string> {
  let map = selectorMaps.get(selector);
  if (!map) {
    map = new Map();
    selectorMaps.set(selector, map);
  }
  return map;
}

export function formatCustomPropertiesCss(
  selector: string,
  properties: Record<string, string>,
): string {
  const body = Object.entries(properties)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
  return `${selector} { ${body}; }`;
}

function emitSelector(selector: string): void {
  const map = selectorMaps.get(selector);
  if (!map || map.size === 0) return;
  const props = Object.fromEntries(map.entries());
  insertRule(selectorKey(selector), formatCustomPropertiesCss(selector, props));
}

export function registerCustomProperty(name: string, value: string, selector = ':root'): void {
  getOrCreateMap(selector).set(name, value);
  emitSelector(selector);
}

export function registerCustomProperties(
  selector: string,
  properties: Record<string, string | number>,
): void {
  const map = getOrCreateMap(selector);
  for (const [name, value] of Object.entries(properties)) {
    map.set(name, String(value));
  }
  emitSelector(selector);
}

/** @internal Test helper */
export function resetCustomProperties(): void {
  selectorMaps.clear();
}
```

Update `registerRootCustomProperty` in `registered-property.ts`:

```ts
import { registerCustomProperty } from './custom-properties';

export function registerRootCustomProperty(name: string, value: string): void {
  registerCustomProperty(name, value, ':root');
}
```

- [ ] **Step 4: Run custom-properties tests**

Run: `pnpm --filter typestyles test -- src/custom-properties.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing conflict-detection tests**

Add to `registered-property.test.ts`:

```ts
describe('registerAtPropertySchema conflict detection', () => {
  beforeEach(() => {
    reset();
  });

  it('identical re-registration is a no-op', () => {
    registerAtPropertySchema('--ts-conflict', { syntax: '<color>', inherits: false });
    registerAtPropertySchema('--ts-conflict', { syntax: '<color>', inherits: false });
    flushSync();
    expect(getRegisteredCss().match(/@property --ts-conflict/g)?.length).toBe(1);
  });

  it('conflicting re-registration throws in dev mode', () => {
    registerAtPropertySchema('--ts-conflict', { syntax: '<color>', inherits: false });
    expect(() =>
      registerAtPropertySchema('--ts-conflict', { syntax: '<length>', inherits: false }),
    ).toThrow(/conflicting/i);
  });
});
```

- [ ] **Step 6: Implement conflict detection in `registerAtPropertySchema`**

Add at top of `registered-property.ts`:

```ts
const propertyRegistrations = new Map<
  string,
  { syntax: string; inherits: boolean; initial?: string | number }
>();

export function propertyRegistrationsEqual(
  a: { syntax: string; inherits?: boolean; initial?: string | number },
  b: { syntax: string; inherits?: boolean; initial?: string | number },
): boolean {
  return (
    a.syntax === b.syntax &&
    (a.inherits ?? false) === (b.inherits ?? false) &&
    (a.initial ?? undefined) === (b.initial ?? undefined)
  );
}
```

At start of `registerAtPropertySchema`:

```ts
const normalized = {
  syntax: options.syntax,
  inherits: options.inherits ?? false,
  initial: options.initial,
};
const existing = propertyRegistrations.get(name);
if (existing) {
  if (propertyRegistrationsEqual(existing, normalized)) return;
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`[typestyles] Conflicting @property registration for "${name}".`);
  }
  return;
}
```

Before `insertRule` at end of successful registration:

```ts
propertyRegistrations.set(name, normalized);
```

Export `resetPropertyRegistrations` for tests and call it from `sheet.ts` `reset()` if not already cleared (check `reset()` — add `propertyRegistrations.clear()` and `resetCustomProperties()` to global `reset()`).

- [ ] **Step 7: Run all registered-property tests**

Run: `pnpm --filter typestyles test -- src/registered-property.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/typestyles/src/custom-properties.ts packages/typestyles/src/custom-properties.test.ts packages/typestyles/src/registered-property.ts packages/typestyles/src/registered-property.test.ts packages/typestyles/src/sheet.ts
git commit -m "feat(typestyles): add custom-property batch emitter and @property conflict detection"
```

---

### Task 3: `typestyles/css` public API

**Files:**

- Create: `packages/typestyles/src/css.ts`
- Create: `packages/typestyles/src/css-entry.ts`
- Create: `packages/typestyles/src/css.test.ts`
- Modify: `packages/typestyles/tsup.config.ts`
- Modify: `packages/typestyles/package.json`
- Modify: `packages/typestyles/src/index.ts`

**Interfaces:**

- Produces: `css` object with `atProperty`, `customProperty`, `customProperties`, `var`.
- Consumes: `registerAtPropertySchema`, `registerCustomProperty`, `registerCustomProperties`, `createRegisteredPropertyRef`.

- [ ] **Step 1: Write failing tests**

Create `packages/typestyles/src/css.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { css } from './css';
import { getRegisteredCss, reset, flushSync } from './sheet';
import { resetCustomProperties } from './custom-properties';

describe('css', () => {
  beforeEach(() => {
    reset();
    resetCustomProperties();
  });

  it('atProperty emits @property without a value declaration', () => {
    const ref = css.atProperty('--ts-css-color', { syntax: '<color>', inherits: false });
    flushSync();
    expect(getRegisteredCss()).toContain('@property --ts-css-color');
    expect(getRegisteredCss()).not.toContain(':root { --ts-css-color');
    expect(ref.var).toBe('var(--ts-css-color)');
  });

  it('customProperty emits a value without @property', () => {
    css.customProperty('--ts-css-a', '#fff');
    flushSync();
    expect(getRegisteredCss()).toContain(':root { --ts-css-a: #fff; }');
    expect(getRegisteredCss()).not.toContain('@property --ts-css-a');
  });

  it('atProperty + customProperty compose for dependent values', () => {
    const base = css.var('--ts-css-base');
    css.atProperty('--ts-css-base', { syntax: '<color>', inherits: false });
    css.customProperty('--ts-css-base', '#0066ff');
    css.atProperty('--ts-css-mix', { syntax: '<color>', inherits: false });
    css.customProperty('--ts-css-mix', `color-mix(in oklch, ${base.var} 50%, white)`);
    flushSync();
    const out = getRegisteredCss();
    expect(out).toContain('@property --ts-css-mix');
    expect(out).toContain('color-mix(in oklch, var(--ts-css-base) 50%, white)');
  });

  it('customProperties batches on a selector', () => {
    css.customProperties(':root', { '--ts-x': '1', '--ts-y': '2' });
    flushSync();
    expect(getRegisteredCss()).toContain(':root { --ts-x: 1; --ts-y: 2; }');
  });

  it('throws when name does not start with --', () => {
    expect(() => css.atProperty('bad-name' as '--bad', { syntax: '<color>' })).toThrow(/--/);
  });

  it('css.var returns a ref without emitting', () => {
    const ref = css.var('--ts-external');
    flushSync();
    expect(ref.name).toBe('--ts-external');
    expect(getRegisteredCss()).not.toContain('--ts-external');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter typestyles test -- src/css.test.ts`
Expected: FAIL — `./css` not found.

- [ ] **Step 3: Implement `css.ts`**

```ts
import type { PropertyRegistration, PropertyRef } from './types';
import { createRegisteredPropertyRef, registerAtPropertySchema } from './registered-property';
import { registerCustomProperty, registerCustomProperties } from './custom-properties';

function assertCustomPropName(name: string): asserts name is `--${string}` {
  if (!name.startsWith('--')) {
    throw new Error(`[typestyles] Custom property name must start with "--" — got "${name}".`);
  }
}

export const css = {
  atProperty(name: `--${string}`, registration: PropertyRegistration): PropertyRef {
    assertCustomPropName(name);
    registerAtPropertySchema(name, registration);
    return createRegisteredPropertyRef(name);
  },

  customProperty(
    name: `--${string}`,
    value: string | number,
    options?: { selector?: string },
  ): void {
    assertCustomPropName(name);
    registerCustomProperty(name, String(value), options?.selector ?? ':root');
  },

  customProperties(selector: string, properties: Record<`--${string}`, string | number>): void {
    const normalized: Record<string, string> = {};
    for (const [name, value] of Object.entries(properties)) {
      assertCustomPropName(name);
      normalized[name] = String(value);
    }
    registerCustomProperties(selector, normalized);
  },

  var(name: `--${string}`): PropertyRef {
    assertCustomPropName(name);
    return createRegisteredPropertyRef(name);
  },
} as const;
```

Create `packages/typestyles/src/css-entry.ts`:

```ts
export { css } from './css';
export type { PropertyRegistration, PropertyRef, PropertyOptions } from './types';
```

- [ ] **Step 4: Wire build exports**

In `tsup.config.ts` entry map add:

```ts
css: 'src/css-entry.ts',
```

In `package.json` `exports` add (after `./globals`):

```json
"./css": {
  "import": {
    "types": "./dist/css.d.ts",
    "default": "./dist/css.js"
  },
  "require": {
    "types": "./dist/css.d.cts",
    "default": "./dist/css.cjs"
  }
}
```

In `index.ts` add to type exports:

```ts
export type { PropertyRegistration, PropertyRef, PropertyOptions } from './types';
```

- [ ] **Step 5: Build and test**

Run: `pnpm --filter typestyles build && pnpm --filter typestyles test -- src/css.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/typestyles/src/css.ts packages/typestyles/src/css-entry.ts packages/typestyles/src/css.test.ts packages/typestyles/tsup.config.ts packages/typestyles/package.json packages/typestyles/src/index.ts
git commit -m "feat(typestyles): add typestyles/css subpath with atProperty and customProperty"
```

---

### Task 4: `styles.property` declare / set namespace

**Files:**

- Modify: `packages/typestyles/src/registered-property.ts` (`createStylesPropertyFn`)
- Modify: `packages/typestyles/src/styles.test.ts`

**Interfaces:**

- Consumes: `registerAtPropertySchema`, `registerCustomProperty`, `createRegisteredPropertyRef`, `PropertyRegistration`, `PropertyOptions`, `StylesPropertyFn`.
- Produces: `createStylesPropertyFn(classNaming) → StylesPropertyFn` with `.declare` and `.set`.

- [ ] **Step 1: Write failing tests**

Add to `styles.test.ts` `describe('styles.property')` block:

```ts
it('declare emits @property without :root value', () => {
  const s = createStyles();
  const hue = s.property.declare('accent-hue', { syntax: '<number>', inherits: false });
  flushSync();
  const css = getRegisteredCss();
  expect(css).toContain('@property --property-accent-hue');
  expect(css).not.toContain(':root { --property-accent-hue');
  expect(hue.var).toBe('var(--property-accent-hue)');
});

it('set emits :root value for a declared ref', () => {
  const s = createStyles();
  const hue = s.property.declare('accent-hue', { syntax: '<number>' });
  s.property.set(hue, '220');
  flushSync();
  expect(getRegisteredCss()).toContain(':root { --property-accent-hue: 220');
});

it('declare + set matches shorthand output', () => {
  reset();
  const a = createStyles();
  const split = a.property.declare('overlay-opacity', { syntax: '<number>', inherits: false });
  a.property.set(split, '0.5');

  reset();
  const b = createStyles();
  const combined = b.property('overlay-opacity', {
    value: '0.5',
    syntax: '<number>',
    inherits: false,
  });

  flushSync();
  expect(getRegisteredCss()).toContain('@property --property-overlay-opacity');
  expect(getRegisteredCss()).toContain('initial-value: 0.5');
  expect(split.var).toBe(combined.var);
});

it('set throws when ref is from a different styles instance', () => {
  const a = createStyles();
  const b = createStyles();
  const ref = a.property.declare('x', { syntax: '<number>' });
  expect(() => b.property.set(ref, '1')).toThrow(/different styles instance/i);
});
```

- [ ] **Step 2: Run tests to verify new cases fail**

Run: `pnpm --filter typestyles test -- src/styles.test.ts -t "declare"
Expected: FAIL — `declare` is not a function.

- [ ] **Step 3: Rewrite `createStylesPropertyFn`**

Replace the function body in `registered-property.ts`:

```ts
export function createStylesPropertyFn(classNaming: ClassNamingConfig): StylesPropertyFn {
  const seen = new Set<string>();
  const ns = scopedTokenNamespace(classNaming.scopeId?.trim() || undefined, 'property');
  const prefix = `--${ns}-`;

  function resolveName(id: string): string {
    return `${prefix}${sanitizeClassSegment(id)}`;
  }

  function trackId(id: string): void {
    const safeId = sanitizeClassSegment(id);
    if (seen.has(safeId)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[typestyles] Duplicate styles.property("${id}") on this styles instance. ` +
            `Declare each id once and reuse the returned ref.`,
        );
      }
    } else {
      seen.add(safeId);
    }
  }

  function declareFn(id: string, registration: PropertyRegistration): RegisteredPropertyRef {
    trackId(id);
    const name = resolveName(id);
    registerAtPropertySchema(name, registration);
    return createRegisteredPropertyRef(name);
  }

  function setFn(ref: RegisteredPropertyRef, value: string | number): void {
    if (!ref.name.startsWith(prefix)) {
      throw new Error(
        '[typestyles] styles.property.set() received a ref from a different styles instance.',
      );
    }
    registerCustomProperty(ref.name, String(value), ':root');
  }

  function propertyFn(id: string, options?: PropertyOptions): RegisteredPropertyRef {
    trackId(id);
    const name = resolveName(id);

    if (!options) {
      return createRegisteredPropertyRef(name);
    }

    const { value, syntax, inherits, initial } = options;

    if (syntax != null) {
      const ref = declareFn(id, { syntax, inherits, initial });
      if (value != null) {
        setFn(ref, value);
      }
      return ref;
    }

    if (value != null) {
      registerCustomProperty(name, String(value), ':root');
    }

    return createRegisteredPropertyRef(name);
  }

  return Object.assign(propertyFn, { declare: declareFn, set: setFn });
}
```

Add `import type { PropertyOptions, PropertyRegistration, StylesPropertyFn } from './types';`

Remove or keep `registerRegisteredProperty` for any remaining internal callers (grep before deleting).

- [ ] **Step 4: Run styles.property tests**

Run: `pnpm --filter typestyles test -- src/styles.test.ts -t "styles.property"`
Expected: PASS (all existing + new tests).

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/registered-property.ts packages/typestyles/src/styles.test.ts
git commit -m "feat(typestyles): add styles.property.declare and styles.property.set"
```

---

### Task 5: `ctx.vars.declare` and `ctx.var.declare`

**Files:**

- Modify: `packages/typestyles/src/component-config-context.ts`
- Modify: `packages/typestyles/src/component.test.ts`

**Interfaces:**

- Consumes: `flattenTokenSchema`, `registerAtPropertySchema`, `createRegisteredPropertyRef`, `InferFromSchema`, `ComponentVarSchema`.
- Produces: `ctx.vars.declare(schema)`, `ctx.var.declare(id, registration)`.

- [ ] **Step 1: Write failing test**

Add to `component.test.ts` inside `describe('createComponent — function config & internal vars')`:

```ts
it('vars.declare registers @property without base defaults; values set in variants', () => {
  const badge = createComponent(defaultClassNamingConfig, 'cb-declare', (c) => {
    const v = c.vars.declare({
      textColor: { syntax: '<color>', inherits: false },
      borderWidth: true,
    });
    return {
      base: {
        [v.borderWidth.name]: '1px',
        color: v.textColor.var,
        borderStyle: 'solid',
        borderWidth: v.borderWidth.var,
      },
      variants: {
        tone: {
          neutral: { [v.textColor.name]: '#333' },
          danger: { [v.textColor.name]: '#900' },
        },
      },
      defaultVariants: { tone: 'neutral' },
    };
  });

  flushSync();
  const css = getRegisteredCss();
  expect(css).toContain('@property --cb-declare-text-color');
  expect(css).not.toMatch(/cb-declare-text-color:\s*#/); // no default in base for textColor
  expect(badge({ tone: 'danger' })).toContain('cb-declare--tone-danger');
  expect(css).toContain('cb-declare--tone-danger');
});

it('var.declare registers @property without merging a base default', () => {
  createComponent(defaultClassNamingConfig, 'cb-var-declare', (c) => {
    const border = c.var.declare('border-color', { syntax: '<color>', inherits: false });
    return {
      base: { borderWidth: '1px', borderStyle: 'solid' },
      variants: {
        tone: {
          hot: { [border.name]: 'red' },
        },
      },
    };
  });

  flushSync();
  const css = getRegisteredCss();
  expect(css).toContain('@property --cb-var-declare-border-color');
  expect(css).not.toContain('--cb-var-declare-border-color: red');
  expect(css).toContain('cb-var-declare--tone-hot');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter typestyles test -- src/component.test.ts -t "vars.declare"
Expected: FAIL — `declare` is not a function.

- [ ] **Step 3: Implement declare methods in `component-config-context.ts`**

Add imports:

```ts
import { flattenTokenSchema } from './token-schema';
import { registerAtPropertySchema } from './registered-property';
import type {
  ComponentVarSchema,
  InferFromSchema,
  PropertyRegistration,
  PropertyOptions,
} from './types';
```

Add `declareVarSchema` helper:

```ts
function declareVarSchema(
  schema: ComponentVarSchema,
  registerRef: (logicalPath: string) => ComponentInternalVarRef,
): void {
  for (const { path, leaf } of flattenTokenSchema(schema)) {
    const ref = registerRef(path);
    if (leaf !== true) {
      registerAtPropertySchema(ref.name, {
        syntax: leaf.syntax,
        inherits: leaf.inherits,
        initial: leaf.initial,
      });
    }
  }
}
```

Refactor `registerVar` to split `registerVarValue` (sets `varBaseDefaults` + optional `registerAtPropertyRule` for shorthand descriptor path) from bare ref creation.

Replace `ctx` construction:

```ts
function declareVarFn(id: string, registration: PropertyRegistration): ComponentInternalVarRef {
  const safePath = sanitizeClassSegment(id);
  trackSeen(safePath, `internal var "${id}"`);
  const name = `--${ns}-${safePath}`;
  registerAtPropertySchema(name, registration);
  return createRegisteredPropertyRef(name);
}

function varFn(id: string, options?: PropertyOptions): ComponentInternalVarRef {
  // existing logic: if value → registerVar with defaults; else bare ref
}

function varsDeclareFn<const T extends ComponentVarSchema>(
  schema: T,
): ComponentVarRefTree<InferFromSchema<T>> {
  const refByPath = new Map<string, ComponentInternalVarRef>();
  const allPathKeys = new Set<string>();

  for (const { path } of flattenTokenSchema(schema)) {
    for (const p of pathPrefixes(path)) allPathKeys.add(p);
    const safeId = sanitizeClassSegment(path);
    trackSeen(safeId, `internal var path "${path}"`);
    const name = `--${ns}-${safeId}`;
    refByPath.set(path, createRegisteredPropertyRef(name));
  }

  declareVarSchema(schema, (logicalPath) => {
    const ref = refByPath.get(logicalPath);
    if (!ref) throw new Error(`[typestyles] internal error: missing ref for "${logicalPath}"`);
    return ref;
  });

  return createVarRefsProxy(refByPath, allPathKeys, '') as ComponentVarRefTree<InferFromSchema<T>>;
}

const varCallable = Object.assign(varFn, { declare: declareVarFn });
const varsCallable = Object.assign(varsFn, { declare: varsDeclareFn });
const ctx: ComponentConfigContext = { var: varCallable, vars: varsCallable };
```

Keep existing `varsFn` shorthand unchanged — it still calls `registerVar` which sets defaults and uses `registerAtPropertyRule` when `syntax` + `value` are both present.

- [ ] **Step 4: Run component var tests**

Run: `pnpm --filter typestyles test -- src/component.test.ts -t "internal vars"
Expected: PASS (existing + new).

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/component-config-context.ts packages/typestyles/src/component.test.ts
git commit -m "feat(typestyles): add ctx.vars.declare and ctx.var.declare"
```

---

### Task 6: Refactor `tokens.create` `:root` formatting (behavior-neutral)

**Files:**

- Modify: `packages/typestyles/src/tokens.ts`
- Test: `packages/typestyles/src/tokens.test.ts` (existing tests must pass unchanged)

**Interfaces:**

- Consumes: `formatCustomPropertiesCss`.
- Produces: same CSS output and `insertRule` keys as before (`tokens:${cssNs}` or layered variant).

- [ ] **Step 1: Run tokens tests baseline**

Run: `pnpm --filter typestyles test -- src/tokens.test.ts`
Expected: PASS (baseline).

- [ ] **Step 2: Refactor declaration string building**

In `tokens.ts`, import `formatCustomPropertiesCss` from `./custom-properties`.

Replace:

```ts
const css = `:root { ${declarations}; }`;
```

With:

```ts
const props: Record<string, string> = {};
for (const { path, value } of flatEntries) {
  const propName = nameByPath.get(path);
  if (propName === undefined) {
    throw new Error(
      `[typestyles] tokens.create('${namespace}'): internal error resolving name for "${path}".`,
    );
  }
  props[propName] = value;
}
const css = formatCustomPropertiesCss(':root', props);
```

Remove the old `declarations = flatEntries.map(...).join` block if fully replaced.

**Important:** Keep `insertRule(key, css)` / layered `insertRules` keys unchanged — do **not** route through `registerCustomProperties` (that would change HMR keys to `custom-props::root`).

- [ ] **Step 3: Run tokens tests**

Run: `pnpm --filter typestyles test -- src/tokens.test.ts`
Expected: PASS — identical CSS output.

- [ ] **Step 4: Commit**

```bash
git add packages/typestyles/src/tokens.ts
git commit -m "refactor(typestyles): format token :root blocks via shared custom-properties helper"
```

---

### Task 7: Documentation

**Files:**

- Create: `docs/content/docs/css-primitives.md`
- Modify: `docs/content/docs/api-reference.md`
- Modify: `docs/content/docs/tokens.md`
- Modify: `docs/content/docs/components.md`
- Modify: `docs/src/navigation.ts`

- [ ] **Step 1: Create `css-primitives.md`**

Include:

1. Ladder diagram (code block from spec).
2. Decision tree ("Is it a design token?" → tokens; component → ctx.vars; global scoped → styles.property; exact names → css).
3. `typestyles/css` API with migration example (Style Dictionary).
4. `styles.property.declare` / `.set` example.
5. `ctx.vars.declare` example (from spec).
6. Link to `insertRule` as escape hatch.

- [ ] **Step 2: Update `api-reference.md`**

Add under `styles`:

- `styles.property.declare(id, registration)`
- `styles.property.set(ref, value)`
- Note shorthand `styles.property(id, options?)` unchanged.

Add new section:

```markdown
### `typestyles/css`

Import: `import { css } from 'typestyles/css'`

- `css.atProperty(name, registration)` — emit `@property` only
- `css.customProperty(name, value, options?)` — emit value declaration
- `css.customProperties(selector, properties)` — batch emit
- `css.var(name)` — ref without emitting
```

- [ ] **Step 3: Update `tokens.md`**

Add short paragraph after "Creating tokens" linking to [CSS primitives](/docs/css-primitives) for the full ladder.

- [ ] **Step 4: Update `components.md`**

Add `ctx.vars.declare` example in the internal vars section; link to css-primitives.

- [ ] **Step 5: Update `navigation.ts`**

Under the Tokens group (after `tokens` entry):

```ts
{ slug: 'css-primitives', title: 'CSS primitives' },
```

- [ ] **Step 6: Build docs**

Run: `pnpm --filter docs build`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add docs/content/docs/css-primitives.md docs/content/docs/api-reference.md docs/content/docs/tokens.md docs/content/docs/components.md docs/src/navigation.ts
git commit -m "docs: add CSS primitives ladder and typestyles/css reference"
```

---

### Task 8: Changeset and full verification

**Files:**

- Create: `.changeset/css-primitives.md`

- [ ] **Step 1: Add changeset**

```markdown
---
'typestyles': minor
---

Add `typestyles/css` subpath with `css.atProperty`, `css.customProperty`, `css.customProperties`, and `css.var` for exact-name CSS custom property control.

Add `styles.property.declare` / `styles.property.set` and `ctx.vars.declare` / `ctx.var.declare` for split `@property` registration and value assignment. Shorthand `styles.property(id, options?)` and `ctx.vars(definitions)` behavior is unchanged.

Export `PropertyRegistration`, `PropertyRef`, and `PropertyOptions` types. `TokenDescriptor` and `RegisteredPropertyOptions` are deprecated aliases.
```

- [ ] **Step 2: Run full verify**

Run: `pnpm verify`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add .changeset/css-primitives.md
git commit -m "chore: add changeset for css primitives ladder"
```

---

## Spec Coverage Self-Review

| Spec requirement                                | Task                          |
| ----------------------------------------------- | ----------------------------- |
| `typestyles/css` subpath                        | Task 3                        |
| `css.atProperty` declare-only                   | Task 3                        |
| `css.customProperty` / `customProperties`       | Task 2, 3                     |
| `css.var` ref without emit                      | Task 3                        |
| `--` prefix validation                          | Task 3                        |
| `@property` conflict detection                  | Task 2                        |
| `styles.property.declare` / `.set`              | Task 4                        |
| Callable + namespace pattern                    | Task 4                        |
| Cross-instance `set` throw                      | Task 4                        |
| Shorthand backward compat                       | Task 4, 5                     |
| `ctx.vars.declare`                              | Task 5                        |
| Variant-driven values only                      | Task 5                        |
| `ctx.var.declare`                               | Task 5                        |
| Type convergence (`PropertyRegistration`, etc.) | Task 1                        |
| Deprecated descriptor aliases                   | Task 1                        |
| `tokens.create` refactor                        | Task 6                        |
| Documentation ladder                            | Task 7                        |
| Build extraction / SSR (same `insertRule` path) | Implicit — no bundler changes |
| Tests per spec matrix                           | Tasks 2–6                     |

**Resolved open questions (locked for implementation):**

- `customProperties` merge key: `custom-props:${selector}` with in-memory accumulator.
- `PropertyRef` branding: runtime prefix check on `styles.property.set` only (no brand in v1).
- Export style: named `css` export from `typestyles/css`.
- `registerAtPropertySchema`: stays internal; public surface is `css.atProperty`.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-24-css-primitives.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — implement tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
