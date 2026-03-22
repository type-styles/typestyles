---
'typestyles': minor
---

Add dev warnings for unused multipart `slots`, export `slotClass` helper, and export `ComponentSelections` type.

- Warn when a declared slot is never referenced in `base`, `variants`, or `compoundVariants` whenever `NODE_ENV !== 'production'`; silence with `TYPESTYLES_SILENT_UNUSED_SLOTS=1`.
- New `slotClass(component, slot, selections?)` matches `component(selections)[slot]`.
