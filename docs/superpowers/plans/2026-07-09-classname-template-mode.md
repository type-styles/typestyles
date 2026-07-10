# Generic Classname Template (`mode: 'template'`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `mode: 'template'` to `ClassNamingMode`, letting `createStyles`/`createTypeStyles` accept a `classNameTemplate: (ctx) => string` hook that decides class names for dimensioned/slot `styles.component()` configs — and refactor `mode: 'bem'` to run on the same engine as a built-in preset instead of a parallel implementation.

**Architecture:** `class-naming.ts` gains `ClassNameContext`/`ClassNameTemplate` types, a private `bemTemplate` preset, `resolveClassNameTemplate(cfg)`, and `buildTemplateClassName(cfg, input)` — one function that resolves the effective template (BEM preset or user-supplied), calls it, validates/sanitizes in dev, and tracks the result in the existing class-name registry. `component.ts`'s three `createBem*Component` functions become `createTemplate*Component` functions that call `buildTemplateClassName` instead of the removed `buildBem*ClassName` trio, and dispatch on `mode === 'bem' || mode === 'template'`. `styles.ts` adds a runtime required-check for `classNameTemplate` under `mode: 'template'`, mirroring the existing runtime-only (not type-level) required-check for `layer` under `cascadeLayers`.

**Tech Stack:** TypeScript, Vitest, the existing `typestyles` monorepo package (`packages/typestyles`), pnpm workspace, Prettier/ESLint via husky pre-commit, Changesets for versioning.

## Global Constraints

- `mode: 'bem'`'s public behavior must not change — `component-bem-variants.test.ts` runs **unmodified** throughout this plan and must keep passing; it is the regression proof for the refactor.
- `classNameTemplate` is an instance-level `createStyles`/`createTypeStyles` setting only — no per-`styles.component()` override.
- Only dimensioned and slot/multi-slot `styles.component()` configs call `classNameTemplate`. `styles.class()` and flat (non-dimensioned) configs keep semantic-style naming, unaffected.
- `classNameTemplate` required-when-`mode:'template'` is enforced at **runtime only** (throws in `createStyles`), not via new TypeScript overloads — consistent with how `layer`-required-under-`cascadeLayers` already works in this codebase (`component.ts:297-305`, `styles.ts:107-114`).
- Direct commits to `main` are blocked by a pre-commit/branch-protection hook in this repo — work happens on the existing branch `spec/classname-template-mode` (already checked out), commit there.
- Full spec: `specs/classname-template-mode.md`.

---

## Task 1: Add the template engine to `class-naming.ts` (additive, BEM untouched)

**Files:**

- Modify: `packages/typestyles/src/class-naming.ts`
- Test: `packages/typestyles/src/class-naming.test.ts`

**Interfaces:**

- Produces: `ClassNameContext` (type), `ClassNameTemplate` (type), `TemplateClassNameInput` (type — `Omit<ClassNameContext, 'scope'>`), `resolveClassNameTemplate(cfg: ClassNamingConfig): ClassNameTemplate`, `buildTemplateClassName(cfg: ClassNamingConfig, input: TemplateClassNameInput): string`. All exported from `class-naming.ts` for Task 2/3 to consume.
- Consumes: existing `ClassNamingConfig`, `semanticScopePrefix` (private, same file), `ownerKey` (private, same file), `trackEmittedClassName` (already imported at the top of the file).

This task is purely additive — the existing `buildBemBlockClassName`/`buildBemElementClassName`/`buildBemModifierClassName` functions and `mode: 'bem'`'s existing behavior are untouched. It proves the new engine produces byte-identical output to the old BEM builders before anything in `component.ts` depends on it.

- [ ] **Step 1: Write the failing tests**

Add to `packages/typestyles/src/class-naming.test.ts`, after the existing `describe('BEM naming helpers', …)` block (currently ends at line 284):

```ts
describe('generic classname template engine (buildTemplateClassName / resolveClassNameTemplate)', () => {
  it('resolveClassNameTemplate returns the built-in BEM preset for mode: bem', () => {
    const cfg = mergeClassNaming({ mode: 'bem' });
    const template = resolveClassNameTemplate(cfg);
    expect(
      template({
        scope: '',
        namespace: 'button',
        element: undefined,
        dimension: undefined,
        modifier: undefined,
      }),
    ).toBe('button');
    expect(
      template({
        scope: '',
        namespace: 'button',
        element: undefined,
        dimension: 'variant',
        modifier: 'primary',
      }),
    ).toBe('button--primary');
    expect(
      template({
        scope: '',
        namespace: 'dialog',
        element: 'trigger',
        dimension: undefined,
        modifier: undefined,
      }),
    ).toBe('dialog__trigger');
    expect(
      template({
        scope: '',
        namespace: 'dialog',
        element: 'trigger',
        dimension: 'variant',
        modifier: 'primary',
      }),
    ).toBe('dialog__trigger--primary');
  });

  it('resolveClassNameTemplate returns the user-supplied classNameTemplate for mode: template', () => {
    const custom: ClassNameTemplate = (ctx) => `x-${ctx.namespace}`;
    const cfg = mergeClassNaming({ mode: 'template', classNameTemplate: custom });
    expect(resolveClassNameTemplate(cfg)).toBe(custom);
  });

  it('buildTemplateClassName matches the old BEM builders exactly (block, element, modifier, scoped)', () => {
    const cfg = mergeClassNaming({ mode: 'bem', scopeId: 'My UI' });
    expect(
      buildTemplateClassName(cfg, {
        namespace: 'button',
        element: undefined,
        dimension: undefined,
        modifier: undefined,
      }),
    ).toBe(buildBemBlockClassName(mergeClassNaming({ mode: 'bem', scopeId: 'My UI' }), 'button'));
    expect(
      buildTemplateClassName(cfg, {
        namespace: 'dialog',
        element: 'trigger',
        dimension: undefined,
        modifier: undefined,
      }),
    ).toBe(
      buildBemElementClassName(
        mergeClassNaming({ mode: 'bem', scopeId: 'My UI' }),
        'dialog',
        'trigger',
      ),
    );
    expect(
      buildTemplateClassName(cfg, {
        namespace: 'button',
        element: undefined,
        dimension: 'variant',
        modifier: 'primary',
      }),
    ).toBe('my-ui-button--primary');
  });

  it('buildTemplateClassName calls the user template with a fully-populated ClassNameContext, including scope', () => {
    const seen: unknown[] = [];
    const cfg = mergeClassNaming({
      mode: 'template',
      scopeId: 'acme',
      classNameTemplate: (ctx) => {
        seen.push(ctx);
        return 'ok';
      },
    });
    buildTemplateClassName(cfg, {
      namespace: 'button',
      element: 'icon',
      dimension: 'intent',
      modifier: 'primary',
    });
    expect(seen).toEqual([
      {
        scope: 'acme-',
        namespace: 'button',
        element: 'icon',
        dimension: 'intent',
        modifier: 'primary',
      },
    ]);
  });

  it('throws in dev when the template returns an invalid CSS class name', () => {
    const cfg = mergeClassNaming({
      mode: 'template',
      classNameTemplate: () => '1-not-a-valid-start',
    });
    expect(() =>
      buildTemplateClassName(cfg, {
        namespace: 'button',
        element: undefined,
        dimension: undefined,
        modifier: undefined,
      }),
    ).toThrow(/invalid CSS class name/);
  });

  it('accepts template output starting with a hyphen (valid CSS identifier)', () => {
    const cfg = mergeClassNaming({
      mode: 'template',
      classNameTemplate: () => '-webkit-style-button',
    });
    expect(() =>
      buildTemplateClassName(cfg, {
        namespace: 'button',
        element: undefined,
        dimension: undefined,
        modifier: undefined,
      }),
    ).not.toThrow();
  });
});
```

Update the file's import block (currently lines 2-8) to add the new names:

```ts
import {
  fileScopeId,
  mergeClassNaming,
  buildBemBlockClassName,
  buildBemElementClassName,
  buildBemModifierClassName,
  resolveClassNameTemplate,
  buildTemplateClassName,
  type ClassNameTemplate,
} from './class-naming';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter typestyles test -- class-naming.test.ts`
Expected: FAIL — `resolveClassNameTemplate`/`buildTemplateClassName`/`ClassNameTemplate` are not exported from `./class-naming` yet.

- [ ] **Step 3: Implement the template engine in `class-naming.ts`**

Add `'template'` to the `ClassNamingMode` union (currently line 22):

```ts
export type ClassNamingMode =
  | 'semantic'
  | 'hashed'
  | 'compact'
  | 'atomic'
  | 'attribute'
  | 'bem'
  | 'template';
```

Extend the leading doc comment above it (currently lines 5-21) by adding a bullet after the existing `bem` bullet:

```ts
 * - `template` — like `bem`, but the block/element/modifier class name is decided by a
 *   user-supplied `classNameTemplate: (ctx) => string` instead of a fixed convention.
 *   `mode: 'bem'` is itself implemented as a built-in preset of this same mechanism. See
 *   `specs/classname-template-mode.md`. `styles.class()` and flat configs behave like `semantic`.
```

Add `classNameTemplate` to `ClassNamingConfig` (currently ends at line 47), after the `breakpoints` field:

```ts
  /**
   * Required when `mode: 'template'`. Decides the class name for every base/element and
   * modifier class a dimensioned or slot `styles.component()` call emits. Not called for
   * `styles.class()` or flat (non-dimensioned) configs — those stay semantic-style. See
   * `ClassNameContext` and `specs/classname-template-mode.md`.
   */
  classNameTemplate?: ClassNameTemplate;
```

Add the new types and engine functions after `buildBemModifierClassName` (currently ends at line 258), replacing nothing yet:

```ts
/**
 * Passed to `classNameTemplate` for every base/element/modifier class name a `mode: 'bem'` or
 * `mode: 'template'` dimensioned/slot `styles.component()` call needs to emit. One call per
 * class — `dimension`/`modifier` are both `undefined` when naming a base/block/element class
 * itself, both set when naming a modifier class.
 */
export type ClassNameContext = {
  /** Sanitized scope prefix from `scopeId` (already includes a trailing `-`), `''` when unscoped. */
  scope: string;
  /** `styles.component()` namespace, e.g. `'button'`. */
  namespace: string;
  /** Slot name for slot/multi-slot components (`'root'` is passed as `undefined`, matching BEM's root→block rule); `undefined` for non-slot components. */
  element: string | undefined;
  /** Variant dimension name, e.g. `'intent'`; `undefined` when naming the base/block/element class itself. */
  dimension: string | undefined;
  /** Variant option value, e.g. `'primary'`; `undefined` when naming the base/block/element class itself. */
  modifier: string | undefined;
};

export type ClassNameTemplate = (ctx: ClassNameContext) => string;

/** `buildTemplateClassName`'s caller supplies everything except `scope` — it's filled in from `cfg`. */
export type TemplateClassNameInput = Omit<ClassNameContext, 'scope'>;

/** Built-in preset used internally when `mode: 'bem'`. Reference implementation for `mode: 'template'` users. */
function bemTemplate(ctx: ClassNameContext): string {
  const base = ctx.element
    ? `${ctx.scope}${ctx.namespace}__${ctx.element}`
    : `${ctx.scope}${ctx.namespace}`;
  return ctx.modifier ? `${base}--${ctx.modifier}` : base;
}

/** Resolves the effective template for `mode: 'bem'` (built-in) or `mode: 'template'` (user-supplied). */
export function resolveClassNameTemplate(cfg: ClassNamingConfig): ClassNameTemplate {
  if (cfg.mode === 'bem') return bemTemplate;
  if (cfg.mode === 'template' && cfg.classNameTemplate) return cfg.classNameTemplate;
  throw new Error(
    `[typestyles] resolveClassNameTemplate called for mode "${cfg.mode}" — only "bem" and "template" build class names via a template.`,
  );
}

const VALID_CLASS_NAME = /^-?[a-zA-Z_][a-zA-Z0-9_-]*$/;

/**
 * `mode: 'bem'` / `mode: 'template'` class-name builder — replaces the old `buildBemBlockClassName`/
 * `buildBemElementClassName`/`buildBemModifierClassName` trio with one call per class. Resolves the
 * effective template, calls it with a fully-populated `ClassNameContext`, validates the output is a
 * legal CSS identifier in dev, and tracks it in the emitted-class registry like every other builder.
 */
export function buildTemplateClassName(
  cfg: ClassNamingConfig,
  input: TemplateClassNameInput,
): string {
  const ctx: ClassNameContext = { scope: semanticScopePrefix(cfg), ...input };
  const template = resolveClassNameTemplate(cfg);
  const className = template(ctx);
  if (process.env.NODE_ENV !== 'production' && !VALID_CLASS_NAME.test(className)) {
    throw new Error(
      `[typestyles] classNameTemplate returned an invalid CSS class name "${className}" for context ` +
        `${JSON.stringify(ctx)}. Class names must match ${VALID_CLASS_NAME}.`,
    );
  }
  trackEmittedClassName(className, ownerKey(cfg, ctx.namespace));
  return className;
}
```

Also update these three functions to treat `template` like `semantic`/`attribute`/`bem` (flat/`styles.class()` fallback, per the scope decision in the spec) — each currently has a condition on lines 157, 168, and 199 respectively:

```ts
// emittedClassName (was: cfg.mode === 'semantic' || cfg.mode === 'attribute' || cfg.mode === 'bem')
if (
  cfg.mode === 'semantic' ||
  cfg.mode === 'attribute' ||
  cfg.mode === 'bem' ||
  cfg.mode === 'template'
)
  return `${semanticScopePrefix(cfg)}${name}`;
```

```ts
// buildSingleClassName (was: cfg.mode === 'semantic' || cfg.mode === 'attribute' || cfg.mode === 'bem')
if (
  cfg.mode === 'semantic' ||
  cfg.mode === 'attribute' ||
  cfg.mode === 'bem' ||
  cfg.mode === 'template'
) {
  const className = `${semanticScopePrefix(cfg)}${name}`;
  trackEmittedClassName(className, ownerKey(cfg, name));
  return className;
}
```

```ts
// buildComponentClassName (was: cfg.mode === 'semantic' || cfg.mode === 'attribute' || cfg.mode === 'bem')
if (
  cfg.mode === 'semantic' ||
  cfg.mode === 'attribute' ||
  cfg.mode === 'bem' ||
  cfg.mode === 'template'
) {
  const className = `${semanticScopePrefix(cfg)}${namespace}-${suffix}`;
  trackEmittedClassName(className, ownerKey(cfg, namespace));
  return className;
}
```

`emittedComponentClassPrefix` needs no code change — `template` mode isn't matched by any of its explicit branches (`bem`/`semantic`/`attribute`/`hashed`), so it already falls through to the existing `return null;` at the end (same bucket as `compact`/`atomic`). Update only its doc comment (currently lines 131-135) to mention this:

```ts
/**
 * The emitted class-name prefix shared by every class a `styles.component(namespace, …)`
 * call produces under this naming config (no leading dot). `null` in `compact`/`atomic`/
 * `template` mode — hash-only names have no per-namespace prefix, and an arbitrary
 * `classNameTemplate` function's output prefix isn't predictable without calling it; atomic
 * mode also omits a shared variant prefix.
 */
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter typestyles test -- class-naming.test.ts`
Expected: PASS — all new tests plus every pre-existing test in the file (including the untouched "BEM naming helpers" block).

- [ ] **Step 5: Commit**

```bash
git add packages/typestyles/src/class-naming.ts packages/typestyles/src/class-naming.test.ts
git commit -m "feat: add generic classname template engine (class-naming.ts)"
```

---

## Task 2: Refactor `component.ts` onto the template engine; remove old BEM builders

**Files:**

- Modify: `packages/typestyles/src/component.ts`
- Modify: `packages/typestyles/src/class-naming.ts` (remove `buildBemBlockClassName`/`buildBemElementClassName`/`buildBemModifierClassName`)
- Modify: `packages/typestyles/src/class-naming.test.ts` (remove the now-dead "BEM naming helpers" describe block and its imports)
- Test: `packages/typestyles/src/component-bem-variants.test.ts` (run **unmodified** — this is the regression check)

**Interfaces:**

- Consumes: `buildTemplateClassName`, `TemplateClassNameInput` from Task 1.
- Produces: `createTemplateDimensionedComponent`, `createTemplateSlotComponent`, `createTemplateMultiSlotComponent`, `templateSlotClassName`, `devWarnTemplateClassCollision` (all module-private to `component.ts`, renamed from their `*Bem*`/`bem*` predecessors) — consumed by Task 3's dispatch (already wired here) and exercised by Task 4's tests.

This is the highest-risk task in the plan: it removes the old BEM-only code path. `component-bem-variants.test.ts` staying green with **zero edits** is the proof the refactor is behavior-preserving.

- [ ] **Step 1: Update `component.ts`'s import block**

Replace (currently lines 24-30):

```ts
import {
  emittedComponentClassPrefix,
  buildBemBlockClassName,
  buildBemElementClassName,
  buildBemModifierClassName,
  type ClassNamingConfig,
} from './class-naming';
```

with:

```ts
import {
  emittedComponentClassPrefix,
  buildTemplateClassName,
  type ClassNamingConfig,
  type ClassNameContext,
} from './class-naming';
```

- [ ] **Step 2: Rename and rewrite the collision-warning helper**

Replace `devWarnBemModifierCollision` (currently lines 72-94) with:

```ts
/**
 * `mode: 'bem'`/`mode: 'template'` have no dimension namespace in their modifier classes by
 * default, so two different dimensions producing the same option string can collide on the
 * identical class name — warn rather than let one silently override the other. `seenBy` is
 * scoped per component (or per slot, for slot components). Shared by both modes — not
 * BEM-specific despite the historical name.
 */
function devWarnTemplateClassCollision(
  scopeLabel: string,
  className: string,
  dimension: string,
  seenBy: Map<string, string>,
): void {
  if (process.env.NODE_ENV === 'production') return;
  const owner = seenBy.get(className);
  if (owner && owner !== dimension) {
    console.error(
      `[typestyles] Class "${className}" is produced by both dimension "${owner}" ` +
        `and dimension "${dimension}" in "${scopeLabel}" — one will silently override the ` +
        `other's styles in the cascade. Choose non-colliding option names, or use \`dimension\` ` +
        `in your classNameTemplate to disambiguate.`,
    );
    return;
  }
  seenBy.set(className, dimension);
}
```

- [ ] **Step 3: Replace `createBemDimensionedComponent` with `createTemplateDimensionedComponent`**

Replace the entire function (currently lines 569-688):

```ts
// ---------------------------------------------------------------------------
// Dimensioned variant component — template engine (mode: 'bem' | 'template'; see specs/classname-template-mode.md)
// ---------------------------------------------------------------------------

function createTemplateDimensionedComponent<V extends VariantDefinitions>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: ComponentConfig<V>,
  layer?: string,
): ComponentReturn<V> {
  const { base, variants = {} as V, compoundVariants = [], defaultVariants = {} } = config;

  const rules: Array<{ key: string; css: string }> = [];
  const classMap: Record<string, string> = {};

  const blockClassName = buildTemplateClassName(classNaming, {
    namespace,
    element: undefined,
    dimension: undefined,
    modifier: undefined,
  });
  const hasBase = base != null;
  if (hasBase) {
    classMap['base'] = blockClassName;
    rules.push(
      ...serializeStyle(`.${blockClassName}`, base as CSSProperties, {
        breakpoints: classNaming.breakpoints,
      }),
    );
  }

  const variantClassByKey: Record<string, string> = {};
  const seenModifierClassNames = new Map<string, string>();
  const propertiesByModifierClassName: Record<string, unknown> = {};
  for (const [dimension, options] of Object.entries(variants)) {
    for (const [option, properties] of Object.entries(options as Record<string, CSSProperties>)) {
      const key = `${dimension}-${option}`;
      const modifierClassName = buildTemplateClassName(classNaming, {
        namespace,
        element: undefined,
        dimension,
        modifier: option,
      });
      devWarnTemplateClassCollision(
        namespace,
        modifierClassName,
        dimension,
        seenModifierClassNames,
      );
      variantClassByKey[key] = modifierClassName;
      classMap[key] = modifierClassName;
      mergeIntoSelectorKey(propertiesByModifierClassName, modifierClassName, properties);
    }
  }
  for (const [modifierClassName, properties] of Object.entries(propertiesByModifierClassName)) {
    rules.push(
      ...serializeStyle(`.${modifierClassName}`, properties as CSSProperties, {
        breakpoints: classNaming.breakpoints,
      }),
    );
  }

  (compoundVariants as Array<{ variants: Record<string, unknown>; style: CSSProperties }>).forEach(
    (cv) => {
      const selectorSuffix = Object.entries(cv.variants)
        .map(([dimension, expected]) => {
          const optionMap = (variants as Record<string, Record<string, CSSProperties>>)[dimension];
          if (!optionMap) return '';
          const values = Array.isArray(expected) ? expected : [expected];
          const classSelectors = values
            .map((value) => normalizeSelection(value, optionMap))
            .filter((selected): selected is string => selected != null)
            .map((selected) => `.${variantClassByKey[`${dimension}-${selected}`]}`);
          if (classSelectors.length === 0) return '';
          return classSelectors.length === 1
            ? classSelectors[0]
            : `:is(${classSelectors.join(', ')})`;
        })
        .join('');

      if (!selectorSuffix) return;
      rules.push(
        ...serializeStyle(selectorSuffix, cv.style, { breakpoints: classNaming.breakpoints }),
      );
    },
  );

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  const selectorFn = (selections: Record<string, unknown> = {}): string => {
    const classes: string[] = [];
    if (hasBase) classes.push(blockClassName);

    devWarnUnknownVariantDimensions(namespace, selections, variants as Record<string, unknown>);

    const resolved: Record<string, unknown> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, CSSProperties>;
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      const effective = explicit ?? fallback;
      const selected = normalizeSelection(effective, optionMap);
      resolved[dimension] = selected;

      devWarnInvalidDimensionOption(
        namespace,
        dimension,
        effective,
        selected,
        optionMap as Record<string, unknown>,
      );
    }

    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, CSSProperties>;
      const selected = normalizeSelection(resolved[dimension], optionMap);
      if (selected != null) {
        const cn = variantClassByKey[`${dimension}-${selected}`];
        if (cn) classes.push(cn);
      }
    }

    return classes.join(' ');
  };

  const result = makeCallableObject(
    (...args: unknown[]) => selectorFn(args[0] as Record<string, unknown> | undefined),
    classMap,
  ) as ComponentReturn<V>;

  attachComposeMeta(result, Object.keys(variants));

  return result;
}
```

- [ ] **Step 4: Replace `bemSlotClassName`, `createBemMultiSlotComponent`, `createBemSlotComponent`**

Replace `bemSlotClassName` (currently lines 954-958):

```ts
function templateSlotClassName(
  classNaming: ClassNamingConfig,
  namespace: string,
  slot: string,
): string {
  return buildTemplateClassName(classNaming, {
    namespace,
    element: slot === 'root' ? undefined : slot,
    dimension: undefined,
    modifier: undefined,
  });
}
```

Replace `createBemMultiSlotComponent` (currently lines 960-993) with `createTemplateMultiSlotComponent`:

```ts
function createTemplateMultiSlotComponent<Slots extends readonly string[]>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: MultiSlotConfig<Slots>,
  layer?: string,
): MultiSlotReturn<Slots> {
  const { slots } = config;

  const rules: Array<{ key: string; css: string }> = [];
  const slotClassMap: Record<string, string> = {};

  for (const slot of slots as readonly string[]) {
    const className = templateSlotClassName(classNaming, namespace, slot);
    slotClassMap[slot] = className;
    const properties = (config as Record<string, CSSProperties | undefined>)[slot];
    if (properties) {
      rules.push(
        ...serializeStyle(`.${className}`, properties, { breakpoints: classNaming.breakpoints }),
      );
    }
  }

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  const selectorFn = (): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const slot of slots as readonly string[]) {
      result[slot] = slotClassMap[slot] || '';
    }
    return result;
  };

  return makeMultiSlotObject(selectorFn, slotClassMap) as MultiSlotReturn<Slots>;
}
```

Replace `createBemSlotComponent` (currently lines 999-1139) with `createTemplateSlotComponent`:

```ts
function createTemplateSlotComponent<
  Slots extends readonly string[],
  V extends SlotVariantDefinitions<Slots[number]>,
>(
  classNaming: ClassNamingConfig,
  namespace: string,
  config: SlotComponentConfig<Slots, V>,
  layer?: string,
): SlotComponentFunction<Slots, V> {
  const {
    slots,
    base = {},
    variants = {} as V,
    compoundVariants = [],
    defaultVariants = {},
  } = config;

  const rules: Array<{ key: string; css: string }> = [];
  const baseClassBySlot: Record<string, string> = {};
  for (const slot of slots as readonly string[]) {
    const className = templateSlotClassName(classNaming, namespace, slot);
    baseClassBySlot[slot] = className;
    const properties = (base as Record<string, CSSProperties>)[slot];
    if (properties) {
      rules.push(
        ...serializeStyle(`.${className}`, properties, { breakpoints: classNaming.breakpoints }),
      );
    }
  }

  const variantClassByKey: Record<string, string> = {};
  const seenModifierClassNamesBySlot = new Map<string, Map<string, string>>();
  const propertiesByModifierClassName: Record<string, CSSProperties> = {};
  for (const [dimension, options] of Object.entries(variants)) {
    for (const [option, slotStyles] of Object.entries(
      options as Record<string, Record<string, CSSProperties>>,
    )) {
      for (const [slot, properties] of Object.entries(slotStyles)) {
        const slotClassName = baseClassBySlot[slot];
        if (!slotClassName) continue;
        const modifierClassName = buildTemplateClassName(classNaming, {
          namespace,
          element: slot === 'root' ? undefined : slot,
          dimension,
          modifier: option,
        });
        let seenForSlot = seenModifierClassNamesBySlot.get(slot);
        if (!seenForSlot) {
          seenForSlot = new Map<string, string>();
          seenModifierClassNamesBySlot.set(slot, seenForSlot);
        }
        devWarnTemplateClassCollision(
          `${namespace}__${slot}`,
          modifierClassName,
          dimension,
          seenForSlot,
        );
        variantClassByKey[`${slot}-${dimension}-${option}`] = modifierClassName;
        mergeIntoSelectorKey(propertiesByModifierClassName, modifierClassName, properties);
      }
    }
  }
  for (const [modifierClassName, properties] of Object.entries(propertiesByModifierClassName)) {
    rules.push(
      ...serializeStyle(`.${modifierClassName}`, properties, {
        breakpoints: classNaming.breakpoints,
      }),
    );
  }

  (
    compoundVariants as Array<{
      variants: Record<string, unknown>;
      style: Record<string, CSSProperties>;
    }>
  ).forEach((cv) => {
    for (const [slot, properties] of Object.entries(cv.style)) {
      const selectorSuffix = Object.entries(cv.variants)
        .map(([dimension, expected]) => {
          const options = (variants as Record<string, Record<string, unknown>>)[dimension];
          if (!options) return '';
          const values = Array.isArray(expected) ? expected : [expected];
          const classSelectors = values
            .map((value) => normalizeSelection(value, options))
            .filter((selected): selected is string => selected != null)
            .map((selected) => variantClassByKey[`${slot}-${dimension}-${selected}`])
            .filter((cn): cn is string => cn != null)
            .map((cn) => `.${cn}`);
          if (classSelectors.length === 0) return '';
          return classSelectors.length === 1
            ? classSelectors[0]
            : `:is(${classSelectors.join(', ')})`;
        })
        .join('');

      if (!selectorSuffix) continue;
      rules.push(
        ...serializeStyle(selectorSuffix, properties, { breakpoints: classNaming.breakpoints }),
      );
    }
  });

  insertRules(finalizeComponentRules(classNaming, layer, rules));

  return ((selections: Record<string, unknown> = {}) => {
    const classes = Object.fromEntries(
      (slots as readonly string[]).map((slot) => [slot, [baseClassBySlot[slot]] as string[]]),
    ) as Record<string, string[]>;

    devWarnUnknownVariantDimensions(namespace, selections, variants as Record<string, unknown>);

    const resolvedSelections: Record<string, unknown> = {};
    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, unknown>;
      const explicit = selections[dimension];
      const fallback = (defaultVariants as Record<string, unknown>)[dimension];
      const effective = explicit ?? fallback;
      const selected = normalizeSelection(effective, optionMap);
      resolvedSelections[dimension] = selected;

      devWarnInvalidDimensionOption(namespace, dimension, effective, selected, optionMap);
    }

    for (const [dimension, options] of Object.entries(variants)) {
      const optionMap = options as Record<string, Record<string, CSSProperties>>;
      const selected = normalizeSelection(resolvedSelections[dimension], optionMap);
      if (selected == null) continue;
      const slotStyles = optionMap[selected];
      if (!slotStyles) continue;

      for (const slot of Object.keys(slotStyles)) {
        const cn = variantClassByKey[`${slot}-${dimension}-${selected}`];
        if (cn && classes[slot]) classes[slot].push(cn);
      }
    }

    return Object.fromEntries(
      (slots as readonly string[]).map((slot) => [slot, classes[slot].join(' ')]),
    ) as Record<Slots[number], string>;
  }) as SlotComponentFunction<Slots, V>;
}
```

- [ ] **Step 5: Update the three dispatch branches in `createComponent`**

In the `createComponent` function body, change each `if (classNaming.mode === 'bem')` to also match `template`, and update the callee names:

Multi-slot branch (currently around line 311):

```ts
if (classNaming.mode === 'bem' || classNaming.mode === 'template') {
  return createTemplateMultiSlotComponent(
    classNaming,
    namespace,
    resolved as MultiSlotConfig<readonly string[]>,
    layer,
  );
}
```

Slot-with-variants branch (currently around line 329):

```ts
if (classNaming.mode === 'bem' || classNaming.mode === 'template') {
  return createTemplateSlotComponent(
    classNaming,
    namespace,
    resolved as SlotComponentConfig<readonly string[], SlotVariantDefinitions<string>>,
    layer,
  );
}
```

Dimensioned branch (currently around line 350):

```ts
if (classNaming.mode === 'attribute') {
  return createAttributeDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
}
if (classNaming.mode === 'bem' || classNaming.mode === 'template') {
  return createTemplateDimensionedComponent(classNaming, namespace, dimensionedConfig, layer);
}
```

- [ ] **Step 6: Remove the old BEM builders from `class-naming.ts`**

Delete `buildBemBlockClassName`, `buildBemElementClassName`, and `buildBemModifierClassName` (the section currently at lines 220-258, including its leading comment block) from `packages/typestyles/src/class-naming.ts` — they're fully superseded by `buildTemplateClassName`.

- [ ] **Step 7: Update `class-naming.test.ts` to drop the dead imports and old describe block**

Remove `buildBemBlockClassName, buildBemElementClassName, buildBemModifierClassName,` from the import block (added back temporarily in Task 1 Step 1 alongside the new names — now delete just those three):

```ts
import {
  fileScopeId,
  mergeClassNaming,
  resolveClassNameTemplate,
  buildTemplateClassName,
  type ClassNameTemplate,
} from './class-naming';
```

Delete the entire `describe('BEM naming helpers', …)` block (its assertions are superseded by Task 1's `buildTemplateClassName matches the old BEM builders exactly` test, which now can't reference the deleted functions directly — replace that one test's right-hand-side comparisons with hardcoded expected strings instead of calling the removed builders):

```ts
it('buildTemplateClassName matches BEM output exactly (block, element, modifier, scoped)', () => {
  const cfg = mergeClassNaming({ mode: 'bem', scopeId: 'My UI' });
  expect(
    buildTemplateClassName(cfg, {
      namespace: 'button',
      element: undefined,
      dimension: undefined,
      modifier: undefined,
    }),
  ).toBe('my-ui-button');
  expect(
    buildTemplateClassName(cfg, {
      namespace: 'dialog',
      element: 'trigger',
      dimension: undefined,
      modifier: undefined,
    }),
  ).toBe('my-ui-dialog__trigger');
  expect(
    buildTemplateClassName(cfg, {
      namespace: 'button',
      element: undefined,
      dimension: 'variant',
      modifier: 'primary',
    }),
  ).toBe('my-ui-button--primary');
});
```

- [ ] **Step 8: Run the full test suite**

Run: `pnpm --filter typestyles test`
Expected: PASS, including `component-bem-variants.test.ts` **unmodified** and `class-naming.test.ts`.

- [ ] **Step 9: Typecheck**

Run: `pnpm --filter typestyles typecheck`
Expected: PASS — no dangling references to the removed `buildBem*ClassName` functions anywhere in the package.

- [ ] **Step 10: Commit**

```bash
git add packages/typestyles/src/component.ts packages/typestyles/src/class-naming.ts packages/typestyles/src/class-naming.test.ts
git commit -m "refactor: rebuild mode: 'bem' on the generic template engine"
```

---

## Task 3: Wire `mode: 'template'` end-to-end through `createStyles`

**Files:**

- Modify: `packages/typestyles/src/styles.ts`
- Modify: `packages/typestyles/src/index.ts`
- Test: `packages/typestyles/src/styles.test.ts`

**Interfaces:**

- Consumes: `ClassNamingConfig.classNameTemplate` (Task 1), `mergeClassNaming` (existing), `createComponent` dispatch on `mode === 'template'` (already wired in Task 2).
- Produces: runtime validation in `createStyles` — every later task can assume `mode: 'template'` without `classNameTemplate` never reaches `component.ts`.

- [ ] **Step 1: Write the failing tests**

Add to `packages/typestyles/src/styles.test.ts`:

```ts
describe('mode: template', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('throws when mode: template is set without classNameTemplate', () => {
    expect(() => createStyles({ mode: 'template' } as never)).toThrow(
      /classNameTemplate.*is required/,
    );
  });

  it('does not throw when mode: template is paired with classNameTemplate', () => {
    expect(() =>
      createStyles({ mode: 'template', classNameTemplate: (ctx) => `x-${ctx.namespace}` }),
    ).not.toThrow();
  });

  it('uses classNameTemplate for dimensioned styles.component(), unaffected for styles.class()', () => {
    const styles = createStyles({
      mode: 'template',
      classNameTemplate: ({ namespace, element, modifier }) => {
        const base = element ? `${namespace}-${element}` : namespace;
        return modifier ? `${base}-is-${modifier}` : base;
      },
    });

    const button = styles.component('button', {
      base: { padding: '8px' },
      variants: { intent: { primary: { color: 'blue' } } },
    });
    expect(button.base).toBe('button');
    expect(button['intent-primary']).toBe('button-is-primary');

    const icon = styles.class('icon', { width: '16px' });
    expect(icon).toBe('icon');
  });
});
```

Make sure `reset`, `registeredNamespaces` are already imported at the top of `styles.test.ts` (they are, per existing tests in that file using the same `beforeEach` pattern) — add them to the import list if this describe block is the first to need them.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter typestyles test -- styles.test.ts`
Expected: FAIL — `mode: 'template'` doesn't throw yet (no validation), and the third test fails because nothing invokes `classNameTemplate` for `styles.component()` yet at the `createStyles` entry point (Task 2's `component.ts` dispatch only fires once `classNaming.mode === 'template'` is actually reachable through `createStyles` without being rejected — it already works structurally, so this specific sub-case may already pass; the required-throw tests are the ones expected to fail).

- [ ] **Step 3: Add the required-check to `createStyles`**

In `packages/typestyles/src/styles.ts`, after the existing `classNaming` construction (currently lines 524-526):

```ts
const cascadeLayers = layers ? resolveCascadeLayers(layers, namingPartial.scopeId) : undefined;
const breakpoints = resolveBreakpoints(breakpointsConfig);
const classNaming = mergeClassNaming({ ...namingPartial, cascadeLayers, breakpoints });
```

add:

```ts
if (classNaming.mode === 'template' && !classNaming.classNameTemplate) {
  throw new Error(
    "[typestyles] `classNameTemplate` is required when `mode: 'template'` — " +
      "e.g. createStyles({ mode: 'template', classNameTemplate: (ctx) => `${ctx.namespace}...` }). " +
      'See specs/classname-template-mode.md.',
  );
}
```

- [ ] **Step 4: Export the new types from `index.ts`**

In `packages/typestyles/src/index.ts`, extend the existing export (currently line 43):

```ts
export type {
  ClassNamingConfig,
  ClassNamingMode,
  ClassNameContext,
  ClassNameTemplate,
} from './class-naming';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter typestyles test -- styles.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the full package test suite + typecheck**

Run: `pnpm --filter typestyles test && pnpm --filter typestyles typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/typestyles/src/styles.ts packages/typestyles/src/index.ts packages/typestyles/src/styles.test.ts
git commit -m "feat: wire mode: 'template' through createStyles with a required-classNameTemplate check"
```

---

## Task 4: Comprehensive `mode: 'template'` test coverage

**Files:**

- Create: `packages/typestyles/src/component-template-variants.test.ts`

**Interfaces:**

- Consumes: `createComponent` from `component.ts`, `mergeClassNaming` from `class-naming.ts` — same pattern as `component-bem-variants.test.ts`.

This mirrors `component-bem-variants.test.ts`'s structure, but exercises it through a **different** convention (SUIT CSS) as well as the BEM-equivalent shape, proving the mechanism is genuinely generic and not just BEM with extra steps.

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createComponent } from './component';
import { mergeClassNaming } from './class-naming';
import { reset, flushSync, getRegisteredCss } from './sheet';
import { registeredNamespaces } from './registry';

const bemEquivalentTemplate = ({
  scope,
  namespace,
  element,
  modifier,
}: {
  scope: string;
  namespace: string;
  element: string | undefined;
  dimension: string | undefined;
  modifier: string | undefined;
}) => {
  const base = element ? `${scope}${namespace}__${element}` : `${scope}${namespace}`;
  return modifier ? `${base}--${modifier}` : base;
};

const suitTemplate = ({
  scope,
  namespace,
  element,
  modifier,
}: {
  scope: string;
  namespace: string;
  element: string | undefined;
  dimension: string | undefined;
  modifier: string | undefined;
}) => {
  const Block = `${scope}${namespace[0].toUpperCase()}${namespace.slice(1)}`;
  if (element) return modifier ? `${Block}-${element}--${modifier}` : `${Block}-${element}`;
  return modifier ? `${Block}--${modifier}` : Block;
};

const templateMode = mergeClassNaming({
  mode: 'template',
  classNameTemplate: bemEquivalentTemplate,
});
const suitMode = mergeClassNaming({ mode: 'template', classNameTemplate: suitTemplate });

describe('createComponent — template-mode dimensioned variants (BEM-equivalent template)', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('produces identical output to mode: bem for the same shape', () => {
    const btn = createComponent(templateMode, 'button', {
      base: { padding: '8px' },
      variants: {
        variant: { primary: { color: 'blue' }, secondary: { color: 'gray' } },
        size: { small: { fontSize: '14px' }, large: { fontSize: '18px' } },
      },
      defaultVariants: { variant: 'primary', size: 'small' },
    });
    expect(btn({ variant: 'primary', size: 'large' })).toBe('button button--primary button--large');
    expect(btn()).toBe('button button--primary button--small');
  });

  it('compound variants compile to a chained selector, no synthetic class', () => {
    const btn = createComponent(templateMode, 'compound-btn', {
      variants: {
        variant: { primary: { color: 'blue' } },
        size: { large: { fontSize: '18px' } },
      },
      compoundVariants: [
        { variants: { variant: 'primary', size: 'large' }, style: { fontWeight: 700 } },
      ],
    });
    flushSync();
    const css = getRegisteredCss();
    expect(css).toContain('.compound-btn--primary.compound-btn--large { font-weight: 700; }');
    expect(Object.keys(btn)).not.toContain('compound-0');
  });

  it('warns in dev when two dimensions collide on the same modifier class', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    createComponent(templateMode, 'collide-template', {
      variants: {
        intent: { primary: { color: 'blue' } },
        theme: { primary: { backgroundColor: 'black' } },
      },
    });
    expect(err).toHaveBeenCalledWith(expect.stringContaining('collide-template--primary'));
    err.mockRestore();
  });

  it('throws in dev when the template returns an invalid class name', () => {
    const invalidMode = mergeClassNaming({
      mode: 'template',
      classNameTemplate: () => '1invalid',
    });
    expect(() => createComponent(invalidMode, 'bad', { base: { padding: '8px' } })).toThrow(
      /invalid CSS class name/,
    );
  });
});

describe('createComponent — template-mode slots (BEM-equivalent template)', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('root slot maps to the bare block class; other slots map to block__element', () => {
    const dialog = createComponent(templateMode, 'dialog', {
      slots: ['root', 'trigger', 'content'],
      base: { root: { display: 'grid' }, trigger: { cursor: 'pointer' } },
    });
    const classes = dialog();
    expect(classes.root).toBe('dialog');
    expect(classes.trigger).toBe('dialog__trigger');
    expect(classes.content).toBe('dialog__content');
  });

  it('multi-slot config (no variants) maps root/element the same way', () => {
    const dialog = createComponent(templateMode, 'dialog-multi', {
      slots: ['root', 'trigger'],
      root: { display: 'grid' },
      trigger: { cursor: 'pointer' },
    });
    const classes = dialog();
    expect(classes.root).toBe('dialog-multi');
    expect(classes.trigger).toBe('dialog-multi__trigger');
  });
});

describe('createComponent — template-mode with a SUIT CSS template (proves genericity beyond BEM)', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('produces PascalCase blocks with SUIT-style modifiers and descendants', () => {
    const btn = createComponent(suitMode, 'button', {
      base: { padding: '8px' },
      variants: { intent: { primary: { color: 'blue' } } },
    });
    expect(btn.base).toBe('Button');
    expect(btn['intent-primary']).toBe('Button--primary');
  });

  it('slot elements use SUIT descendant naming (Block-descendant--modifier)', () => {
    const dialog = createComponent(suitMode, 'dialog', {
      slots: ['root', 'trigger'],
      base: { root: { display: 'grid' } },
      variants: {
        size: { lg: { trigger: { fontSize: '16px' } } },
      },
    });
    const classes = dialog({ size: 'lg' });
    expect(classes.root).toBe('Dialog');
    expect(classes.trigger).toBe('Dialog-trigger Dialog-trigger--lg');
  });
});
```

- [ ] **Step 2: Run the test file to verify it fails first for the right reason, then implement is a no-op**

Run: `pnpm --filter typestyles test -- component-template-variants.test.ts`

This file exercises functionality already implemented in Tasks 1-3 — expect it to **pass immediately** since there's no new production code in this task. If any case fails, that's a real bug in Task 2's refactor to fix before proceeding (do not edit the test to match broken behavior).

Expected: PASS.

- [ ] **Step 3: Run the full suite one more time**

Run: `pnpm --filter typestyles test`
Expected: PASS, all files including `component-bem-variants.test.ts` unmodified.

- [ ] **Step 4: Commit**

```bash
git add packages/typestyles/src/component-template-variants.test.ts
git commit -m "test: add comprehensive mode: 'template' coverage (BEM-equivalent + SUIT CSS)"
```

---

## Task 5: Docs + changeset

**Files:**

- Modify: `docs/content/docs/components.md`
- Create: `.changeset/classname-template-mode.md`

**Interfaces:** None — documentation and release metadata only.

- [ ] **Step 1: Add the `mode: 'template'` docs section**

In `docs/content/docs/components.md`, insert a new section immediately after the existing "## BEM variant naming" section's last paragraph (currently ends at line 234, right before `## Migration quick-start` at line 236):

````md
## Generic classname template

`mode: 'bem'` is itself a preset of a more general mechanism: `mode: 'template'` lets you supply your own `classNameTemplate: (ctx) => string` function, so any block/element/modifier naming convention — SUIT CSS, a prefixed/ITCSS scheme, a house style — works without waiting for `typestyles` to ship a named mode for it.

```ts
const styles = createStyles({
  mode: 'template',
  classNameTemplate: ({ scope, namespace, element, dimension, modifier }) => {
    const base = element ? `${scope}${namespace}__${element}` : `${scope}${namespace}`;
    return modifier ? `${base}--${modifier}` : base;
  },
});
```
````

`classNameTemplate` is called once per emitted class for dimensioned and slot/multi-slot `styles.component()` configs — never for `styles.class()` or flat (non-dimensioned) configs, which stay `semantic`-style. It receives:

- `scope` — the sanitized `scopeId` prefix (already includes a trailing `-`), `''` when unscoped.
- `namespace` — the `styles.component()` name, e.g. `'button'`.
- `element` — the slot name for slot/multi-slot components (`undefined` for the `root` slot or non-slot components).
- `dimension` — the variant dimension name, `undefined` when naming a base/block/element class.
- `modifier` — the variant option value, `undefined` when naming a base/block/element class.

`classNameTemplate` is **required** when `mode: 'template'` — `createStyles` throws immediately without it.

### SUIT CSS

```ts
const styles = createStyles({
  mode: 'template',
  classNameTemplate: ({ scope, namespace, element, modifier }) => {
    const Block = `${scope}${namespace[0].toUpperCase()}${namespace.slice(1)}`;
    if (element) return modifier ? `${Block}-${element}--${modifier}` : `${Block}-${element}`;
    return modifier ? `${Block}--${modifier}` : Block;
  },
});

const button = styles.component('button', {
  base: { padding: '8px' },
  variants: { intent: { primary: { color: '#0066ff' } } },
});
button.base; // "Button"
button['intent-primary']; // "Button--primary"
```

### Prefixed / ITCSS convention

```ts
const styles = createStyles({
  mode: 'template',
  classNameTemplate: ({ scope, namespace, element, modifier }) => {
    const base = element ? `c-${scope}${namespace}-${element}` : `c-${scope}${namespace}`;
    return modifier ? `${base}--${modifier}` : base;
  },
});
```

### Avoiding BEM's collision problem

`mode: 'bem'`'s modifier classes have no dimension namespace, so two dimensions sharing an option name collide (see the collision caveat above). A `classNameTemplate` can fold `dimension` into the class name to avoid this entirely:

```ts
const styles = createStyles({
  mode: 'template',
  classNameTemplate: ({ scope, namespace, element, dimension, modifier }) => {
    const base = element ? `${scope}${namespace}__${element}` : `${scope}${namespace}`;
    return modifier ? `${base}--${dimension}-${modifier}` : base;
  },
});
// variant: { primary } and size: { primary } no longer collide:
// "button--variant-primary" vs "button--size-primary"
```

Like `mode: 'bem'` and `mode: 'attribute'`, `mode: 'template'` is an instance-wide setting — no per-component override.

````

- [ ] **Step 2: Build docs to verify no broken references**

Run: `pnpm --filter docs build` (or the repo's documented docs build command if different — check `docs/package.json` `scripts.build`)
Expected: PASS.

- [ ] **Step 3: Add the changeset**

Create `.changeset/classname-template-mode.md`:

```md
---
'typestyles': minor
---

Add `mode: 'template'` to `createStyles`/`createTypeStyles`: dimensioned and slot `styles.component()` variants compile to class names decided by a user-supplied `classNameTemplate: (ctx) => string` function, instead of a fixed convention. `mode: 'bem'` is now implemented internally as a built-in preset of this same mechanism — its public behavior is unchanged. See `specs/classname-template-mode.md`.
````

- [ ] **Step 4: Commit**

```bash
git add docs/content/docs/components.md .changeset/classname-template-mode.md
git commit -m "docs: document mode: 'template' and add changeset"
```

---

## Self-Review Notes (for whoever executes this plan)

- **Spec coverage:** Task 1 covers the "Public API"/"Core implementation §1" sections; Task 2 covers "Core implementation §2" and the BEM-preserving refactor; Task 3 covers "Core implementation §3" (index.ts export) and the required-`classNameTemplate` check; Task 4 covers the full "Testing" table (base/variants, compound, slots, collision, invalid-output-throw, SUIT CSS fixture) except the two `class-naming.test.ts`-level cases, which Task 1 already covers directly; Task 5 covers "Docs & changeset". `IMPROVEMENTS.md`'s P6 entry (spec's Task 5 note "once merged") is intentionally **not** a task here — it's a post-merge bookkeeping edit, not part of shipping the feature, consistent with how `nameTemplate`'s entry was added after that feature shipped.
- **Type consistency check:** `ClassNameContext`/`TemplateClassNameInput` (Task 1) → `buildTemplateClassName(cfg, input: TemplateClassNameInput)` (Task 1) → called with `{ namespace, element, dimension, modifier }` object literals matching that shape exactly in every Task 2 call site → `ClassNameTemplate` exported from `index.ts` (Task 3) matches the type used in Task 4's test file's inline template functions (same 5-field shape). `devWarnBemModifierCollision` → `devWarnTemplateClassCollision` renamed consistently at its one definition (Task 2 Step 2) and both call sites (Task 2 Steps 3 and 4).
- **No placeholders:** every step above contains complete, runnable code — no "add appropriate handling" or "similar to Task N" shorthand.
