---
'typestyles': minor
---

Unify variant APIs around `styles.component` and add first-class multipart slot support via `slots`.

Breaking changes:
- Remove `styles.recipe` in favor of `styles.component`.
- Remove recipe type aliases (`RecipeConfig`, `RecipeFunction`, `RecipeVariants`) and replace with component terminology (`ComponentVariants`, plus new slot component types).

New capability:
- `styles.component(name, { slots, base, variants, compoundVariants, defaultVariants })` now returns per-slot class maps for multipart components.

Naming update for slot mode:
- Slot base classes now use `{namespace}-{slot}` (without `-base`).
