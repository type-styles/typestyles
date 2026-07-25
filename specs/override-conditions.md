# Override conditions + mode-aware property values

Engine spec for V8 conditional component overrides (var-ui:
`conditional-component-overrides.md`).

## Features

### 1. `colorModes` instance config

```ts
createTypeStyles({
  scopeId: 'var-ui',
  colorModes: ['light', 'dark'],
});
```

When configured, `{ light, dark }` on CSS property values compiles as follows:

| Property kind                                                | Emission                       |
| ------------------------------------------------------------ | ------------------------------ |
| Color / image (`color`, `borderColor`, `backgroundImage`, …) | `light-dark(light, dark)`      |
| Structural (`padding`, `fontWeight`, `letterSpacing`, …)     | Dev warning — use `conditions` |

- Both mode keys required when using object form.
- Scalars apply to both modes (no `light-dark()` wrapper).
- v1: mode + breakpoint keys on the same property → dev warning.
- Resolution uses **used `color-scheme`** on the element tree (host responsibility).

### 2. `conditions` on override style blocks

```ts
type ConditionalOverride = {
  id?: string;
  when: ThemeCondition;
  style: VariantOptionStyle;
};

type StylableOverride = VariantOptionStyle & {
  conditions?: readonly ConditionalOverride[];
};
```

`conditions` is a reserved key on `base`, variant options, compound styles, and slot blocks.

Emission:

1. Unconditional keys (except `conditions`) → existing override rule.
2. Each `ConditionalOverride` → separate rule with same component selector, wrapped in compiled `when`.
3. Conditional rules emit after unconditional rules for the same target.
4. `when.or` → one rule per branch (theme mode parity).

### 3. Condition compile context

```ts
type ConditionCompileContext = {
  anchor: string; // component selector, e.g. `.button`
  scopePrefix?: string; // e.g. `.theme-acme` from `selectorPrefix`
};
```

Theme modes use `anchor: '.theme-{name}'` with no `scopePrefix`.

## Public API

- `colorModes` on `createStyles` / `createTypeStyles`
- `StylableOverride`, `ConditionalOverride` types
- `conditional(when, style, id?)` helper
- `tokens.when.*` builders (unchanged)

## Tests

See `override-conditions.test.ts` and `color-modes.test.ts`.
