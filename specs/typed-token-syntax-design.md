---
title: Syntax-typed design tokens (`SyntaxRef`, declare-only strictness)
status: approved
date: 2026-07-30
related: tokens-declare-schema-design.md, at-property.ts, types.ts
---

# Syntax-typed design tokens

## Problem

`tokens.declare()` already accepts a schema with `syntax: '<color>'` (and friends),
emits matching `@property` rules at runtime, and returns refs via `InferFromSchema`.
But TypeScript collapses every syntax leaf to the same `RegisteredPropertyRef`, and
`CSSProperties` accepts any `string | number` for every property.

The browser knows `--color-accent-default` is a `<color>`; TypeScript does not. A
color token can be assigned to `width` or a length token to `color` without a compile
error. Cross-token references in `tokens.create({ decl })` are not checked for syntax
compatibility either.

## Goals

- **Declare-only opt-in.** Strict typing applies only to namespaces declared with
  `tokens.declare()` (or `ctx.vars.declare()`) syntax leaves. Plain `tokens.create()`
  without `declare` stays exactly as today (`string` refs, no property checking).
- **`SyntaxRef<S>`** — refs from `declare()` syntax leaves carry their CSS syntax as a
  type parameter (`'<color>'`, `'<length>'`, …).
- **`create({ decl })` ref compatibility** — assigning a `SyntaxRef<'<length>'>` to a
  declared `<color>` path is a type error. Plain `string` / `number` literals remain
  valid on declared paths (the schema defines the slot; the author supplies the value).
- **`styles()` property checking** — when a style value is a `SyntaxRef`, it must be
  compatible with the target CSS property. Plain `string` / `number` literals are always
  allowed (escape hatch).
- **`tokens.use()` brand preservation** — rehydrated refs keep their `SyntaxRef<S>`
  type.
- **Syntax compatibility graph** — e.g. `<length>` assignable where `<length-percentage>`
  is expected, mirroring CSS Values rules at a practical subset.
- Align compile-time semantics with runtime `@property` registration already shipped via
  `tokens.declare()`.

## Non-goals

- **Literal string validation** — TypeScript does not prove `'#0066ff'` is a valid color
  or `'16px'` is a valid length. The schema declares the slot; literals are trusted.
- **Inference for undeclared tokens** — `tokens.create('space', { md: '16px' })` does not
  infer `SyntaxRef<'<length>'>`. No `declare`, no strictness.
- **Global strict mode flag** — strictness follows the value's type (`SyntaxRef` vs plain
  `string`), not a `createTypeStyles({ strict: true })` switch.
- **Shorthand properties in v1** — `background`, `border`, `padding`, etc. stay accepting
  plain `string` only. Longhands first.
- **Typed composition helpers in v1** — `css.colorMix()` returning `SyntaxRef<'<color>'>`
  is a follow-up. Raw template strings in `create()` stay `string`.
- **Migration shims** — no customers yet; change `InferFromSchema` and
  `RegisteredPropertyRef` in place.

## Relationship to `tokens-declare-schema-design.md`

That spec defines the `declare` / `create({ decl })` split, schema shapes, merge
semantics, and dev-mode path validation. This spec **extends** it by making
`InferFromSchema` syntax-aware and threading `SyntaxRef<S>` into `CSSProperties` and
`InferValuesFromSchema`. Runtime behavior of `declare()` and `create()` is unchanged.

| Schema leaf                | `@property` | Ref type (this spec)   | `create({ decl })` value type                                                    |
| -------------------------- | ----------- | ---------------------- | -------------------------------------------------------------------------------- |
| `{ syntax: '<color>', … }` | Yes         | `SyntaxRef<'<color>'>` | `string \| number \| SyntaxRef<'<color>'> \| CompatibleColorRef \| ModeAware<…>` |
| `true`                     | No          | `string`               | `string \| number`                                                               |

## Core types

### `CssSyntax`

Closed union of supported syntax strings, aligned with `atProperty` presets and
`atProperty.union()` output:

```ts
type CssSyntax =
  | '<color>'
  | '<number>'
  | '<integer>'
  | '<length>'
  | '<percentage>'
  | '<length-percentage>'
  | '<angle>'
  | '<time>'
  | '<resolution>'
  // unions from atProperty.union — stored as literal string types
  | '<length> | <percentage>';
```

Custom `syntax` strings outside this union fall back to `SyntaxRef<string>` (loose ref
typing — same as today's `RegisteredPropertyRef` for unknown syntax). v1 focuses on
preset syntaxes.

### `SyntaxRef<S>`

```ts
declare const SyntaxBrand: unique symbol;

export type SyntaxRef<S extends string = string> = {
  readonly name: `--${string}`;
  readonly var: CSSVarRef;
  readonly [SyntaxBrand]: S;
  toString(): string;
  valueOf(): string;
};
```

Produced only by:

- `tokens.declare()` proxy for schema leaves with `syntax`
- `ctx.vars.declare()` for component internal vars with `syntax`
- `styles.property.declare()` (aligned in a follow-up if not in v1)

`RegisteredPropertyRef` becomes a type alias for `SyntaxRef<string>` or is replaced
outright. Existing `{ name, var, toString, valueOf }` runtime shape is unchanged.

### Updated `InferFromSchema`

```ts
type InferFromSchema<S> = S extends { syntax: infer Syn extends string }
  ? Syn extends CssSyntax
    ? SyntaxRef<Syn>
    : SyntaxRef<string>
  : S extends true
    ? string
    : S extends Record<string, unknown>
      ? { readonly [K in keyof S]: InferFromSchema<S[K]> }
      : never;
```

### `InferValuesFromSchema` (create values)

```ts
type CreateValueForSyntax<S extends CssSyntax, M extends ColorModeMap> =
  | string
  | number
  | SyntaxRef<S>
  | SyntaxRef<CompatibleSyntax<S>>
  | ModeAwareCreateValue<S, M>;

type InferValuesFromSchema<S, M extends ColorModeMap = LightDarkColorModes> = S extends {
  syntax: infer Syn extends string;
}
  ? Syn extends CssSyntax
    ? CreateValueForSyntax<Syn, M>
    : string | number
  : S extends true
    ? string | number
    : S extends Record<string, unknown>
      ? { [K in keyof S]?: InferValuesFromSchema<S[K], M> }
      : never;
```

`ModeAwareCreateValue` — when `colorModes` is configured, `{ [mode]: string | number }`
leaves are valid on any syntax path (same as today's mode-aware token leaves).

**What is rejected in `create({ decl })`:**

```ts
tokens.create(
  'semantic',
  {
    buttonBg: space.md, // ✗ SyntaxRef<'<length>'> → <color> path
  },
  { decl: semantic },
);
```

**What is allowed:**

```ts
tokens.create(
  'color',
  {
    primary: '#0066ff', // plain string
    accent: color.primary, // SyntaxRef<'<color>'> → <color> path
    hero: { light: '#fff', dark: '#000' }, // mode-aware
  },
  { decl: color },
);
```

## Syntax compatibility

```ts
type CompatibleSyntax<Expected extends CssSyntax> = /* graph */;

// Examples (v1):
// CompatibleSyntax<'<length-percentage>'> includes '<length>' | '<percentage>'
// CompatibleSyntax<'<color>'> is only '<color>'
```

Used in both `CreateValueForSyntax` and `AcceptsForProperty`. The graph is a small
constant lookup table in `types.ts`, not computed from CSS grammar.

## Where checking happens

### 1. `tokens.create(namespace, values, { decl })`

When `decl` is passed, `values` is `DeepPartial<InferValuesFromSchema<TSchema>>`.
Each leaf checks ref compatibility; plain strings always pass.

Dev-mode runtime validation from `tokens-declare-schema-design.md` is unchanged (path
in schema, namespace alignment, etc.). This spec adds **compile-time** ref checks only.

### 2. `styles()` / `CSSProperties`

Extend csstype-mapped longhands to also accept compatible `SyntaxRef` values:

```ts
type AcceptsForProperty<P extends keyof CSS.Properties> =
  | CSS.Properties[string][P]  // existing csstype value (with CSSValue widening)
  | SyntaxRefForProperty<P>
  | string
  | number;

type SyntaxRefForProperty<P> = /* SyntaxRef<S> where S is in accepted set for P */;
```

The open `[key: string]` index (Issue #167) is preserved. Additional rule: when the
**key** is `ref.name` for a known `SyntaxRef<S>` or `ComponentInternalVarRef`, the
**value** must satisfy `CreateValueForSyntax<S, …>`.

```ts
{
  [v.bg.name]: color.primary,  // ✓ if v.bg is <color> and color.primary is <color>
  [v.bg.name]: space.md,       // ✗
}
```

### 3. `ctx.vars.declare()`

Same `InferFromSchema` / `InferValuesFromSchema` rules. Component style objects get
property checking when values are `SyntaxRef`.

### 4. `tokens.use(namespace | decl)`

Return type preserves `SyntaxRef<S>` from the declared schema or `CreatedTokenRef` —
no widening to `string`.

## v1 property coverage

Strict `SyntaxRef` checking on these longhands (non-exhaustive; expand in implementation
plan):

| Syntax                | Properties                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<color>`             | `color`, `backgroundColor`, `borderColor`, `borderTopColor`, `borderRightColor`, `borderBottomColor`, `borderLeftColor`, `outlineColor`, `caretColor`, `columnRuleColor`, `textDecorationColor`, `textEmphasisColor`                                                                                                                                                                                                                                                                                                                                                               |
| `<length-percentage>` | `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`, `top`, `right`, `bottom`, `left`, `inset`, `insetBlock`, `insetInline`, `gap`, `rowGap`, `columnGap`, `padding`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `paddingBlock`, `paddingInline`, `margin`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`, `marginBlock`, `marginInline`, `fontSize`, `lineHeight`, `letterSpacing`, `wordSpacing`, `textIndent`, `borderRadius`, `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius` |
| `<length>`            | `borderWidth`, `borderTopWidth`, `borderRightWidth`, `borderBottomWidth`, `borderLeftWidth`, `outlineWidth`                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `<number>`            | `opacity`, `flexGrow`, `flexShrink`, `zIndex`, `fontWeight`, `lineClamp`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `<angle>`             | Properties accepting angles where csstype exposes them distinctly                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `<time>`              | `transitionDuration`, `animationDuration`, `transitionDelay`, `animationDelay`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Properties not in the table: `SyntaxRef` values are still accepted if the ref's syntax
matches via a generic fallback; otherwise assignability falls through to `string`. When
in doubt, v1 errs toward accepting `string` on unlisted properties.

**Shorthands** (`background`, `border`, `padding`, `margin`, `font`, …): no `SyntaxRef`
narrowing in v1.

## Examples

### Declare + create + styles

```ts
const { styles, tokens } = createTypeStyles({ scopeId: 'app' });

const color = tokens.declare('color', {
  bg: { syntax: '<color>', inherits: false },
  text: { syntax: '<color>', inherits: false },
  accent: { syntax: '<color>', inherits: false },
});

const space = tokens.declare('space', {
  sm: { syntax: '<length>' },
  md: { syntax: '<length>' },
});

tokens.create(
  'color',
  {
    bg: '#0a0a0a',
    text: '#fafafa',
  },
  { decl: color },
);

tokens.create(
  'color',
  {
    accent: `color-mix(in oklch, ${color.bg} 60%, #0066ff)`,
  },
  { decl: color },
);

export const card = styles({
  backgroundColor: color.bg,
  color: color.text,
  padding: space.md,
  borderRadius: space.sm,
});

// Compile errors:
// card with `width: color.bg` — SyntaxRef<'<color>'> not assignable to width
// create with `accent: space.md` on a <color> path
```

### Semantic layer

```ts
const semantic = tokens.declare('semantic', {
  buttonBg: { syntax: '<color>', inherits: false },
  buttonPad: { syntax: '<length>' },
});

tokens.create(
  'semantic',
  {
    buttonBg: color.accent,
    buttonPad: space.md,
  },
  { decl: semantic },
);
```

### Component internal vars

```ts
styles.component('button', (ctx) => {
  const v = ctx.vars.declare({
    bg: { syntax: '<color>' },
    radius: { syntax: '<length>' },
  });

  return {
    base: {
      backgroundColor: v.bg,
      borderRadius: v.radius,
      [v.bg.name]: color.accent,
    },
  };
});
```

### Undeclared namespace (unchanged)

```ts
const space = tokens.create('space', { sm: '8px', md: '16px' });
// space.sm: string — no SyntaxRef, no property checking
styles({ padding: space.sm }); // always OK
```

## Implementation

| File                                                       | Change                                                                                                                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/typestyles/src/types.ts`                         | `CssSyntax`, `SyntaxRef`, `CompatibleSyntax`, `AcceptsForProperty`, update `InferFromSchema` / `InferValuesFromSchema`, alias or replace `RegisteredPropertyRef` |
| `packages/typestyles/src/types-syntax.ts` (optional)       | Property → accepted syntax map; compatibility graph (keeps `types.ts` smaller)                                                                                   |
| `packages/typestyles/src/tokens.ts`                        | Proxy return types already flow from `InferFromSchema` — verify runtime refs attach `SyntaxBrand` metadata if needed for runtime (likely type-only brand)        |
| `packages/typestyles/src/component-vars.ts`                | Align `ctx.vars.declare` inference                                                                                                                               |
| `packages/typestyles/src/tokens-ref-tree.type-tests.ts`    | Assert `SyntaxRef<'<color>'>` shapes                                                                                                                             |
| `packages/typestyles/src/typed-tokens.type-tests.ts`       | New — negative tests (`@ts-expect-error`) for wrong ref assignments                                                                                              |
| `packages/typestyles/src/computed-style-keys.typecheck.ts` | Extend if var-key assignability tests belong there                                                                                                               |

No changes to CSS serialization, `@property` emission, or build extraction — this is a
type-system-only feature. Runtime token proxies stay structurally identical.

### Type-only brand

`SyntaxBrand` is likely **type-only** (phantom property optional at runtime). Refs do
not need a runtime field; inference flows from `declare()` return types and
`CreatedTokenRef` generics. If `tokens.use()` cannot recover syntax without a schema
generic, require passing the `decl` handle or use `createTokens<Registry>()`.

### `CSSProperties` augmentation strategy

Prefer a mapped type overlay on standard longhands rather than replacing the entire
`CSSPropertiesBase`. Keep the open string index unchanged for Issue #167. Use a
conditional type helper:

```ts
type CSSPropertiesWithSyntax = CSSPropertiesBase & SyntaxAwareLonghands;
```

## Testing

| Area                | Cases                                                                      |
| ------------------- | -------------------------------------------------------------------------- |
| `InferFromSchema`   | `<color>` → `SyntaxRef<'<color>'>`, `true` → `string`, nested paths        |
| `create({ decl })`  | color ref on color path ✓; length ref on color path ✗ (`@ts-expect-error`) |
| `create({ decl })`  | plain string on syntax path ✓                                              |
| Mode-aware leaves   | `{ light, dark }` on `<color>` path ✓                                      |
| `styles()`          | `SyntaxRef<'<color>'>` on `color` ✓, on `width` ✗                          |
| `styles()`          | plain `'#fff'` on any property ✓                                           |
| `[ref.name]: value` | syntax-checked when key is `SyntaxRef.name`                                |
| `tokens.use(decl)`  | preserves `SyntaxRef<S>`                                                   |
| Compatibility       | `<length>` ref assignable to `width` (expects `<length-percentage>`)       |
| Undeclared `create` | `string` refs, no new errors                                               |
| `pnpm typecheck`    | all existing type tests still pass                                         |

## Documentation

Update `docs/content/docs/tokens.md`:

- New section: **Syntax-typed tokens** — declare-only opt-in, `SyntaxRef`, examples
- Clarify: plain `tokens.create` stays untyped; `declare` + `create({ decl })` enables
  strict ref checking
- Note: literals are trusted; strictness is ref-to-slot and ref-to-property compatibility

Update `docs/content/docs/api-reference.md` — `InferFromSchema` / `SyntaxRef` exports.

Cross-link `tokens-declare-schema-design.md` (internal) and theming patterns (`@property`
runtime behavior unchanged).

## Deferred

| Item                                              | Rationale                                   |
| ------------------------------------------------- | ------------------------------------------- |
| `css.colorMix()` → `SyntaxRef<'<color>'>`         | Needs helper design; raw strings OK in v1   |
| Typed `calc` / `clamp` return types               | Same                                        |
| Shorthand property narrowing                      | CSS shorthand grammar is too complex for v1 |
| `styles.property.declare()` alignment             | Follow-up with `ctx.vars` if not bundled    |
| Custom `syntax` string literals beyond presets    | Fall back to `SyntaxRef<string>`            |
| Stricter literal validation (`#${string}` colors) | Diminishing returns; schema is the contract |

## Open questions for the plan phase

- Split `types-syntax.ts` vs inline in `types.ts` — file size vs discoverability.
- Whether `CreatedTokenRef` should carry schema generic through `tokens.create` return
  for undeclared+declared mixed namespaces.
- Exact list of longhands for v1 — trim to ~20 if TS performance suffers.
- Export `CssSyntax`, `SyntaxRef`, `CompatibleSyntax` from package root or `typestyles/types` only.
