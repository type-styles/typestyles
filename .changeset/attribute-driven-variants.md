---
'typestyles': minor
---

`variantStrategy: 'attribute'` (from the unreleased PR #130) is now `createStyles({ mode: 'attribute' })` / `createTypeStyles({ mode: 'attribute' })` — an instance-wide setting instead of a per-component field, matching how `semantic`/`hashed`/`compact`/`atomic` already work. Every dimensioned `styles.component()` call from that instance compiles `variants` to `&[data-{dimension}="{option}"]` selectors and returns `{ className, attrs, props }`; `slots` is rejected at the type level. `variantStrategy`/`defaultVariantStrategy` no longer exist. See `specs/attribute-driven-variants.md`.
