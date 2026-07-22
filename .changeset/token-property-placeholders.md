---
'typestyles': minor
---

Register `@property` with a syntax-appropriate placeholder `initial-value` (e.g. `transparent` for `<color>`, `0` for `<number>`) instead of always skipping registration for `var()`/`env()`-dependent token values. The real value still reaches the cascade via the existing unconditional `:root` declaration. Add `TokenDescriptor.initial` / `RegisteredPropertyOptions.initial` to override the placeholder explicitly.
