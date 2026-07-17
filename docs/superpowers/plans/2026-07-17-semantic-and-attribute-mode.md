# Semantic Default + Attribute Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `mode: 'semantic'` a BEM-readable, dimension-namespaced template preset (including flat components), and make `mode: 'attribute'` design-system complete (kebab `data-*`, slots, semantic base/slot classes).

**Architecture:** Reuse the existing `bem`/`template` engine (`resolveClassNameTemplate` / `buildTemplateClassName` / `createTemplate*Component`). Add `SEMANTIC_TEMPLATE` that always includes the dimension in modifiers (and omits it for flat modifiers). Route semantic dimensioned/flat/slot through that path. Attribute mode shares the same template for base/slot/flat class names, adds kebab attribute helpers, and gains slot creators that return per-slot `ComponentAttrsResult`. HMR invalidation matches class families at boundaries so bare `button` does not wipe `buttongroup`.

**Tech Stack:** TypeScript, Vitest, pnpm workspace, Changesets. Full spec: `specs/semantic-and-attribute-mode.md`.

## Global Constraints

- Pre-1.0 breaking change for semantic class strings, compound strategy (no more `*-compound-N`), attribute base names, and kebab `data-*`. Ship as minor via Changesets — do **not** edit package versions or publish.
- `mode: 'bem'` and `mode: 'template'` public output must stay unchanged (including their flat hyphen naming).
- Attribute always emits a block class even if `base` is empty/omitted.
- Attribute slot attrs go on **every declared slot**, not root-only; no invented descendant selectors.
- Flat semantic/attribute: `card` + `card--elevated` (dimension undefined).
- Work on branch `feat/semantic-attribute-mode` (already checked out).
- Before final PR: `pnpm verify` must pass.
- Do not commit unrelated untracked files (`componentDx.ts`, `specs/styles-override-meta.md`, dirty `mcp-content.json` unless regenerated as part of docs task).

## File map

| File                                            | Responsibility                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `packages/typestyles/src/class-naming.ts`       | `SEMANTIC_TEMPLATE`, resolve routing, `emittedComponentClassPrefix`, export helpers |
| `packages/typestyles/src/sheet.ts`              | Boundary-aware HMR invalidation for block/`--`/`__` families                        |
| `packages/typestyles/src/component.ts`          | Semantic routing, flat semantic creator, attribute kebab + slots                    |
| `packages/typestyles/src/styles.ts`             | Attribute slot overloads; slot-aware `withUtils` transform                          |
| `packages/typestyles/src/types.ts`              | `SlotAttrsReturn` / related types; JSDoc link fixes                                 |
| `packages/typestyles/src/create-type-styles.ts` | Attribute overload surface grows with slots (via styles types)                      |
| `packages/cli/src/snapshot-classnames.ts`       | Semantic naming formula rewrite; mode union                                         |
| Docs + fixtures + changeset + `IMPROVEMENTS.md` | Migration surface                                                                   |

---

### Task 1: `SEMANTIC_TEMPLATE` + prefix + HMR boundaries

**Files:**

- Modify: `packages/typestyles/src/class-naming.ts`
- Modify: `packages/typestyles/src/sheet.ts`
- Test: `packages/typestyles/src/class-naming.test.ts`
- Test: `packages/typestyles/src/hmr.test.ts`

**Interfaces:**

- Produces: `SEMANTIC_TEMPLATE` (via `resolveClassNameTemplate` for `mode: 'semantic'`), updated `emittedComponentClassPrefix` for `semantic`/`attribute` → `${scope}${namespace}` (no trailing `-`), `matchesComponentClassFamily(selectorKey, blockPrefix)` used by HMR.
- Consumes: existing `buildTemplateClassName`, `ClassNameContext`.

- [ ] **Step 1: Write failing tests**

In `class-naming.test.ts`, add:

```ts
describe('SEMANTIC_TEMPLATE', () => {
  it('emits block, dimensioned modifier, flat modifier, slots, scoped', () => {
    const cfg = mergeClassNaming({ mode: 'semantic' });
    const t = resolveClassNameTemplate(cfg);
    expect(
      t({
        scope: '',
        namespace: 'button',
        element: undefined,
        dimension: undefined,
        modifier: undefined,
      }),
    ).toBe('button');
    expect(
      t({
        scope: '',
        namespace: 'button',
        element: undefined,
        dimension: 'intent',
        modifier: 'primary',
      }),
    ).toBe('button--intent-primary');
    expect(
      t({
        scope: '',
        namespace: 'card',
        element: undefined,
        dimension: undefined,
        modifier: 'elevated',
      }),
    ).toBe('card--elevated');
    expect(
      t({
        scope: '',
        namespace: 'dialog',
        element: undefined,
        dimension: undefined,
        modifier: undefined,
      }),
    ).toBe('dialog');
    expect(
      t({
        scope: '',
        namespace: 'dialog',
        element: 'content',
        dimension: undefined,
        modifier: undefined,
      }),
    ).toBe('dialog__content');
    expect(
      t({ scope: '', namespace: 'dialog', element: 'content', dimension: 'size', modifier: 'lg' }),
    ).toBe('dialog__content--size-lg');
    expect(
      t({
        scope: 'var-ui-',
        namespace: 'button',
        element: undefined,
        dimension: 'intent',
        modifier: 'primary',
      }),
    ).toBe('var-ui-button--intent-primary');
  });

  it('emittedComponentClassPrefix for semantic/attribute is bare block', () => {
    expect(emittedComponentClassPrefix(mergeClassNaming({ mode: 'semantic' }), 'button')).toBe(
      'button',
    );
    expect(emittedComponentClassPrefix(mergeClassNaming({ mode: 'attribute' }), 'button')).toBe(
      'button',
    );
    expect(
      emittedComponentClassPrefix(
        mergeClassNaming({ mode: 'semantic', scopeId: 'var-ui' }),
        'button',
      ),
    ).toBe('var-ui-button');
  });
});
```

In `hmr.test.ts`, add a case: insert `.button`, `.button--intent-primary`, `.button__icon`, `.buttongroup`; call `invalidateComponentNamespaceForDev('button', 'button')`; expect button family gone and `.buttongroup` retained.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm --filter typestyles exec vitest run src/class-naming.test.ts src/hmr.test.ts`

- [ ] **Step 3: Implement**

```ts
function semanticTemplate(ctx: ClassNameContext): string {
  const block = ctx.element
    ? `${ctx.scope}${ctx.namespace}__${ctx.element}`
    : `${ctx.scope}${ctx.namespace}`;
  if (!ctx.modifier) return block;
  return ctx.dimension ? `${block}--${ctx.dimension}-${ctx.modifier}` : `${block}--${ctx.modifier}`;
}

export function resolveClassNameTemplate(cfg: ClassNamingConfig): ClassNameTemplate {
  if (cfg.mode === 'semantic') return semanticTemplate;
  if (cfg.mode === 'bem') return bemTemplate;
  if (cfg.mode === 'template' && cfg.classNameTemplate) return cfg.classNameTemplate;
  throw new Error(/* update message to include semantic */);
}

// emittedComponentClassPrefix: semantic + attribute → `${semanticScopePrefix(cfg)}${namespace}` (like bem)

// sheet.ts invalidateComponentNamespaceForDev:
// if prefix lacks trailing `-`, match keys where after `.${prefix}` the next char is end, `--`, `__`, `[`, `:`, ` `, `{`, or end of selector token — NOT alphanumeric.
```

Export `emittedComponentClassPrefix` already exists — update its semantic/attribute branch. Document in `ClassNameContext` JSDoc that `modifier` may be set with `dimension` undefined (flat semantic).

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/class-naming.ts packages/typestyles/src/sheet.ts packages/typestyles/src/class-naming.test.ts packages/typestyles/src/hmr.test.ts
git commit -m "feat(typestyles): add SEMANTIC_TEMPLATE and boundary-aware HMR"
```

---

### Task 2: Route semantic dimensioned + slots through template creators

**Files:**

- Modify: `packages/typestyles/src/component.ts` (`createComponent` dispatch)
- Test: `packages/typestyles/src/component.test.ts` (update expectations)
- Keep green: `packages/typestyles/src/component-bem-variants.test.ts`, `component-template-variants.test.ts`

**Interfaces:**

- Consumes: Task 1 template resolution.
- Produces: semantic dimensioned/slot/multi-slot emit `button`, `button--intent-primary`, `dialog__content`, chained compounds (no `*-compound-N` in class string).

- [ ] **Step 1: Update failing expectations first (TDD)**

In `component.test.ts`, change dimensioned/slot/compound assertions from hyphen/`-compound-N` to template forms. Example:

```ts
expect(btn({ intent: 'primary', size: 'lg' })).toBe('cbtn cbtn--intent-primary cbtn--size-lg');
expect(btn({ intent: 'primary', size: 'lg' })).not.toContain('compound-0');
// CSS contains chained selector:
expect(getRegisteredCss()).toContain('.cbtn--intent-primary.cbtn--size-lg');
```

Also update scoped semantic expectations in `class-naming.test.ts` that still assert `my-ui-button-base`.

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement dispatch**

In `createComponent`, treat `mode === 'semantic'` like `bem`/`template` for dimensioned, slot-with-variants, and multi-slot branches (call `createTemplate*`). Do **not** yet change flat path (Task 3). Do **not** change attribute slots yet (Task 4–5).

Collision warning: `devWarnTemplateClassCollision` already runs on template path; for semantic, dimension is always in the name so collisions shouldn't fire for `intent/tone: primary` — add a regression test asserting distinct classes and no collision warning.

- [ ] **Step 4: Run component + bem + template tests — PASS**

```bash
pnpm --filter typestyles exec vitest run src/component.test.ts src/component-bem-variants.test.ts src/component-template-variants.test.ts src/class-naming.test.ts
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(typestyles): route semantic components through template engine"
```

---

### Task 3: Semantic + attribute flat naming (`card` / `card--elevated`)

**Files:**

- Modify: `packages/typestyles/src/component.ts` — add `createSemanticFlatComponent` (or extend flat dispatch for `semantic`/`attribute` only)
- Test: `packages/typestyles/src/component.test.ts` (flat cases)

**Interfaces:**

- Produces: flat under semantic/attribute → base block via template (`modifier` undefined); each non-base key → `buildTemplateClassName({ dimension: undefined, modifier: key })`.
- BEM/template flat still use `createFlatComponent` + `buildComponentClassName`.

- [ ] **Step 1: Write failing flat tests**

```ts
const styles = createStyles({ mode: 'semantic', scopeId: 'flat-sem' });
const card = styles.component('card', {
  base: { padding: '16px' },
  elevated: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
});
expect(card.base).toBe('flat-sem-card');
expect(card.elevated).toBe('flat-sem-card--elevated');
expect(card({ elevated: true })).toBe('flat-sem-card flat-sem-card--elevated');
```

Same shape under `mode: 'attribute'` for flat (still returns string, not attrs).

- [ ] **Step 2: FAIL → implement → PASS → commit**

```bash
git commit -m "feat(typestyles): semantic flat components use block--modifier names"
```

---

### Task 4: Attribute kebab names + semantic base class

**Files:**

- Modify: `packages/typestyles/src/component.ts` — `toDataAttributeName`, `attributeSelectorFor`, attrs emission, attribute base via `buildTemplateClassName` with semantic template (force semantic naming even though mode is `attribute` — either temporarily set mode for buildTemplateClassName via helper that calls `semanticTemplate` directly, or add `resolveClassNameTemplate` support for attribute returning `semanticTemplate`)
- Test: `packages/typestyles/src/component-attribute-variants.test.ts`

**Preferred helper:** export or private `buildSemanticTemplateClassName(cfg, input)` that always uses `semanticTemplate` + tracks, so attribute mode does not need `resolveClassNameTemplate(cfg)` for `attribute`.

Spec: attribute always emits block class even if `base` omitted.

- [ ] **Step 1: Failing tests**

```ts
// fontWeight → data-font-weight in CSS, attrs, props
// base className is `sbtn` not `sbtn-base` (adjust scopes in existing tests)
// boolean dimension with camelCase still presence-based on kebab name
// two dimensions that kebab-collide warn in dev
```

- [ ] **Step 2: Implement**

```ts
function toDataAttributeName(dimension: string): string {
  const kebab = dimension
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
  return `data-${kebab}`;
}

function warnKebabAttributeCollisions(namespace: string, dimensions: string[]): void {
  if (process.env.NODE_ENV === 'production') return;
  const seen = new Map<string, string>();
  for (const d of dimensions) {
    const attr = toDataAttributeName(d);
    const prev = seen.get(attr);
    if (prev && prev !== d) {
      console.error(
        `[typestyles] Dimensions "${prev}" and "${d}" both map to "${attr}" in "${namespace}".`,
      );
    }
    seen.set(attr, d);
  }
}
```

Wire into `attributeSelectorFor` and attrs/`props` keys. Emit base via semantic template (suffix no longer `'base'` through `buildComponentClassName`).

- [ ] **Step 3: PASS + commit**

```bash
git commit -m "feat(typestyles): kebab-case attribute variants and semantic base classes"
```

---

### Task 5: Attribute slots + types + withUtils slot recursion

**Files:**

- Modify: `packages/typestyles/src/component.ts` — remove attribute branch from `assertSlotsSupportedForMode`; add `createAttributeSlotComponent` + multi-slot via semantic template (multi-slot can reuse `createTemplateMultiSlotComponent` if mode attribute uses semantic template builder)
- Modify: `packages/typestyles/src/types.ts` — `SlotAttrsReturn`
- Modify: `packages/typestyles/src/styles.ts` — slot overloads on `AttributeComponentFn` / layered; fix `makeTransformComponentConfigWithUtils` to recurse slot maps
- Modify: `packages/typestyles/src/component-mode-shapes.typecheck.ts` — accept slots
- Test: new cases in `component-attribute-variants.test.ts`

**Interfaces:**

- Produces: `SlotAttrsReturn<Slots, V> = (selections?) => Record<Slots[number], ComponentAttrsResult>`
- Multi-slot without variants: still `MultiSlotReturn` (strings)

- [ ] **Step 1: Failing runtime + typecheck fixtures**

Dialog example from spec (classes + attrs on every slot + CSS local selectors). Compound with `:is(...)` on a slot. Multi-slot without variants returns strings only.

Flip typecheck:

```ts
export function _attributeComponentAcceptsSlots() {
  return attributeStyles.component('shape-dialog', {
    slots: ['root', 'trigger'],
    base: { root: { display: 'grid' } },
  });
}
```

Remove the old `@ts-expect-error` slots rejection test (or invert it).

- [ ] **Step 2: Implement creators**

For each slot: class via semantic template; fold per-slot variant styles as `&[data-…]` into that slot's style object; serialize `.${slotClass}`; runtime returns `createComponentAttrsResult(slotClass, attrs)` for every declared slot with the **same** attrs map.

- [ ] **Step 3: withUtils recursion**

When key is `base` and value looks like slot map (parent config has `slots`), map `apply` over each slot. Same for variant option objects and compound `style` objects under slots.

- [ ] **Step 4: PASS + commit**

```bash
git commit -m "feat(typestyles): attribute mode slots with per-slot attrs results"
```

---

### Task 6: CLI snapshot formula + eslint fixtures + in-repo renames

**Files:**

- Modify: `packages/cli/src/snapshot-classnames.ts` (+ tests)
- Modify: `packages/eslint-plugin/test/fixtures/**/.typestyles-public-classnames.json`
- Modify: build-runner fixtures, demos, docs examples asserting old names
- Fix JSDoc links pointing at deleted specs → `specs/semantic-and-attribute-mode.md` / `classname-template-mode.md`

**CLI formula for semantic (and treat attribute/bem/template appropriately):**

```ts
// styles.class → `${prefix}${name}`
// component base → `${prefix}${namespace}`  (no -base)
// dimensioned option → `${prefix}${namespace}--${dim}-${opt}`
// flat option → `${prefix}${namespace}--${key}`
// slot root → block; other slot → `${prefix}${namespace}__${slot}`
// slot option → `${block}--${dim}-${opt}`
// DO NOT emit compound-N public names
```

Extend `StylesBindingConfig.mode` to include `'attribute' | 'bem' | 'template'`. For hashed/compact/atomic keep returning null from semantic helper. For `bem`, emit BEM without dimension (existing BEM grammar). For `attribute`, public class names are base/slot only (no modifier classes).

- [ ] **Step 1: Update CLI tests → FAIL → implement → PASS**
- [ ] **Step 2: Regenerate/fix eslint fixtures**
- [ ] **Step 3: Fix remaining in-repo `*-base` / `intent-primary` string assertions in packages touched by runtime**
- [ ] **Step 4: Commit**

```bash
git commit -m "fix(cli): rewrite public classname snapshot formula for semantic templates"
```

---

### Task 7: Docs, IMPROVEMENTS, changeset, verify, PR

**Files:**

- `docs/content/docs/class-naming.md`, `components.md`, `theming-patterns.md` (+ any publishing/theming examples with old names)
- Stub redirects or pointer stubs for missing `attribute-driven-variants.md` / `bem-variant-mode.md` under `specs/` if still linked
- `IMPROVEMENTS.md` — add checked P6/P5 follow-on item
- `.changeset/*.md` — minor for `typestyles` (and patch for cli/eslint-plugin if public behavior changed)
- Regenerate `docs/netlify/functions/mcp-content.json` only if the docs build script in this repo does that as part of docs package — otherwise update docs sources and leave MCP regen to docs CI if that's the convention; check how docs sync works before mass-editing the JSON

- [ ] **Step 1: Docs updates** — semantic table, attribute slots, kebab, layers pairing; remove "slots not supported"
- [ ] **Step 2: Changeset**

```md
---
'typestyles': minor
'@typestyles/cli': patch
'@typestyles/eslint-plugin': patch
---

Breaking: semantic class names now use BEM-readable templates (`button`, `button--intent-primary`, `dialog__content`); compounds are chained modifiers (no `*-compound-N`). Attribute mode uses the same base/slot names, kebab-cases `data-*` attributes, and supports slots returning per-slot `{ className, attrs, props }`.
```

- [ ] **Step 3: `pnpm verify`**
- [ ] **Step 4: Push + `gh pr create`** with summary + test plan

---

## Spec coverage checklist

| Spec requirement                                                 | Task         |
| ---------------------------------------------------------------- | ------------ |
| SEMANTIC_TEMPLATE + resolve routing                              | 1            |
| HMR boundary matching / bare prefix                              | 1            |
| Dimensioned/slot semantic via template; compound strategy change | 2            |
| Flat `card` / `card--elevated`                                   | 3            |
| Attribute kebab + semantic base                                  | 4            |
| Attribute always emits block                                     | 4            |
| Attribute slots + types + withUtils                              | 5            |
| CLI formula rewrite + fixtures                                   | 6            |
| Docs, IMPROVEMENTS, changeset, verify, PR                        | 7            |
| BEM/template unchanged                                           | 2 regression |
| No version publish in PR                                         | 7            |

## Self-review notes

- No TBD placeholders in task steps.
- `buildSemanticTemplateClassName` named so attribute does not misuse `resolveClassNameTemplate`.
- Compound public snapshot omission is explicit in Task 6.
