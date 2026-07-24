# Schema-Driven `tokens.declare` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the schema-less `tokens.declare(namespace)` proxy with a schema-driven `tokens.declare(namespace, schema)` that emits `@property` rules and infers types from input; move `@property` registration off `tokens.create()` values; add mergeable partial `create()` with an optional `decl` handle for typing and namespace alignment.

**Architecture:** Add `token-schema.ts` for schema flattening, deep-merge, and leaf comparison. `declare()` deep-merges schemas per namespace, emits `@property` with placeholder `initial-value`s for `syntax` leaves, and returns a branded `DeclaredTokenRef`. `create()` deep-merges plain `string | number` values, re-emits `:root`, validates paths against the merged schema in dev mode, and accepts `options.decl` for compile-time value typing. Undeclared namespaces remain freeform plain `create()` with no `@property`.

**Tech Stack:** TypeScript, Vitest (jsdom), pnpm workspaces, Changesets.

**Spec:** `specs/tokens-declare-schema-design.md`

## Global Constraints

- `declare()` is **optional** — `create()` without a prior `declare()` must continue to work for plain namespaces (no schema validation, no `@property`).
- `declare()` requires a `schema` argument — remove schema-less overload, `LooseTokenRef`, and `declare<T>()`.
- `create()` values are plain `string | number` only — remove `TokenDescriptor` from `create()` (keep `TokenDescriptor` for `ctx.vars()` / `styles.property()`).
- `@property` for design tokens is emitted only from `declare()` schema `syntax` leaves, always with a computationally independent placeholder `initial-value`.
- Both `declare()` and `create()` **deep-merge** per namespace; identical schema leaves on re-declare are no-ops; conflicting schema leaves throw in dev mode.
- `options.decl` on `create()` is optional — when passed, compile-time namespace must match and runtime dev check throws on mismatch.
- Name resolution must reuse `buildResolvePathName` / `resolveTokenName` / `buildTokenNameContext` — no parallel naming logic.
- Run `pnpm --filter typestyles test` after every task; run `pnpm verify` before the final commit.
- Add a Changeset in `.changeset/` (`typestyles`: **minor** — API extension with intentional breaking removals).

---

## File Structure

| File                                                  | Responsibility                                                                                                                                                                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/typestyles/src/types.ts`                    | Add `TokenSchema`, `TokenSchemaLeaf`, `CreateTokenValues`, `InferFromSchema`, `InferValuesFromSchema`, `DeclaredTokenRef`, `DeclaredBrand`; remove `LooseTokenRef`; narrow `TokensApi.create` / `declare` signatures. |
| `packages/typestyles/src/token-schema.ts`             | **New.** `isTokenSchemaLeaf`, `flattenTokenSchema`, `mergeTokenTrees`, `tokenSchemaLeavesEqual`, `getSchemaSyntaxLeaves`.                                                                                             |
| `packages/typestyles/src/registered-property.ts`      | Add `registerAtPropertySchema(name, { syntax, inherits?, initial? })` for declare-time registration (placeholder only).                                                                                               |
| `packages/typestyles/src/tokens.ts`                   | Rewrite `declare()` and `create()`; add per-instance `namespaceSchemas` + `namespaceValues` maps; `DeclaredBrand` WeakMap helpers; schema-aware declare proxy; remove `collectDescriptorMeta` usage from `create()`.  |
| `packages/typestyles/src/tokens.test.ts`              | Rewrite `tokens.declare` tests; update/remove `TokenDescriptor`-on-create tests; add merge, validation, `decl` mismatch tests.                                                                                        |
| `packages/typestyles/src/registered-property.test.ts` | Add tests for `registerAtPropertySchema`.                                                                                                                                                                             |
| `packages/typestyles/src/index.ts`                    | Export new types; remove `LooseTokenRef` export.                                                                                                                                                                      |
| `docs/content/docs/tokens.md`                         | Rewrite forward-reference section for schema-driven `declare()`.                                                                                                                                                      |
| `docs/content/docs/api-reference.md`                  | Update `declare` / `create` signatures; remove `LooseTokenRef`.                                                                                                                                                       |
| `docs/content/docs/theming-patterns.md`               | Update animating-tokens example to use `declare` schema + plain `create`.                                                                                                                                             |
| `.changeset/tokens-declare-schema.md`                 | Changeset entry.                                                                                                                                                                                                      |

**Out of scope (follow-up):** `examples/design-system` component `ctx.vars()` usage, Var UI repo migration.

---

### Task 1: Schema types and utilities

**Files:**

- Create: `packages/typestyles/src/token-schema.ts`
- Modify: `packages/typestyles/src/types.ts`
- Test: `packages/typestyles/src/token-schema.test.ts`

**Interfaces:**

- Produces: `TokenSchemaLeaf`, `TokenSchema`, `isTokenSchemaLeaf()`, `flattenTokenSchema(schema, prefix?) → Array<{ path, leaf }>`, `mergeTokenTrees<T>(base, chunk) → T`, `tokenSchemaLeavesEqual(a, b) → boolean`, `getSchemaSyntaxLeaves(schema) → Set<string>`.
- Produces: `InferFromSchema<S>`, `InferValuesFromSchema<S>`, `CreateTokenValues`, `DeclaredBrand`, `DeclaredTokenRef<TSchema, N>`.

- [ ] **Step 1: Write the failing test**

Create `packages/typestyles/src/token-schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  flattenTokenSchema,
  mergeTokenTrees,
  tokenSchemaLeavesEqual,
  getSchemaSyntaxLeaves,
} from './token-schema';

describe('token-schema', () => {
  it('flattenTokenSchema collects leaves with paths', () => {
    const schema = {
      accent: {
        default: { syntax: '<color>', inherits: false },
        subtle: true,
      },
    } as const;

    expect(flattenTokenSchema(schema)).toEqual([
      { path: 'accent-default', leaf: { syntax: '<color>', inherits: false } },
      { path: 'accent-subtle', leaf: true },
    ]);
  });

  it('mergeTokenTrees deep-merges nested schema chunks', () => {
    const a = { accent: { default: { syntax: '<color>', inherits: false } } };
    const b = { accent: { subtle: true }, meta: { version: true } };

    expect(mergeTokenTrees(a, b)).toEqual({
      accent: {
        default: { syntax: '<color>', inherits: false },
        subtle: true,
      },
      meta: { version: true },
    });
  });

  it('tokenSchemaLeavesEqual compares syntax and plain leaves', () => {
    expect(tokenSchemaLeavesEqual(true, true)).toBe(true);
    expect(
      tokenSchemaLeavesEqual(
        { syntax: '<color>', inherits: false },
        { syntax: '<color>', inherits: false },
      ),
    ).toBe(true);
    expect(tokenSchemaLeavesEqual(true, { syntax: '<color>', inherits: false })).toBe(false);
    expect(
      tokenSchemaLeavesEqual(
        { syntax: '<color>', inherits: false },
        { syntax: '<length>', inherits: false },
      ),
    ).toBe(false);
  });

  it('getSchemaSyntaxLeaves returns paths with syntax', () => {
    const schema = {
      accent: { default: { syntax: '<color>', inherits: false }, subtle: true },
    };
    expect([...getSchemaSyntaxLeaves(schema)]).toEqual(['accent-default']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/typestyles && pnpm vitest run src/token-schema.test.ts`
Expected: FAIL — module `./token-schema` not found.

- [ ] **Step 3: Implement `token-schema.ts`**

Create `packages/typestyles/src/token-schema.ts`:

```ts
import type { TokenSchema, TokenSchemaLeaf } from './types';

export function isTokenSchemaLeaf(value: unknown): value is TokenSchemaLeaf {
  return value === true || (typeof value === 'object' && value !== null && 'syntax' in value);
}

export function flattenTokenSchema(
  schema: TokenSchema,
  prefix = '',
): Array<{ path: string; leaf: TokenSchemaLeaf }> {
  const entries: Array<{ path: string; leaf: TokenSchemaLeaf }> = [];

  if (isTokenSchemaLeaf(schema)) {
    if (prefix) entries.push({ path: prefix, leaf: schema });
    return entries;
  }

  for (const [key, value] of Object.entries(schema)) {
    const path = prefix ? `${prefix}-${key}` : key;
    entries.push(...flattenTokenSchema(value as TokenSchema, path));
  }

  return entries;
}

export function mergeTokenTrees<T extends Record<string, unknown>>(base: T, chunk: T): T {
  const result = { ...base } as T;

  for (const [key, value] of Object.entries(chunk)) {
    const existing = result[key as keyof T];
    if (
      existing !== undefined &&
      typeof existing === 'object' &&
      existing !== null &&
      typeof value === 'object' &&
      value !== null &&
      !isTokenSchemaLeaf(existing) &&
      !isTokenSchemaLeaf(value)
    ) {
      result[key as keyof T] = mergeTokenTrees(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      ) as T[keyof T];
    } else {
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
}

export function tokenSchemaLeavesEqual(a: TokenSchemaLeaf, b: TokenSchemaLeaf): boolean {
  if (a === true && b === true) return true;
  if (typeof a === 'object' && typeof b === 'object') {
    return a.syntax === b.syntax && (a.inherits ?? false) === (b.inherits ?? false);
  }
  return false;
}

export function getSchemaSyntaxLeaves(schema: TokenSchema): Set<string> {
  return new Set(
    flattenTokenSchema(schema)
      .filter((entry) => entry.leaf !== true)
      .map((entry) => entry.path),
  );
}
```

Add to `packages/typestyles/src/types.ts` (near `TokenDescriptor`):

```ts
export type TokenSchemaLeaf =
  | true
  | { syntax: string; inherits?: boolean; initial?: string | number };

export type TokenSchema = TokenSchemaLeaf | { [key: string]: TokenSchema };

/** Plain token values accepted by `tokens.create()` (no inline descriptors). */
export type CreateTokenValues = string | number | { [key: string]: CreateTokenValues };

export type InferFromSchema<S> = S extends { syntax: string }
  ? RegisteredPropertyRef
  : S extends true
    ? string
    : S extends Record<string, unknown>
      ? { readonly [K in keyof S]: InferFromSchema<S[K]> }
      : never;

export type InferValuesFromSchema<S> = S extends true
  ? string | number
  : S extends { syntax: string }
    ? string | number
    : S extends Record<string, unknown>
      ? { [K in keyof S]?: InferValuesFromSchema<S[K]> }
      : never;

declare const DeclaredBrand: unique symbol;

export type DeclaredTokenRef<TSchema, N extends string> = TokenRef<InferFromSchema<TSchema>> & {
  readonly [DeclaredBrand]: { namespace: N; schema: TSchema };
};
```

Remove the `LooseTokenRef` type and its JSDoc block from `types.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/typestyles && pnpm vitest run src/token-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/token-schema.ts packages/typestyles/src/token-schema.test.ts packages/typestyles/src/types.ts
git commit -m "feat: add token schema types and utilities"
```

---

### Task 2: Declare-time `@property` registration

**Files:**

- Modify: `packages/typestyles/src/registered-property.ts`
- Test: `packages/typestyles/src/registered-property.test.ts`

**Interfaces:**

- Produces: `registerAtPropertySchema(name, { syntax, inherits?, initial? })` — emits `@property` with placeholder `initial-value`; warns and skips when no placeholder exists (same as dependent-value fallback today).

- [ ] **Step 1: Write the failing test**

Append to `packages/typestyles/src/registered-property.test.ts`:

```ts
import { registerAtPropertySchema } from './registered-property';

it('registerAtPropertySchema emits @property with syntax placeholder and no value arg', () => {
  reset();
  registerAtPropertySchema('--ts-schema-color', { syntax: '<color>', inherits: false });
  flushSync();
  expect(getRegisteredCss()).toContain(
    '@property --ts-schema-color { syntax: "<color>"; inherits: false; initial-value: transparent; }',
  );
});

it('registerAtPropertySchema uses explicit initial when provided', () => {
  reset();
  registerAtPropertySchema('--ts-schema-explicit', {
    syntax: '<color>',
    inherits: false,
    initial: 'hotpink',
  });
  flushSync();
  expect(getRegisteredCss()).toContain('initial-value: hotpink');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/typestyles && pnpm vitest run src/registered-property.test.ts -t registerAtPropertySchema`
Expected: FAIL — `registerAtPropertySchema` not exported.

- [ ] **Step 3: Implement `registerAtPropertySchema`**

In `registered-property.ts`, export a new function that resolves a placeholder (explicit `initial` or `placeholderForSyntax`) and calls the existing rule-emitting path:

```ts
export function registerAtPropertySchema(
  name: string,
  options: { syntax: string; inherits?: boolean; initial?: string | number },
): void {
  const inherits = options.inherits ?? false;
  let placeholder: string | undefined;

  if (options.initial !== undefined) {
    const initialStr = String(options.initial);
    if (!isComputationallyIndependent(initialStr)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[typestyles] Skipping @property for "${name}": explicit \`initial\` value "${initialStr}" ` +
            `depends on var()/env() and cannot be used as an initial-value.`,
        );
      }
      return;
    }
    placeholder = initialStr;
  } else {
    placeholder = placeholderForSyntax(options.syntax);
  }

  if (placeholder === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[typestyles] Skipping @property for "${name}": syntax "${options.syntax}" has no ` +
          `built-in placeholder initial-value. Pass an explicit \`initial\`.`,
      );
    }
    return;
  }

  const css = `@property ${name} { syntax: "${escapePropertySyntaxString(options.syntax)}"; inherits: ${inherits}; initial-value: ${placeholder}; }`;
  insertRule(`@property:${name}`, css);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/typestyles && pnpm vitest run src/registered-property.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/registered-property.ts packages/typestyles/src/registered-property.test.ts
git commit -m "feat: add registerAtPropertySchema for declare-time @property"
```

---

### Task 3: Rewrite `declare()` — schema merge, `@property` emission, branded ref

**Files:**

- Modify: `packages/typestyles/src/tokens.ts`
- Modify: `packages/typestyles/src/types.ts` (if `TokensApi.declare` not updated yet)
- Test: `packages/typestyles/src/tokens.test.ts`

**Interfaces:**

- Produces: `attachDeclaredMeta(ref, { namespace, schema })`, `getDeclaredNamespace(ref) → string | undefined`.
- Produces: `declare(namespace, schema, options?) → DeclaredTokenRef<typeof schema, typeof namespace>`.
- Consumes: Task 1 schema utils; Task 2 `registerAtPropertySchema`.

- [ ] **Step 1: Write the failing tests**

Replace the `describe('tokens.declare')` block setup tests. Add these first (keep `beforeEach(() => reset())`):

```ts
it('declare(schema) emits @property for syntax leaves immediately', () => {
  const api = createTokens();
  api.declare('color', {
    accent: { default: { syntax: '<color>', inherits: false } },
  });
  flushSync();
  const css = getRegisteredCss();
  expect(css).toContain('@property --color-accent-default');
  expect(css).toContain('initial-value: transparent');
});

it('declare deep-merges schemas across calls', () => {
  const api = createTokens();
  api.declare('color', { accent: { default: { syntax: '<color>', inherits: false } } });
  api.declare('color', { accent: { subtle: { syntax: '<color>', inherits: false } } });
  flushSync();
  const css = getRegisteredCss();
  expect(css).toContain('@property --color-accent-default');
  expect(css).toContain('@property --color-accent-subtle');
});

it('declare throws in dev when re-declaring a path with conflicting schema', () => {
  const api = createTokens();
  api.declare('color', { accent: { default: { syntax: '<color>', inherits: false } } });
  expect(() => api.declare('color', { accent: { default: true } })).toThrow(/conflicting schema/i);
});

it('declare returns a typed ref that coerces to var()', () => {
  const api = createTokens();
  const color = api.declare('color', {
    accent: { default: { syntax: '<color>', inherits: false } },
  });
  expect(`${color.accent.default}`).toBe('var(--color-accent-default)');
  expectTypeOf(color.accent.default).toMatchTypeOf<{ name: string; var: string }>();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/typestyles && pnpm vitest run src/tokens.test.ts -t "declare"`
Expected: FAIL — `declare` does not accept schema as second argument yet.

- [ ] **Step 3: Implement declare rewrite**

In `tokens.ts`:

1. Add WeakMap for declared metadata:

```ts
const declaredMetaByRef = new WeakMap<object, { namespace: string; schema: TokenSchema }>();

function attachDeclaredMeta(ref: object, meta: { namespace: string; schema: TokenSchema }): void {
  declaredMetaByRef.set(ref, meta);
}

export function getDeclaredNamespace(ref: object): string | undefined {
  return declaredMetaByRef.get(ref)?.namespace;
}
```

2. Add per-instance state inside `createTokens()`:

```ts
const namespaceSchemas = new Map<string, TokenSchema>();
const declaredSchemaLeaves = new Map<string, Map<string, TokenSchemaLeaf>>();
```

3. Replace `declare()` implementation:

```ts
function declare<TSchema extends TokenSchema, N extends string>(
  namespace: N,
  schema: TSchema,
  options?: { nameTemplate?: TokenNameTemplate },
): DeclaredTokenRef<TSchema, N> {
  // nameTemplate agreement checks (keep existing logic)
  const prior = namespaceSchemas.get(namespace);
  const merged = prior ? mergeTokenTrees(prior as TSchema, schema) : schema;
  const incoming = flattenTokenSchema(schema);
  const leafMap = declaredSchemaLeaves.get(namespace) ?? new Map<string, TokenSchemaLeaf>();

  const effectiveTemplate = /* same as current declare nameTemplate resolution */;
  declaredNamespaceTemplates.set(namespace, effectiveTemplate);
  const nameByPath = createdTokenNameByPath.get(namespace) ?? new Map<string, string>();
  const resolvePathName = buildResolvePathName(namespace, effectiveTemplate, nameByPath);

  for (const { path, leaf } of incoming) {
    const existing = leafMap.get(path);
    if (existing !== undefined) {
      if (!tokenSchemaLeavesEqual(existing, leaf)) {
        if (process.env.NODE_ENV !== 'production') {
          throw new Error(
            `[typestyles] tokens.declare('${namespace}', ...) re-declared path "${path}" with a ` +
              `conflicting schema leaf.`,
          );
        }
      } else if (leaf !== true) {
        continue; // identical syntax leaf — skip @property re-registration
      } else {
        continue; // identical plain leaf
      }
    }

    leafMap.set(path, leaf);
    if (leaf !== true) {
      const propName = resolvePathName(path);
      registerAtPropertySchema(propName, {
        syntax: leaf.syntax,
        inherits: leaf.inherits,
        initial: leaf.initial,
      });
    }
  }

  namespaceSchemas.set(namespace, merged);
  declaredSchemaLeaves.set(namespace, leafMap);

  const syntaxLeaves = getSchemaSyntaxLeaves(merged);
  const ref = createDeclaredTokenProxy(resolvePathName, '', syntaxLeaves) as DeclaredTokenRef<TSchema, N>;
  attachDeclaredMeta(ref, { namespace, schema: merged });
  return ref;
}
```

4. Add `createDeclaredTokenProxy` — copy `createLooseTokenProxy` but use `createRegisteredPropertyRef` on `toString`/`valueOf` when `prefix` is in `syntaxLeaves`:

```ts
function createDeclaredTokenProxy(
  resolvePathName: (path: string) => string,
  prefix: string,
  syntaxLeaves: Set<string>,
): object {
  const makeLeaf = (p: string) =>
    syntaxLeaves.has(p)
      ? createRegisteredPropertyRef(resolvePathName(p))
      : `var(${resolvePathName(p)})`;
  // same Proxy handler as createLooseTokenProxy but toString/valueOf call makeLeaf(prefix)
}
```

5. Update `TokensApi.declare` signature in `tokens.ts` to:

```ts
declare: <TSchema extends TokenSchema, N extends string>(
  namespace: N,
  schema: TSchema,
  options?: { nameTemplate?: TokenNameTemplate },
) => DeclaredTokenRef<TSchema, N>;
```

Remove the old `LooseTokenRef` / `declare<T extends TokenValues>` overload.

- [ ] **Step 4: Run tests**

Run: `cd packages/typestyles && pnpm vitest run src/tokens.test.ts -t "declare"`
Expected: new tests PASS; old tests that call `declare('color')` without schema will fail — update them in Task 5.

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/tokens.ts
git commit -m "feat: schema-driven tokens.declare with @property emission"
```

---

### Task 4: Rewrite `create()` — merge values, schema validation, `decl` handle

**Files:**

- Modify: `packages/typestyles/src/tokens.ts`
- Test: `packages/typestyles/src/tokens.test.ts`

**Interfaces:**

- Consumes: `getDeclaredNamespace(ref)` from Task 3; `namespaceSchemas`, `declaredSchemaLeaves`.
- Produces: `create()` overload with `options.decl`; `namespaceValues` merge; dev validation; no `@property` from `create()`.

- [ ] **Step 1: Write the failing tests**

```ts
it('create merges values across calls for the same namespace', () => {
  const api = createTokens();
  const color = api.declare('color', {
    accent: {
      default: { syntax: '<color>', inherits: false },
      subtle: { syntax: '<color>', inherits: false },
    },
  });

  api.create('color', { accent: { default: '#0066ff' } }, { decl: color });
  api.create('color', { accent: { subtle: '#aabbcc' } }, { decl: color });
  flushSync();

  const css = getRegisteredCss();
  expect(css).toContain('--color-accent-default: #0066ff');
  expect(css).toContain('--color-accent-subtle: #aabbcc');
});

it('create throws in dev when a value path is not in the declared schema', () => {
  const api = createTokens();
  const color = api.declare('color', {
    accent: { default: { syntax: '<color>', inherits: false } },
  });
  expect(() => api.create('color', { bogus: 'x' }, { decl: color })).toThrow(
    /not in the declared schema/i,
  );
});

it('create throws in dev when decl namespace does not match', () => {
  const api = createTokens();
  const color = api.declare('color', {
    accent: { default: { syntax: '<color>', inherits: false } },
  });
  expect(() => api.create('spacing', { sm: '8px' }, { decl: color })).toThrow(/decl handle for/i);
});

it('create without declare still works for plain namespaces', () => {
  const api = createTokens();
  const spacing = api.create('spacing', { sm: '8px' });
  expect(spacing.sm).toBe('var(--spacing-sm)');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/typestyles && pnpm vitest run src/tokens.test.ts -t "create merges"`
Expected: FAIL

- [ ] **Step 3: Implement create rewrite**

1. Add per-instance `namespaceValues = new Map<string, Map<string, string>>()`.

2. Update `TokensApi.create` type:

```ts
create: {
  <TSchema extends TokenSchema, N extends string>(
    namespace: N,
    values: InferValuesFromSchema<TSchema>,
    options: {
      decl: DeclaredTokenRef<TSchema, N>;
      layer?: string;
      nameTemplate?: TokenNameTemplate;
    },
  ): CreatedTokenRef<InferFromSchema<TSchema>, N>;
  <T extends CreateTokenValues, N extends string>(
    namespace: N,
    values: T,
    options?: { layer?: string; nameTemplate?: TokenNameTemplate },
  ): CreatedTokenRef<T, N>;
};
```

3. In `create()`:
   - If `options?.decl` and dev: `getDeclaredNamespace(options.decl) !== namespace` → throw.
   - Flatten incoming `values` with `flattenTokenEntries` (values are plain — no descriptors).
   - If `namespaceSchemas.has(namespace)` and dev: each flattened path must exist in `declaredSchemaLeaves.get(namespace)`.
   - Merge into `namespaceValues.get(namespace)`.
   - Build `:root` CSS from **all** accumulated values in `namespaceValues`, not just this chunk.
   - Remove `collectDescriptorMeta` loop and `registerAtPropertyRule` calls from `create()`.
   - For proxy `descriptorLeaves`, use `getSchemaSyntaxLeaves(namespaceSchemas.get(namespace) ?? {})` when declared, else empty set.
   - `allKeys` = union of declared schema paths and accumulated value paths.

4. Add helper `mergeCreateValues(namespace, chunk)` using `mergeTokenTrees` on plain value trees, then flatten to path map.

- [ ] **Step 4: Run full tokens tests**

Run: `cd packages/typestyles && pnpm vitest run src/tokens.test.ts`
Expected: many failures from old tests — proceed to Task 5.

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/tokens.ts packages/typestyles/src/types.ts
git commit -m "feat: mergeable create with decl handle and schema validation"
```

---

### Task 5: Migrate and expand tests

**Files:**

- Modify: `packages/typestyles/src/tokens.test.ts`
- Modify: `packages/typestyles/src/layers.test.ts` (if it uses `TokenDescriptor` on `create`)

**Interfaces:**

- Consumes: final `declare` / `create` APIs from Tasks 3–4.

- [ ] **Step 1: Update descriptor-on-create tests**

Replace `tokens.create('motion', { duration: { value: '200ms', syntax: '<time>' } })` with:

```ts
const motion = api.declare('motion', {
  duration: { syntax: '<time>', inherits: false },
  easing: true,
});
const motionTokens = api.create('motion', { duration: '200ms', easing: 'ease' }, { decl: motion });
```

Replace `registers @property with automatic transparent placeholder for a declare-built color-mix descriptor` with schema declare + plain create value using forward ref.

- [ ] **Step 2: Update all `api.declare('color')` calls**

Every bare `declare('color')` in `tokens.test.ts` needs a schema argument. Minimal schemas for each test case (only paths referenced).

- [ ] **Step 3: Remove obsolete tests**

Delete:

- `supports the typed declare<T>() overload`
- Tests that only validated `LooseTokenRef` untyped behavior without schema (replace with schema equivalents where still valuable).

- [ ] **Step 4: Add end-to-end forward-ref test**

```ts
it('supports Var UI pattern: declare schema, partial merge create, self-referencing color-mix', () => {
  const api = createTokens({ scopeId: 'acme' });
  const color = api.declare('color', {
    background: { app: { syntax: '<color>', inherits: false } },
    accent: {
      default: { syntax: '<color>', inherits: false },
      subtle: { syntax: '<color>', inherits: false },
    },
    danger: {
      default: { syntax: '<color>', inherits: false },
      subtle: { syntax: '<color>', inherits: false },
    },
  });

  api.create(
    'color',
    {
      background: { app: '#0a0a0a' },
      accent: { default: '#0066ff' },
      danger: { default: '#ef4444' },
    },
    { decl: color },
  );

  api.create(
    'color',
    {
      accent: {
        subtle: `color-mix(in oklch, ${color.accent.default} 24%, ${color.background.app})`,
      },
      danger: { subtle: `color-mix(in oklch, ${color.danger.default} 12%, transparent)` },
    },
    { decl: color },
  );

  flushSync();
  const css = getRegisteredCss();
  expect(css).toContain(
    '--acme-color-accent-subtle: color-mix(in oklch, var(--acme-color-accent-default) 24%, var(--acme-color-background-app))',
  );
});
```

- [ ] **Step 5: Fix `layers.test.ts` if needed**

Search for `syntax:` inside `tokens.create` calls; migrate to `declare` + plain `create`.

- [ ] **Step 6: Run full package tests**

Run: `cd packages/typestyles && pnpm vitest run`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/typestyles/src/tokens.test.ts packages/typestyles/src/layers.test.ts
git commit -m "test: migrate tokens tests to schema-driven declare API"
```

---

### Task 6: Exports, docs, and changeset

**Files:**

- Modify: `packages/typestyles/src/index.ts`
- Modify: `docs/content/docs/tokens.md`
- Modify: `docs/content/docs/api-reference.md`
- Modify: `docs/content/docs/theming-patterns.md`
- Create: `.changeset/tokens-declare-schema.md`

- [ ] **Step 1: Update exports**

In `index.ts`:

- Export `TokenSchema`, `TokenSchemaLeaf`, `CreateTokenValues`, `DeclaredTokenRef`, `InferFromSchema`, `InferValuesFromSchema`.
- Export `getDeclaredNamespace` from `tokens.ts`.
- Remove `LooseTokenRef` export.

- [ ] **Step 2: Rewrite docs**

`docs/content/docs/tokens.md` — replace "Forward-referencing tokens" section with schema-driven examples from the spec (declare schema, partial merge create, optional `decl`, plain create without declare).

`docs/content/docs/api-reference.md` — update `tokens.declare` and `tokens.create` signatures; remove `LooseTokenRef`.

`docs/content/docs/theming-patterns.md` — update dependent-token `@property` example to use declare schema instead of inline `TokenDescriptor` on create.

- [ ] **Step 3: Add changeset**

Create `.changeset/tokens-declare-schema.md`:

```md
---
'typestyles': minor
---

`tokens.declare(namespace, schema)` now accepts a schema object, emits `@property` for `syntax` leaves, and infers ref types from the input shape. `tokens.create()` accepts plain values only (no inline `TokenDescriptor`); pass `{ decl }` for typed partial fills. Schema-less `declare()`, `declare<T>()`, and `LooseTokenRef` are removed.
```

- [ ] **Step 4: Run full verify**

Run: `pnpm verify`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/index.ts docs/content/docs/tokens.md docs/content/docs/api-reference.md docs/content/docs/theming-patterns.md .changeset/tokens-declare-schema.md
git commit -m "docs: schema-driven tokens.declare API"
```

---

## Spec Coverage Self-Review

| Spec requirement                                                    | Task                          |
| ------------------------------------------------------------------- | ----------------------------- |
| Schema-driven `declare()` emits `@property`                         | Task 2, 3                     |
| Infer types from schema input (no generic)                          | Task 1, 3                     |
| `declare()` optional                                                | Task 4 (plain create test)    |
| Partial merge `create()`                                            | Task 4                        |
| `decl` handle in create options                                     | Task 4                        |
| Namespace alignment compile + runtime                               | Task 1 types, Task 4          |
| `declare()` deep-merge                                              | Task 1, 3                     |
| Forward references preserved                                        | Task 5 end-to-end test        |
| Remove `LooseTokenRef`, `declare<T>()`, `TokenDescriptor` on create | Task 1, 3, 5, 6               |
| Dev validation matrix                                               | Task 3, 4                     |
| `nameTemplate` agreement                                            | Task 3 (keep existing checks) |
| Docs updated                                                        | Task 6                        |

No placeholder steps remain. Types and function names are consistent across tasks.
